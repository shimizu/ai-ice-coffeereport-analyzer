# 開発ガイド (Development Guide)

このドキュメントでは、開発環境のセットアップ方法、ローカルでの実行手順、および開発ワークフローについて説明します。

## 1. 前提条件 (Prerequisites)

開発を開始する前に、以下のツールがインストールされていることを確認してください。

*   **Node.js**: v20以上推奨
*   **npm**: Node.jsに同梱
*   **Firebase CLI**: `npm install -g firebase-tools` でインストール
*   **Java**: Firebase Emulators (Firestore, Auth, Functions) の実行に必要 (OpenJDK 11以上推奨)
*   **Google Chrome**: 動作確認用ブラウザ

## 2. インストール (Installation)

リポジトリをクローンした後、プロジェクトルートと `functions` ディレクトリの両方で依存関係をインストールします。

```bash
# ルートディレクトリ（フロントエンド用）
npm install

# Cloud Functions ディレクトリ（バックエンド用）
cd functions
npm install
cd ..
```

## 3. 環境設定 (Environment Setup)

### Firebase プロジェクト
1.  [Firebase Console](https://console.firebase.google.com/) で新しいプロジェクトを作成します。
2.  Authentication (Google Sign-In), Firestore, Functions, Hosting を有効にします。
3.  `.firebaserc` ファイルを確認し、プロジェクトIDが正しいか確認（または `firebase use --add` で設定）します。

### 環境変数 (.env)
プロジェクトルートに `.env` ファイルを作成し、必要なキーを設定します。
`.env.example` を参考にしてください。

```bash
cp .env.example .env
```

**必要な変数:**
*   `VITE_GEMINI_API_KEY`: Google AI Studio で取得した Gemini API キー
*   `VITE_FIREBASE_API_KEY` 等: Firebase コンソール > プロジェクト設定 > 全般 > マイアプリ から取得したWeb SDK設定値

### サービスアカウント (任意ですが推奨)
ローカルのエミュレータやバックエンド開発で管理者権限が必要な場合、Firebaseサービスアカウントキー (`service-account.json`) を `functions/` ディレクトリに配置することを推奨します。
(設定方法は `docs/firebase_setup.md` を参照)

## 4. ローカル開発サーバーの起動

フロントエンド (Vite) とバックエンド (Firebase Emulators) を同時に起動するコマンドを用意しています。

```bash
npm run dev:all
```

*   **Frontend**: http://localhost:5173
*   **Emulator UI**: http://localhost:4000
*   **Functions Endpoint**: http://localhost:5001/<project-id>/<region>/api

### 個別に起動する場合

**フロントエンドのみ:**
```bash
npm run dev
```

**バックエンド（エミュレータ）のみ:**
```bash
npm run server
# または直接 firebase コマンドを使用
firebase emulators:start --only functions,firestore,auth
```

## 5. ディレクトリ構造の概要

```
/
├── src/
│   ├── components/       # UIコンポーネント (Dashboard, Uploadなど)
│   ├── contexts/         # React Context (AuthContextなど)
│   ├── services/         # 外部連携ロジック (API, DB, Gemini)
│   └── types.ts          # TypeScript型定義 (ドメインモデル)
├── functions/            # Cloud Functions (Backend API)
│   ├── app.js            # Express App 本体
│   └── index.js          # Functions エントリポイント
├── docs/                 # ドキュメント
└── public/               # 静的アセット
```
