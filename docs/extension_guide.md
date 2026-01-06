# 拡張ガイド (Extension Guide)

アプリケーションに新しい機能を追加したり、分析ロジックを変更したりするためのガイドラインです。

## 1. 新しいKPIデータの追加手順

コーヒー在庫レポートから新しい項目（例：特定の品種の内訳など）を抽出したい場合のステップです。

### Step 1: 型定義の更新 (`types.ts`)
`CoffeeStockReport` インターフェースに新しいフィールドを追加します。

```typescript
// types.ts
export interface CoffeeStockReport {
  // ...既存フィールド
  new_kpi_field?: {
    value: number;
    description: string;
  };
}
```

### Step 2: Geminiプロンプトとスキーマの修正 (`services/geminiService.ts`)
AIに新しいフィールドを抽出させるよう指示します。

1.  `responseSchema` オブジェクトに、Step 1で追加したフィールド定義を追加します（重要：JSON Schema形式）。
2.  `prompt` 変数内の指示文（Instruction）に、そのフィールドをどのように抽出・解釈すべきか記述を追加します。

### Step 3: UIへの表示 (`components/AnalysisDashboard.tsx`)
`extracted_data.new_kpi_field` にアクセスし、UIに表示します。必要であれば新しいコンポーネントを作成してください。

## 2. 分析ロジック（プロンプト）の調整

AIの「シニア・ストラテジスト」としての振る舞いを調整するには、`services/geminiService.ts` の `prompt` 変数を編集します。

*   **役割の強化**: `# Role` セクションで、より具体的なペルソナ（例：リスク管理担当者、生産者視点など）を指定できます。
*   **分析視点の追加**: `# Analysis Framework` セクションに新しい番号を追加し、着眼点を指示します。
*   **コンテキストの拡張**: 前回データだけでなく、過去3回分のデータや市場価格データなどを渡したい場合は、`getLatestDocument` ロジックを拡張し、`prompt` の `# Context` セクションに注入してください。

## 3. バックエンドAPIの拡張

`functions/app.js` を編集して新しいAPIエンドポイントを追加できます。

*   例: 特定期間のデータをCSVエクスポートする API (`/api/export/csv`)
*   例: 特定の条件（タグなど）で検索する API (`/api/search?q=...`)

```javascript
// functions/app.js
app.get('/api/search', validateFirebaseIdToken, async (req, res) => {
  const query = req.query.q;
  // Firestore query logic...
});
```
