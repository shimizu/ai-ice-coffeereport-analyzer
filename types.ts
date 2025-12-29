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
 * テンプレート利用者がここを自由に拡張することを想定
 */
export interface ExtractedData {
  [key: string]: any;  // 汎用的なキーバリュー
  summary: string;     // ドキュメントの要約
  key_points: string[]; // 重要ポイントのリスト
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
  extracted_data: ExtractedData;
  evaluation: AnalysisEvaluation;
  timestamp: number;        // 解析実行時刻
}