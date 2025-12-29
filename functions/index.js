/**
 * Cloud Functions for Firebase エントリポイント
 *
 * app.js で定義された Express アプリケーションを
 * Cloud Functions の HTTPS トリガーとしてエクスポート
 *
 * デプロイ後のURL構造:
 * - 本番: https://<project-id>.web.app/api/** → この関数にルーティング
 * - firebase.json の rewrites 設定で /api/** が functions.api にマッピングされる
 *
 * ローカル開発では server.js が同じ app.js をインポートして使用
 */

import * as functions from 'firebase-functions';
import app from './app.js';

/**
 * API エンドポイント
 *
 * すべての /api/** リクエストをこの関数で処理
 * app.js で定義されたルート (/api/health, /api/companies など) が実行される
 */
export const api = functions.https.onRequest(app);