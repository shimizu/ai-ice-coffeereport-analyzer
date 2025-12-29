# Coffee Certified Stock Analyzer 作成計画

## 概要
Excelファイル (`coffee_cert_stock_YYYYMMDD.xls`) として提供されるコーヒー認証在庫レポートをGemini 1.5で解析し、データを抽出してFirebase Firestoreに蓄積、ダッシュボードで閲覧・履歴管理できるアプリケーションを構築します。

## 目標
- **入力**: `.xls` / `.xlsx` 形式のコーヒー在庫レポート。
- **処理**: Gemini API を使用して、Excelファイルから「総在庫数」「倉庫別内訳」「格付け結果」などの重要指標を構造化データとして抽出。
- **保存**: 抽出結果をFirestoreに時系列データとして保存。
- **表示**: 直近の解析結果および過去の在庫推移をWeb UIで可視化。

## タスクリスト

### Phase 1: データスキーマ定義
- [ ] **型定義の更新 (`types.ts`)**:
    - 汎用的な `ExtractedData` を廃止し、コーヒー在庫専用の型定義 (`CoffeeStockReport`) を作成。
    - 主なフィールド:
        - `report_date`: レポート日付
        - `total_bags`: 総在庫数 (Bags)
        - `warehouses`: 倉庫別在庫リスト (倉庫名, 在庫数)
        - `grading`: 格付け情報 (Pass/Fail数など)

### Phase 2: Gemini Service の改修 (`services/geminiService.ts`)
- [ ] **Excelファイル対応**:
    - ファイル読み込み処理で Excel ファイル (MIME type: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) をサポート。
- [ ] **プロンプトの専門化**:
    - 「コーヒー認証在庫レポート」を読み解くための専用プロンプトを作成。
    - 出力スキーマ (`responseSchema`) を Phase 1 で定義した型に厳密に合わせる。

### Phase 3: フロントエンド UI の改修
- [ ] **アップロード画面 (`components/UploadSection.tsx`)**:
    - PDF限定制限を解除し、Excelファイルを受け付けるように変更。
    - UIテキストを「在庫レポート (Excel) をアップロード」等に変更。
- [ ] **分析結果表示 (`components/AnalysisDashboard.tsx`)**:
    - 抽出されたコーヒー在庫データを表示する専用ビュー（テーブル、KPIカード）を実装。
- [ ] **履歴・グラフ表示 (`components/HistoryDashboard.tsx`)**:
    - 過去のレポートデータをリスト表示。
    - (オプション) 在庫推移のグラフ化 (`recharts`を使用)。

### Phase 4: バックエンド調整とテスト
- [ ] **API調整 (`functions/app.js`)**:
    - 必要に応じて検索やフィルタリング用のクエリパラメータを追加。
- [ ] **結合テスト**:
    - `refrence/coffee_cert_stock_20251226.xls` を使用してエンドツーエンドの動作確認。
    - Firestoreへの保存と読み出しの検証。
