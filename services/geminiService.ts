/**
 * Google Gemini API による汎用ドキュメント分析サービス
 */

import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

/**
 * PDFファイルを分析し、構造化データと評価を返す
 *
 * @param file アップロードされたドキュメント (PDF)
 * @returns メタデータ、抽出データ、評価結果を含むオブジェクト
 */
export const analyzeDocument = async (file: File): Promise<AnalysisResult> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please set your Gemini API Key.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const base64Data = await fileToBase64(file);

  /**
   * Gemini API への汎用プロンプト
   * 利用シーンに合わせてここを書き換える
   */
  const prompt = `
    提供されたドキュメント（PDF）を注意深く読み、以下の情報を抽出・分析してください。
    
    1. **メタデータ**: タイトル、作成日、著者/発行組織、カテゴリを特定してください。
    2. **内容抽出**:
       - 全体の要約を300文字程度で作成してください。
       - ドキュメント内の重要なポイント（数値、事実、主張など）を箇条書きで抽出してください。
    3. **分析と評価**:
       - このドキュメントの重要性や信頼性を0-100でスコアリングしてください。
       - 判定（positive, neutral, negative, warning）を行ってください。
       - 評価の具体的な理由を記述してください。
       - 関連するタグを最大5つ設定してください。

    出力は必ず指定されたJSONスキーマに従ってください。
    テキストはすべて日本語で出力してください。
  `;

  /**
   * Gemini API の構造化出力スキーマ
   * types.ts の定義に準拠
   */
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      metadata: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "ファイル名や識別番号" },
          title: { type: Type.STRING },
          category: { type: Type.STRING, nullable: true },
          date: { type: Type.STRING, nullable: true },
          author: { type: Type.STRING, nullable: true },
        },
        required: ["id", "title"]
      },
      extracted_data: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          key_points: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["summary", "key_points"]
      },
      evaluation: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          status: { type: Type.STRING, enum: ["positive", "neutral", "negative", "warning"] },
          details: { type: Type.STRING },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["score", "status", "details", "tags"]
      }
    },
    required: ["metadata", "extracted_data", "evaluation"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp", // または最新のモデル
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);

    // IDがない場合はファイル名をベースにする等の処理
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
