# Coffee Certified Stock Analyzer

Gemini API と Firebase を活用した、コーヒー認証在庫レポート分析アプリケーションです。
Excel形式のレポートをアップロードすると、AIが「シニア・コモディティ・ストラテジスト」として分析し、需給インサイト、強気/弱気スコア、在庫データを抽出してデータベース（Firestore）に保存・履歴管理します。

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 特徴

*   **AI解析**: Google Gemini 2.0 Flash を使用してExcelレポートを解析。
    *   **専門的インサイト**: 単なるデータ抽出だけでなく、市場へのインパクト（Bullish/Bearish）を-100〜+100でスコアリング。
    *   **詳細分析**: 地理的・物流リスク、需給バランス、品質構造の変化を日本語で解説。
*   **Excel対応**: `.xls` / `.xlsx` ファイルを直接解析。
*   **認証**: Firebase Authentication (Google Sign-In) によるセキュアなアクセス制御。
*   **データ保存**: 解析結果は Cloud Firestore に構造化データとして保存。レポート日付をキーとして重複を管理。
*   **可視化**: 
    *   強気/弱気スコアメーター
    *   倉庫別在庫シェアテーブル
    *   過去の分析履歴一覧
*   **サーバーレス**: Firebase Hosting と Cloud Functions で動作。

## 技術スタック
*   **Frontend**: React, Vite, Tailwind CSS, Recharts
*   **Backend**: Firebase Cloud Functions (Node.js), Express
*   **Database**: Cloud Firestore
*   **AI**: Google Gemini API (Gemini 2.0 Flash)
*   **Parsing**: xlsx (SheetJS)

## セットアップ手順

### 1. 前提条件
*   Node.js (v20以上)
*   Firebase CLI (`npm install -g firebase-tools`)
*   Google Cloud Project (Firebase)
*   Gemini API Key ([Google AI Studio](https://aistudio.google.com/))

### 2. インストール
```bash
# 依存関係のインストール
npm install

# Backend (Cloud Functions) の依存関係もインストール
cd functions && npm install && cd ..
```

### 3. 環境設定
`.env.example` をコピーして `.env` を作成し、APIキーとFirebase設定を入力します。
詳細は `docs/firebase_setup.md` を参照してください。

```bash
cp .env.example .env
```

### 4. 開発サーバーの起動
フロントエンドとバックエンド（Functionsエミュレータ）を同時に起動します。

```bash
npm run dev
```
*   Frontend: http://localhost:5173
*   Backend: http://localhost:5001/...

## デプロイ

```bash
firebase deploy
```

## ディレクトリ構成
*   `src/`: フロントエンド (React)
    *   `services/geminiService.ts`: AI解析ロジック（ストラテジストプロンプト含む）
    *   `types.ts`: コーヒー在庫レポート専用の型定義
*   `functions/`: バックエンド (Cloud Functions)
    *   `app.js`: APIエンドポイント

