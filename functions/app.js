/**
 * Express バックエンドアプリケーション (汎用ドキュメント分析テンプレート版)
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';

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
 * API ルート定義
 */

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: 'Firestore' });
});

/**
 * 全ドキュメント一覧を取得
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
 */
app.get('/api/history/:id', validateFirebaseIdToken, async (req, res) => {
  try {
    const id = req.params.id;
    // インデックスエラー回避のため、Firestore側でのソートを一時的に無効化し、JS側でソートする
    // 検索条件も metadata.id ではなくトップレベルの id に変更（保存されているデータに id がある前提）
    const snapshot = await db.collection('analyses')
      .where('id', '==', id)
      .get();

    const history = snapshot.docs.map(doc => doc.data());
    
    // タイムスタンプの降順でソート
    history.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    res.json(history);
  } catch (err) {
    console.error("History fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 解析結果を保存
 */
app.post('/api/save', validateFirebaseIdToken, async (req, res) => {
  const data = req.body; // AnalysisResult 型

  try {
    const { metadata, extracted_data, evaluation, id, timestamp } = data;

    // 重複防止のため、レポート日付(report_date)をドキュメントIDとして優先使用する
    // これにより同じ日付のレポートは上書きされる
    const docId = extracted_data.report_date ? extracted_data.report_date.replace(/\//g, '-') : id;

    const batch = db.batch();

    // ドキュメントメタデータの保存
    const docRef = db.collection('documents').doc(docId);
    
    // データ内のIDも統一しておく
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
      // 検索用にトップレベルにもIDと日付を持たせる
      id: docId,
      date: extracted_data.report_date || metadata.date
    }, { merge: true });

    // 詳細解析結果の保存
    // 履歴として残すならタイムスタンプ付きだが、
    // 「上書き」という要望なので、最新版のみを保持するか、あるいは「その日の最新」とするか。
    // 要望は「上書き」なので、analysesコレクション側も日付IDで保存し、履歴を積まない（あるいは同じIDで上書きする）
    
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