/**
 * Firebase Authentication 状態管理コンテキスト
 *
 * アプリケーション全体で認証状態を共有し、以下を提供:
 * - ログイン中のユーザー情報
 * - Google Sign-In によるログイン機能
 * - ログアウト機能
 * - Firebase ID Token の取得 (バックエンドAPI認証に使用)
 * - 認証状態のリアルタイム監視
 *
 * 使用方法:
 * 1. App.tsx で AuthProvider でラップ
 * 2. 各コンポーネントで useAuth() フックを使用
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

/**
 * AuthContext が提供する値の型定義
 */
interface AuthContextType {
  /** ログイン中のユーザー (未ログインの場合は null) */
  user: User | null;
  /** 認証状態の初期化中フラグ (アプリ起動時のみ true) */
  loading: boolean;
  /** Google アカウントでログイン */
  loginWithGoogle: () => Promise<void>;
  /** ログアウト */
  logout: () => Promise<void>;
  /** Firebase ID Token を取得 (バックエンドAPI認証用) */
  getToken: () => Promise<string | null>;
}

/**
 * AuthContext の作成
 * デフォルト値は初期化前の状態を表す
 */
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
  getToken: async () => null,
});

/**
 * AuthContext を使用するためのカスタムフック
 *
 * 各コンポーネントで以下のように使用:
 * ```tsx
 * const { user, loading, loginWithGoogle, logout } = useAuth();
 * ```
 *
 * @returns 認証関連の状態と関数
 */
export const useAuth = () => useContext(AuthContext);

/**
 * AuthProvider コンポーネント
 *
 * App.tsx でアプリケーション全体をラップして使用
 * Firebase Authentication の状態をリアルタイムで監視し、
 * 子コンポーネントに認証情報を提供
 *
 * @param children ラップする子コンポーネント
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Firebase Authentication の状態変化を監視
   *
   * - ページリロード時も認証状態を復元
   * - ログイン/ログアウト時にリアルタイムで状態を更新
   * - クリーンアップ関数で監視を解除
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);  // 初期化完了
    });
    // コンポーネントのアンマウント時に監視を解除
    return () => unsubscribe();
  }, []);

  /**
   * Google アカウントでログイン
   *
   * ポップアップウィンドウを開いて Google アカウント選択画面を表示
   * ログイン成功後、onAuthStateChanged で自動的に user が更新される
   *
   * @throws ログインキャンセルまたは認証エラー
   */
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  /**
   * ログアウト
   *
   * Firebase からサインアウトし、認証セッションをクリア
   * 完了後、onAuthStateChanged で user が null に更新される
   */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  /**
   * Firebase ID Token を取得
   *
   * バックエンドAPI呼び出し時の Authorization ヘッダーに使用
   * (現在は dbService.ts の getHeaders() 内で使用)
   *
   * @returns Firebase ID Token (未ログインの場合は null)
   */
  const getToken = async () => {
    if (!user) return null;
    return await user.getIdToken();
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};
