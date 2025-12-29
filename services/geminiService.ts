/**
 * Google Gemini API によるドキュメント分析サービス
 * コーヒー認証在庫レポート (Excel) 対応版
 */

import { GoogleGenAI, Type } from "@google/genai";
import * as XLSX from "xlsx";
import { AnalysisResult } from "../types";

/**
 * Excelファイルを分析し、構造化データと評価を返す
 *
 * @param file アップロードされたドキュメント (Excel)
 * @returns メタデータ、抽出データ、評価結果を含むオブジェクト
 */
export const analyzeDocument = async (file: File): Promise<AnalysisResult> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please set your Gemini API Key.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // ファイル形式の確認とテキスト変換
  let dataContent = "";
  let mimeType = "";
  
  if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
    dataContent = await parseExcelToCSV(file);
    mimeType = "text/csv";
  } else {
    // PDF等の場合は従来のBase64処理 (今回はExcelメインだが残しておく)
    dataContent = await fileToBase64(file);
    mimeType = "application/pdf";
  }

  /**
   * Gemini API へのプロンプト (コーヒー在庫レポート専用・高度分析版)
   */
  const prompt = `
    # Role
    あなたは、ウォール街のヘッジファンドや商社に所属する「シニア・コモディティ・ストラテジスト」兼「データサイエンティスト」です。
    ICE Futures U.S.が発行する「Coffee 'C' Certified Warehouse Stock Report」のデータ（提供されたCSV）を分析し、トレーダーおよび実需家向けに、需給バランスの変化、価格への潜在的影響、および物流リスクをレポートします。

    # Objective
    提供されたCSV/テキストデータに基づき、単なる数値報告ではなく、**「市場価格にとって強気（Bullish）か弱気（Bearish）か」「異常値（Anomaly）はどこか」**を明確にしたインサイトを提供してください。
    また、市場へのインパクトを -100（超弱気）から +100（超強気）のスコアで定量評価してください。

    # Analysis Framework (The 11 Pillars)
    以下の11の視点を考慮してデータを読み解いてください。データに含まれない項目については、他の数値から論理的に推論するか、データ欠損として扱ってください。
    1.  **在庫トレンド:** 変化率と方向性。
    2.  **品質構成:** データに年代やペナルティ情報があれば、実質的な良質在庫を評価。
    3.  **倉庫の偏在:** 特定の港（Antwerp等）への集中とNY/US港の在庫枯渇リスク。
    4.  **原産国:** ブラジル・中米・コロンビアの比率変化。
    5.  **審査状況:** Pending Gradingの増減と将来の在庫圧力。
    6.  **品種:** アラビカ特有の事情。
    7.  **キャンセル/構造:** 出庫ペースからの需要推測。
    8.  **フロー:** 入庫・出庫バランス。
    9.  **季節性:** 収穫期などの季節要因との乖離。
    10. **価格との乖離:** ダイバージェンスの指摘。
    11. **信頼性:** データの欠損や異常値の指摘。

    # Output Requirements
    出力はJSON形式で、以下の情報を詳細に含めてください。
    **重要: すべてのテキストフィールド（summary, headline, details, insightなど）は、必ず【日本語】で記述してください。英語での出力は禁止です。**
  `;

  /**
   * Gemini API の構造化出力スキーマ
   * types.ts の CoffeeStockReport に準拠しつつ拡張
   */
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      metadata: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          category: { type: Type.STRING },
          date: { type: Type.STRING },
          author: { type: Type.STRING },
        },
        required: ["id", "title"]
      },
      extracted_data: {
        type: Type.OBJECT,
        properties: {
          report_date: { type: Type.STRING },
          total_bags: { type: Type.NUMBER },
          warehouses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                bags: { type: Type.NUMBER }
              },
              required: ["name", "bags"]
            }
          },
          grading: {
            type: Type.OBJECT,
            properties: {
              passed: { type: Type.NUMBER },
              failed: { type: Type.NUMBER },
              total_graded: { type: Type.NUMBER },
              pending: { type: Type.NUMBER, description: "審査待ち(Pending)数" }
            },
            required: ["passed", "failed", "total_graded"]
          },
          // 以下、ストラテジスト分析用の拡張フィールド
          executive_summary: {
            type: Type.OBJECT,
            properties: {
              sentiment: { type: Type.STRING, enum: ["Strong Bullish", "Bullish", "Neutral", "Bearish", "Strong Bearish"] },
              bullish_bearish_score: { type: Type.NUMBER, description: "-100(Bearish) to 100(Bullish)" },
              headline: { type: Type.STRING, description: "最大の注目点 (日本語)" },
              text: { type: Type.STRING, description: "要約テキスト (日本語)" }
            },
            required: ["sentiment", "bullish_bearish_score", "headline", "text"]
          },
          key_metrics: {
            type: Type.OBJECT,
            properties: {
              fresh_vs_transition_ratio: { type: Type.STRING, description: "フレッシュ在庫 vs 移行在庫の比率評価 (日本語)" },
              change_from_previous: { type: Type.STRING, description: "前日比やトレンドの記述 (日本語)" }
            },
            required: ["fresh_vs_transition_ratio", "change_from_previous"]
          },
          deep_dive_analysis: {
            type: Type.OBJECT,
            properties: {
              geo_logistics_risk: { type: Type.STRING, description: "地理的・物流リスク分析 (日本語)" },
              supply_demand_insight: { type: Type.STRING, description: "需給インサイト (日本語)" }
            },
            required: ["geo_logistics_risk", "supply_demand_insight"]
          },
          engineering_suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "エンジニア向け可視化・データ取得提案 (日本語)"
          },
          // 互換性維持のためのフィールド
          summary: { type: Type.STRING, description: "全体要約 (日本語)" },
          key_points: { type: Type.ARRAY, items: { type: Type.STRING }, description: "重要ポイント (日本語)" }
        },
        required: ["report_date", "total_bags", "warehouses", "grading", "executive_summary", "key_metrics", "deep_dive_analysis", "engineering_suggestions", "summary", "key_points"]
      },
      evaluation: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          status: { type: Type.STRING, enum: ["positive", "neutral", "negative", "warning"] },
          details: { type: Type.STRING, description: "評価の詳細 (日本語)" },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "タグ (日本語)"
          }
        },
        required: ["score", "status", "details", "tags"]
      }
    },
    required: ["metadata", "extracted_data", "evaluation"]
  };

  try {
    const parts = [{ text: prompt }];

    // Excel(CSV)の場合はテキストとして、PDFの場合はBlobとして渡す
    if (mimeType === "text/csv") {
        parts.push({ text: `\n\n=== CSV DATA ===\n${dataContent}` });
    } else {
        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: dataContent
            }
        });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);

    // IDがない場合はファイル名をベースにする
    const docId = data.metadata.id || file.name.replace(/\.[^/.]+$/, "");

    return {
      id: docId,
      timestamp: Date.now(),
      ...data
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

/**
 * Excelファイルを読み込み、全シートの内容をCSV形式のテキストとして結合して返す
 */
const parseExcelToCSV = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        let csvContent = "";
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(worksheet);
          csvContent += `\n--- Sheet: ${sheetName} ---\n${csv}`;
        });
        
        resolve(csvContent);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};