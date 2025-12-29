# AI Document Analysis Template

Gemini API と Firebase を活用した、汎用的なドキュメント（PDF）解析アプリケーションのテンプレートです。
PDFをアップロードすると、AIが要約・データ抽出・評価を行い、結果をデータベース（Firestore）に保存して履歴管理できます。

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 特徴

*   **AI解析**: Google Gemini 2.0 Flash を使用してPDFを解析。要約、キーポイント抽出、スコアリングを自動で行います。
*   **認証**: Firebase Authentication (Google Sign-In) によるセキュアなアクセス制御。
*   **データ保存**: 解析結果は Cloud Firestore にJSON形式で構造化して保存されます。
*   **履歴管理**: 過去の解析結果を一覧表示し、いつでも詳細を確認できます。
*   **サーバーレス**: Firebase Hosting と Cloud Functions で動作するため、インフラ管理が不要です。

## テンプレートとしてのカスタマイズ方法

このプロジェクトは、ドキュメント解析アプリの「ボイラープレート」として設計されています。
自身の用途（請求書処理、契約書レビュー、論文要約など）に合わせて、以下の部分をカスタマイズしてください。

1.  **プロンプトと抽出データの定義** (`services/geminiService.ts`, `types.ts`):
    *   AIに抽出させたい項目（日付、金額、特定の条項など）に合わせて、`responseSchema` と `Prompt` を変更します。
    *   対応する型定義 (`ExtractedData` interface) を更新します。

2.  **UIの調整** (`components/AnalysisDashboard.tsx`):
    *   抽出したデータに合わせて、表示コンポーネントを修正します。

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
    *   `services/geminiService.ts`: AI解析ロジック（プロンプトはここにあります）
*   `functions/`: バックエンド (Cloud Functions)
    *   `app.js`: APIエンドポイント
*   `firestore.rules`: データベースセキュリティルール
