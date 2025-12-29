/**
 * 汎用ドキュメント解析テンプレート用型定義
 */

/**
 * ドキュメントの基本メタデータ
 */
export interface DocumentMetadata {
  id: string;          // 一意識別子 (例: ファイル名、または特定コード)
  title: string;       // ドキュメントのタイトル
  category?: string;   // カテゴリ (例: レポート, 請求書, 論文)
  date?: string;       // 発行日や関連日
  author?: string;     // 作成者や発行組織
}

/**
 * Geminiによって抽出された構造化データ
 * コーヒー在庫レポート専用
 */
export interface CoffeeStockReport {
  report_date: string;     // レポートの日付 (YYYY-MM-DD)
  total_bags: number;      // 総在庫数 (Bags)
  
  // 倉庫別在庫
  warehouses: {
    name: string;          // 倉庫名 (例: ANTWERP, HAMBURG)
    bags: number;          // 在庫数
  }[];

  // 格付け結果 (Grading Results)
  grading: {
    passed: number;        // 合格数
    failed: number;        // 不合格数
    total_graded: number;  // 総格付け数
    pending?: number;      // 審査待ち (オプション)
  };
  
  // --- シニアストラテジスト分析用フィールド ---
  executive_summary: {
    sentiment: "Strong Bullish" | "Bullish" | "Neutral" | "Bearish" | "Strong Bearish";
    headline: string;
    text: string;
  };

  key_metrics: {
    fresh_vs_transition_ratio: string;
    change_from_previous: string;
  };

  deep_dive_analysis: {
    geo_logistics_risk: string;
    supply_demand_insight: string;
  };

  engineering_suggestions: string[];
  // ----------------------------------------

  summary: string;         // レポートの要約 (互換性のため維持)
  key_points: string[];    // 重要ポイントのリスト (互換性のため維持)
}

/**
 * 分析・評価結果
 */
export interface AnalysisEvaluation {
  score: number;       // 評価スコア (0-100)
  status: 'positive' | 'neutral' | 'negative' | 'warning'; // 判定
  details: string;     // 評価の根拠や詳細
  tags: string[];      // 関連タグ
}

/**
 * 最終的な解析結果オブジェクト
 */
export interface AnalysisResult {
  id: string;               // Firestore ドキュメント ID
  metadata: DocumentMetadata;
  extracted_data: CoffeeStockReport;
  evaluation: AnalysisEvaluation;
  timestamp: number;        // 解析実行時刻
}