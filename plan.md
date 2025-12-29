# Gemini Document Analysis Template 作成計画

この計画は、現在の「AI Financial Analyst」を、GeminiとFirebaseを使用した汎用的な「ドキュメント分析・データ抽出・履歴管理アプリケーション」のテンプレート（ボイラープレート）へ変換するためのロードマップです。

## 概要
*   **目標**: 任意のドキュメント（PDF等）をアップロードし、Geminiで解析、結果をFirestoreに保存・閲覧できるWebアプリの雛形を作成する。
*   **技術スタック**: React, Vite, Tailwind CSS, Firebase (Auth, Firestore, Functions, Hosting), Gemini API.

## 手順

### Phase 1: プロジェクトの初期化とクリーンアップ
現在の財務分析特有のデータや設定を削除・リセットします。
- [ ] 既存の `git` 管理下から離脱（または新規ブランチでの作業準備）。
- [ ] 財務関連のアセット（サンプルデータ、特有の画像など）の削除。
- [ ] プロジェクト固有のドキュメント (`GEMINI.md` 等) の整理。

### Phase 2: ドメインロジックの抽象化 (Frontend & Service)
「財務分析」に特化したロジックを汎用的なものに置き換えます。
- [ ] **Gemini Service (`services/geminiService.ts`)**:
    - [ ] プロンプトを「財務諸表分析」から「汎用ドキュメント解析」へ変更（例: 要約、キーバリュー抽出、カテゴリ分類）。
    - [ ] 出力スキーマ (`responseSchema`) をカスタマイズしやすい形（例: `summary`, `extracted_data`, `tags`）に変更。
- [ ] **型定義 (`types.ts`)**:
    - [ ] `FinancialData`, `CompanyInfo` 等を `DocumentMetadata`, `AnalysisResult` 等にリネーム・再定義。
- [ ] **UI コンポーネント**:
    - [ ] `AnalysisDashboard.tsx` -> `DocumentDashboard.tsx` (ファイルアップロードと結果表示)。
    - [ ] `MetricCard.tsx` -> `DataCard.tsx` (汎用的なデータ表示)。
    - [ ] `HistoryDashboard.tsx` -> `AnalysisHistory.tsx` (過去の分析履歴リスト)。
    - [ ] グラフ描画機能の削除または汎用的な可視化コンポーネントへの置き換え。

### Phase 3: バックエンドとデータベースの汎用化
FirestoreとCloud Functionsを汎用的なスキーマに対応させます。
- [ ] **Firestore スキーマ設計**:
    - [ ] `companies` コレクション -> 廃止または `categories` 等へ変更。
    - [ ] `financials` コレクション -> `analyses` (分析結果格納用) へ変更。
- [ ] **Cloud Functions (`functions/app.js`)**:
    - [ ] エンドポイント `/api/history/:code` -> `/api/analyses` (ユーザーIDやカテゴリでのフィルタリング)。
    - [ ] `/api/save` のロジックを汎用スキーマに合わせて修正。
    - [ ] `/api/companies` -> 不要になるため削除または汎用検索APIへ変更。

### Phase 4: テンプレートとしての整備
開発者がこのテンプレートを使って自分のアプリを作り始めやすくします。
- [ ] **設定の外部化**: プロンプトや抽出スキーマを `config` ファイル等で定義できるように分離を検討。
- [ ] **ドキュメント (`README.md`)**:
    - [ ] テンプレートの目的と使い方の記述。
    - [ ] プロンプトのカスタマイズ方法の説明。
- [ ] **UI/UXの調整**:
    - [ ] アプリケーションタイトルやロゴのプレースホルダー化。
    - [ ] 日本語ハードコード部分の検討（i18n対応または設定ファイル化）。

### Phase 5: 新規リポジトリへの移行
- [ ] 不要なファイル（`.git` ディレクトリ含む）を削除。
- [ ] 新規 `git init`。
- [ ] 初期コミットの作成。
- [ ] GitHubでの新規リポジトリ作成手順のドキュメント化。
