/**
 * Express バックエンドアプリケーション
 * 
 * 役割:
 * Firebase Cloud Functions 上で動作するAPIサーバーです。
 * Firestore へのデータの保存、取得、およびユーザー認証の検証を担当します。
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';

/**
 * Firebase Admin SDK の初期化
 * ローカル開発環境と本番環境の両方で動作するようにサービスアカウントのパスを複数チェックします。
 */
const serviceAccountPaths = [
  './service-account.json',
  './functions/service-account.json'
];

let serviceAccount = null;

for (const path of serviceAccountPaths) {
  if (existsSync(path)) {
    try {
      serviceAccount = JSON.parse(readFileSync(path, 'utf8'));
      console.log(`Loaded service account from: ${path}`);
      break;
    } catch (e) {
      console.warn(`Failed to parse service account at ${path}:`, e);
    }
  }
}

if (getApps().length === 0) {
  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount)
    });
  } else {
    // サービスアカウントが見つからない場合は、デフォルトの資格情報を使用（本番環境など）
    console.log('No service account found, using default credentials');
    initializeApp();
  }
}

const db = getFirestore();
const app = express();

app.use(cors({ origin: true }));
app.use(bodyParser.json({ limit: '50mb' }));

/**
 * Firebase ID Token 検証ミドルウェア
 * 
 * フロントエンドからのリクエストに含まれる Authorization ヘッダー（Bearerトークン）を検証し、
 * 正当なユーザーであるかを確認します。検証に成功すると req.user にユーザー情報を格納します。
 */
const validateFirebaseIdToken = async (req, res, next) => {
  if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
      !(req.cookies && req.cookies.__session)) {
    res.status(403).send('Unauthorized');
    return;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else if(req.cookies) {
    idToken = req.cookies.__session;
  } else {
    res.status(403).send('Unauthorized');
    return;
  }

  try {
    const decodedIdToken = await getAuth().verifyIdToken(idToken);
    req.user = decodedIdToken;
    next();
  } catch (error) {
    res.status(403).send('Unauthorized');
  }
};

/**
 * ヘルスチェック
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: 'Firestore' });
});

/**
 * 全ドキュメントのメタデータ一覧を取得
 * ダッシュボードの履歴一覧表示に使用されます。
 */
app.get('/api/documents', validateFirebaseIdToken, async (req, res) => {
  try {
    const snapshot = await db.collection('documents').orderBy('timestamp', 'desc').get();
    const documents = snapshot.docs.map(doc => doc.data());
    res.json(documents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 特定ドキュメントの解析履歴を取得
 * docId をキーに、詳細な解析結果を返します。
 */
app.get('/api/history/:id', validateFirebaseIdToken, async (req, res) => {
  try {
    const id = req.params.id;
    const snapshot = await db.collection('analyses')
      .where('id', '==', id)
      .get();

    const history = snapshot.docs.map(doc => doc.data());
    
    // タイムスタンプの降順でソート（最新が先頭）
    history.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    res.json(history);
  } catch (err) {
    console.error("History fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 最新の解析結果を1件取得（前回データとのトレンド比較用）
 * 日付（timestamp）が最も新しい1件を返します。
 */
app.get('/api/latest', validateFirebaseIdToken, async (req, res) => {
  try {
    const snapshot = await db.collection('analyses')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json(null);
    }

    const latestDoc = snapshot.docs[0].data();
    res.json(latestDoc);
  } catch (err) {
    console.error("Fetch latest analysis failed:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 解析結果の保存
 * 
 * 役割:
 * Geminiで抽出された構造化データを Firestore の2つのコレクションに保存します。
 * 1. 'documents': 一覧表示用の軽量なメタデータ
 * 2. 'analyses':  詳細な解析結果全量
 * 
 * レポート日付(report_date)をドキュメントIDとして使用することで、同じ日のレポートは上書きされます。
 */
app.post('/api/save', validateFirebaseIdToken, async (req, res) => {
  const data = req.body; // AnalysisResult 型のデータ

  try {
    const { metadata, extracted_data, evaluation, id, timestamp } = data;

    // レポート日付を ID に変換 (例: 2025/12/26 -> 2025-12-26)
    const docId = extracted_data.report_date ? extracted_data.report_date.replace(/\//g, '-') : id;

    const batch = db.batch();

    // 1. メタデータの更新
    const docRef = db.collection('documents').doc(docId);
    
    const savedData = {
      ...data,
      id: docId, 
      metadata: {
        ...metadata,
        id: docId
      }
    };

    batch.set(docRef, {
      ...savedData.metadata,
      timestamp: timestamp || Date.now(),
      last_evaluation: evaluation.status,
      id: docId,
      date: extracted_data.report_date || metadata.date,
      bullish_bearish_score: extracted_data.executive_summary?.bullish_bearish_score ?? 0,
      summary_headline: extracted_data.executive_summary?.headline || "",
      sentiment: extracted_data.executive_summary?.sentiment || "Neutral"
    }, { merge: true });

    // 2. 詳細データの更新
    const analysisRef = db.collection('analyses').doc(docId);
    batch.set(analysisRef, {
      ...savedData,
      userId: req.user.uid
    });

    await batch.commit();
    res.json({ success: true, id: docId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;