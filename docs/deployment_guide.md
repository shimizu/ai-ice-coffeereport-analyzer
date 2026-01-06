# デプロイ・運用ガイド (Deployment Guide)

アプリケーションを Firebase Hosting および Cloud Functions にデプロイする手順です。

## 1. デプロイ手順

### ステップ 1: ビルド
フロントエンドのプロダクションビルドを作成します。

```bash
npm run build
```

### ステップ 2: Firebaseへのログイン
まだログインしていない場合、Firebase CLI でログインします。

```bash
firebase login
```

### ステップ 3: デプロイ実行
Hosting (静的ファイル) と Functions (バックエンドAPI)、Firestore Rules 等を一括でデプロイします。

```bash
firebase deploy
```

特定の機能だけデプロイしたい場合:
```bash
# Hostingのみ
firebase deploy --only hosting

# Functionsのみ
firebase deploy --only functions
```

## 2. 環境変数の管理

本番環境の Cloud Functions で API キーなどの機密情報を使用する場合、Firebase Functions Secrets の使用を推奨します（現在の構成は簡易的に `.env` またはコード埋め込みを使用していますが、本番運用の際は以下への移行を検討してください）。

```bash
# シークレットの設定
firebase functions:secrets:set GEMINI_API_KEY

# functions/index.js での参照設定が必要になります
```

## 3. Firestore インデックス

高度なクエリ（複合条件での並び替えなど）を行う場合、Firestore インデックスの作成が必要になることがあります。
ローカル実行時にコンソールに表示されるインデックス作成リンクをクリックするか、`firestore.indexes.json` を編集して `firebase deploy --only firestore:indexes` を実行してください。

## 4. トラブルシューティング

### デプロイ後の Functions エラー
Cloud Console の [Logs Explorer](https://console.cloud.google.com/logs) でログを確認してください。
`GEMINI_API_KEY` が設定されていない、または権限不足のエラーが一般的です。

### CORS エラー
API呼び出し時に CORS エラーが発生する場合、`functions/app.js` の `cors` 設定を確認してください。現在は `origin: true` (全許可) になっていますが、本番では特定のドメインに制限することを検討してください。
