/**
 * Google Gemini API によるドキュメント分析サービス
 * コーヒー認証在庫レポート (Excel) 対応版
 */

import { GoogleGenAI, Type } from "@google/genai";
import * as XLSX from "xlsx";
import { AnalysisResult } from "../types";
import { getLatestDocument } from "./dbService";

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

  // 前回レポートの取得（コンテキストとして使用）
  const previousReport = await getLatestDocument();
  let previousContext = "";
  
  if (previousReport && previousReport.extracted_data) {
    const nyStock = previousReport.extracted_data.warehouses?.find((w: any) => w.name.toUpperCase().includes("NEW YORK"))?.bags || "N/A";
    const antStock = previousReport.extracted_data.warehouses?.find((w: any) => w.name.toUpperCase().includes("ANTWERP"))?.bags || "N/A";

    previousContext = `
    === PREVIOUS REPORT CONTEXT (Reference for Trend Analysis) ===
    Date: ${previousReport.extracted_data.report_date}
    Total Bags: ${previousReport.extracted_data.total_bags}
    Sentiment Score: ${previousReport.extracted_data.executive_summary?.bullish_bearish_score}
    Sentiment: ${previousReport.extracted_data.executive_summary?.sentiment}
    NY Warehouse Stock: ${nyStock}
    Antwerp Warehouse Stock: ${antStock}
    Key Insight: ${previousReport.extracted_data.executive_summary?.headline}
    ============================================================
    `;
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

    # Context (Previous Analysis)
    ${previousContext ? `
    **前回のレポートデータが提供されています（PREVIOUS REPORT CONTEXT）。**
    今回のデータと前回データを比較し、以下の点について必ず言及してください（前回比、前日比など）：
    1.  **総在庫のトレンド:** 前回と比較して増えているか減っているか。
    2.  **NY倉庫在庫の変化:** 最重要ポイントとして比較してください。
    3.  **センチメントの変化:** 前回よりスコアが変動した場合、その要因（Transition比率の変化や特定倉庫の動きなど）を説明してください。
    ` : `
    ※ 今回は前回データが存在しない（または取得できない）ため、単発のデータとして分析してください。
    `}

    # Analysis Framework (The 11 Pillars & Special Insights)
    以下の視点を考慮してデータを読み解いてください。
    1.  **在庫トレンド:** 変化率と方向性。連続減少は需給逼迫シグナル。
    2.  **品質構成 (Transition比率):** Total Bags に対する Transition Bags の比率を最重要視してください。
        - **80%超:** 質的に悪い在庫構成。
        - **90%近辺:** 実質的な在庫不足と判断。
    3.  **倉庫の役割と「意味のある比較」:**
        - **禁止事項:** 単純な倉庫間の在庫量ランキングや、「ANTはNYより多い」といった過不足比較は無意味なので禁止します。
        - **評価視点:** 各倉庫の「役割」の変化を見てください。
            - **NY (ニューヨーク):** 最重要。「絶対量」を見てください。ここが減ると価格が荒れやすい（期近供給源）。
            - **HOU / MIAMI / NOLA:** 「NYへの供給予備軍」として、NYとの連動を見てください。
            - **ANT / HA / BR:** 「欧州滞留在庫」です。ここが増えてもNYのタイトさは解消されません（見かけ倒しの在庫増）。
        - **推奨される比較:** 「期近(NY) vs 滞留(ANT)」、「米国デリバリー力(NY+HOU)」の推移。
    4.  **国別内訳:** コロンビア・中米の枯渇は基準品質の不足を意味する。
    5.  **審査状況 (Grading):** Passed（新規供給）とPending（将来の候補）のバランス。
    6.  **価格へのインパクト:** -100（超弱気）から +100（超強気）で定量評価。

    # Output Requirements
    出力はJSON形式で、以下の情報を詳細に含めてください。
    **重要: すべてのテキストフィールドは、必ず【日本語】で記述してください。**
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
          // 互換性維持のためのフィールド
          summary: { type: Type.STRING, description: "全体要約 (日本語)" },
          key_points: { type: Type.ARRAY, items: { type: Type.STRING }, description: "重要ポイント (日本語)" }
        },
        required: ["report_date", "total_bags", "warehouses", "grading", "executive_summary", "key_metrics", "deep_dive_analysis", "summary", "key_points"]
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