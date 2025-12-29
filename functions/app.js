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

const serviceAccountPath = './service-account.json';

if (getApps().length === 0) {
  if (existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      initializeApp({
        credential: cert(serviceAccount)
      });
    } catch (e) {
      initializeApp();
    }
  } else {
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
    const snapshot = await db.collection('analyses')
      .where('metadata.id', '==', id)
      .orderBy('timestamp', 'desc')
      .get();

    const history = snapshot.docs.map(doc => doc.data());
    res.json(history);
  } catch (err) {
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

    const batch = db.batch();

    // ドキュメントメタデータの保存
    const docRef = db.collection('documents').doc(id);
    batch.set(docRef, {
      ...metadata,
      timestamp: timestamp || Date.now(),
      last_evaluation: evaluation.status
    }, { merge: true });

    // 詳細解析結果の保存
    const analysisRef = db.collection('analyses').doc(`${id}-${timestamp}`);
    batch.set(analysisRef, {
      ...data,
      userId: req.user.uid // ユーザーIDを紐付け
    });

    await batch.commit();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;