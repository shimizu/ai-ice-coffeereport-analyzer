/**
 * Firebase SDK 初期化モジュール
 *
 * Firebase Authentication (Google Sign-In) を使用してアクセス制御を実現
 * フロントエンドからのすべての認証処理はこのモジュールを経由する
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

/**
 * Firebase プロジェクト設定
 * 環境変数 (.env) から読み込み
 * 本番環境では Firebase Hosting の環境変数から自動取得
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebase アプリケーションの初期化
const app = initializeApp(firebaseConfig);

/**
 * Firebase Authentication インスタンス
 * AuthContext で使用され、ログイン状態を管理
 */
export const auth = getAuth(app);

/**
 * Google 認証プロバイダー
 * Login コンポーネントで signInWithPopup と組み合わせて使用
 */
export const googleProvider = new GoogleAuthProvider();
