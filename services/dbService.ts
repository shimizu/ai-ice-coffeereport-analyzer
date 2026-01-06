/**
 * バックエンドAPI通信サービス (汎用ドキュメント分析テンプレート版)
 */

import { AnalysisResult } from '../types';
import { auth } from './firebase';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

const getHeaders = async () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * バックエンド接続確認
 */
export const initDB = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/api/health`);
    return res.ok;
  } catch (e) {
    console.warn("Backend server not reachable at " + API_URL);
    return false;
  }
};

/**
 * 解析結果を Firestore に保存
 */
export const saveAnalysisResult = async (data: AnalysisResult) => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/api/save`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }
  } catch (e: any) {
    console.error("DB Save failed:", e);
    throw new Error(e.message || "Failed to connect to backend database");
  }
};

/**
 * 全ドキュメントの一覧を取得
 */
export const getAllDocuments = async () => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/api/documents`, { headers });
    if (!response.ok) return [];
    return await response.json();
  } catch (e) {
    console.error("Fetch documents failed", e);
    return [];
  }
};

/**
 * 特定ドキュメントの解析履歴を取得
 */
export const getDocumentHistory = async (id: string) => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/api/history/${id}`, { headers });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Fetch history failed: ${response.status} ${response.statusText}`, errorText);
      return [];
    }
    return await response.json();
  } catch (e) {
    console.error("Fetch history failed", e);
    return [];
  }
};

/**
 * 最新の解析結果を取得 (前回データ比較用)
 */
export const getLatestDocument = async (): Promise<AnalysisResult | null> => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/api/latest`, { headers });
    if (!response.ok) {
      // 404等はデータなしとして扱う
      return null;
    }
    const data = await response.json();
    return data; // データがない場合はnullが返ってくる想定
  } catch (e) {
    console.error("Fetch latest document failed", e);
    return null;
  }
};