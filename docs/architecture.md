# アーキテクチャ概要 (Architecture Overview)

## システム構成

このアプリケーションは、**Firebase** を基盤としたサーバーレスアーキテクチャを採用しています。
フロントエンドは **React (Vite)** で構築され、AI解析には **Google Gemini API** を使用しています。

### コンポーネント図

```mermaid
graph TD
    Client[Client Browser (React)] -->|Upload Excel| GeminiService[Gemini Analysis Service]
    GeminiService -->|API Call| GeminiAPI[Google Gemini API]
    GeminiAPI -->|Structured JSON| GeminiService
    
    Client -->|Save Result| BackendAPI[Cloud Functions (Express)]
    BackendAPI -->|Write| Firestore[(Cloud Firestore)]
    
    Client -->|Fetch History| BackendAPI
    BackendAPI -->|Read| Firestore
    
    Client -->|Auth| FirebaseAuth[Firebase Authentication]
```

## データフロー

1.  **アップロード & 解析**:
    *   ユーザーが Excel ファイルをドラッグ＆ドロップ。
    *   ブラウザ上で `xlsx` ライブラリを用いてCSVテキストに変換。
    *   `services/dbService.ts` 経由で**前回の分析データ**を取得（コンテキスト用）。
    *   変換されたテキストと前回データをプロンプトに含め、Gemini API (`gemini-2.0-flash-exp`) に送信。
    *   Gemini API が JSON 形式で構造化データ（`CoffeeStockReport`）を返却。

2.  **保存**:
    *   解析結果を確認後、自動的にバックエンドAPI (`/api/save`) へ送信。
    *   バックエンドは Firestore の `documents` (一覧用) と `analyses` (詳細用) の2つのコレクションにデータを保存。
    *   **キー設計**: 重複を防ぐため、レポート日付 (`report_date`) をドキュメントIDとして使用。

## データベース設計 (Firestore Schema)

### 1. `documents` Collection
一覧表示や検索に使用する、軽量なメタデータのみを格納します。

| Field | Type | Description |
|---|---|---|
| `id` | string | レポート日付 (例: "2025-12-26") |
| `date` | string | レポート日付 |
| `bullish_bearish_score` | number | 強気/弱気スコア (-100 to 100) |
| `summary_headline` | string | エグゼクティブサマリーのヘッドライン |
| `timestamp` | number | 解析実行日時 |
| `last_evaluation` | string | 評価ステータス (positive/negative/neutral) |

### 2. `analyses` Collection
解析されたすべての詳細データを格納します。

| Field | Type | Description |
|---|---|---|
| `id` | string | `documents` と同じID |
| `extracted_data` | map | `CoffeeStockReport` 型の全データ (倉庫別在庫、格付け詳細など) |
| `evaluation` | map | AIによる評価詳細、タグ |
| `metadata` | map | ファイルメタデータ |
| `userId` | string | 解析を実行したユーザーのUID |

## 技術スタック詳細

*   **Frontend**:
    *   React 19, TypeScript
    *   Vite (Build Tool)
    *   Tailwind CSS (Styling)
    *   Recharts (Visualization)
    *   SheetJS / xlsx (Excel Parsing)
    *   Firebase SDK (Auth)

*   **Backend (Functions)**:
    *   Node.js 20
    *   Express.js
    *   Firebase Admin SDK

*   **AI**:
    *   Google Generative AI SDK (`@google/genai`)
    *   Model: `gemini-2.0-flash-exp`
