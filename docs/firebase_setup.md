# AI Financial Analyst - Firebase Setup Guide

このドキュメントでは、**AI Financial Analyst** アプリケーションをFirebase環境で構築・実行するための手順を説明します。
別の技術者がゼロから環境を構築する際の手順書として使用してください。

## 1. 前提条件

*   **Google アカウント**: Firebaseプロジェクトの作成に必要です。
*   **Gemini API Key**: [Google AI Studio](https://aistudio.google.com/) で取得してください。
*   **Node.js**: v20以上推奨（Cloud Functionsのランタイム要件）。
*   **Firebase CLI**: まだインストールしていない場合は以下のコマンドでインストールします。
    ```bash
    npm install -g firebase-tools
    ```

## 2. Firebase プロジェクトの作成

1.  [Firebase Console](https://console.firebase.google.com/) にアクセスし、「プロジェクトを追加」をクリックします。
2.  プロジェクト名を入力します（例: `ai-financial-analyst`）。
3.  Google アナリティクスの設定は任意です（このアプリでは必須ではありません）。
4.  「プロジェクトを作成」をクリックします。

## 3. アプリケーションの設定

### Webアプリの登録

1.  プロジェクトの概要ページで、Webアイコン（`</>`）をクリックしてWebアプリを追加します。
2.  アプリのニックネームを入力します（例: `AI Financial Web`）。
3.  「Firebase Hosting も設定します」のチェックは**外して**構いません（後ほどCLIで設定します）。
4.  「アプリを登録」をクリックします。
5.  表示される `firebaseConfig` オブジェクトの内容（`apiKey`, `authDomain` など）を控えておきます。これらは `.env` ファイルの設定に使用します。

### 課金設定 (Blazeプラン)

このアプリケーションは Cloud Functions (Node.js 20) を使用しており、外部API (Gemini API) と通信を行うため、Firebaseプロジェクトを **Blazeプラン（従量課金）** にアップグレードする必要があります。

1.  Firebase Console 左下の「アップグレード」をクリックします。
2.  Blazeプランを選択し、請求先アカウントを紐付けます。

## 4. 機能ごとの設定

### Authentication (認証)

Google アカウントでのログインを有効にします。

1.  Firebase Console 左メニューから **Authentication** を選択し、「始める」をクリックします。
2.  「ログイン方法」タブで **Google** を選択します。
3.  「有効にする」スイッチをオンにします。
4.  プロジェクトのサポートメールアドレスを選択し、「保存」をクリックします。

### Firestore Database (データベース)

分析データとユーザー情報を保存するデータベースを作成します。

1.  左メニューから **Firestore Database** を選択し、「データベースの作成」をクリックします。
2.  ロケーションを選択します。ユーザーが日本にいる場合は `asia-northeast1` (Tokyo) を推奨します。
3.  **セキュリティルール**の設定画面では、「本番環境モードで開始」を選択して作成します。
    *   *注: 正しいセキュリティルールは、このリポジトリの `firestore.rules` ファイルに含まれており、デプロイ時に適用されます。*

## 5. ローカル開発環境のセットアップ

リポジトリをクローンした後、以下の手順で環境変数を設定します。

### 環境変数の設定

1.  ルートディレクトリにある `.env.example` をコピーして `.env` ファイルを作成します。
    ```bash
    cp .env.example .env
    ```
2.  `.env` ファイルを開き、先ほど取得した **Gemini API Key** と **Firebase Config** の値を入力します。

```env
# Gemini API Key (Google AI Studio)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Config (Firebase Console)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 依存関係のインストール

プロジェクトルートと `functions` ディレクトリの両方で依存関係をインストールします。

```bash
# ルート (Frontend & Build tools)
npm install

# Backend (Cloud Functions)
cd functions
npm install
cd ..
```

### Firebase CLI の設定

1.  Firebaseにログインします。
    ```bash
    firebase login
    ```
2.  現在のディレクトリをFirebaseプロジェクトに関連付けます。
    ```bash
    firebase use --add
    ```
    *   先ほど作成したプロジェクトを選択します。
    *   エイリアス名には `default` などを指定します。

## 6. アプリケーションの実行

### ローカル開発サーバー

フロントエンドとバックエンド（Functionsエミュレータ）を同時に起動します。

```bash
npm run dev
```

*   Frontend: `http://localhost:5173`
*   Backend (Emulator): `http://localhost:5001/your-project/asia-northeast1/api`

### 本番環境へのデプロイ

以下のコマンドですべてのリソース（Hosting, Functions, Firestore Rules, Indexes）をデプロイします。

```bash
firebase deploy
```

デプロイ完了後、ターミナルに表示される `Hosting URL` にアクセスして動作を確認してください。

## 7. トラブルシューティング

*   **Cloud Functions のデプロイエラー**:
    *   Blazeプランになっているか確認してください。
    *   `functions/package.json` の Node.js エンジンバージョンが正しいか確認してください。
*   **CORS エラー**:
    *   バックエンド API は `cors` ミドルウェアを使用していますが、ブラウザのコンソールでCORSエラーが出る場合は、Cloud Functionsのログを確認してください。
*   **Gemini API エラー**:
    *   `.env` ファイルの `VITE_GEMINI_API_KEY` が正しいか確認してください。
    *   APIキーに適切な権限（Generative Language API）があるか確認してください。
