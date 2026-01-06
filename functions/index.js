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

/**
 * Cloud Functions エントリポイント
 * 
 * 役割:
 * Firebase Cloud Functions の関数定義を行います。
 * HTTPS リクエストを Express アプリケーション (app.js) にルーティングします。
 */

import { onRequest } from "firebase-functions/v2/https";
import app from "./app.js";

/**
 * api 関数
 * 
 * 外部からの HTTPS リクエスト（例: https://<region>-<project-id>.cloudfunctions.net/api/...）
 * を受け取り、Express アプリに処理を委譲します。
 * 
 * 設定:
 * - memory: 512MiB (解析処理などでメモリが必要な場合は調整)
 * - cors: true (クロスドメインリクエストを許可)
 */
export const api = onRequest({
    memory: "512MiB",
    cors: true 
}, app);