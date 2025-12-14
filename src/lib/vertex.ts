import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
// Reverting to us-central1 as global failed (returned HTML 404)
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const MODEL_ID = 'gemini-2.5-pro';

let vertexAI: VertexAI | null = null;
let model: GenerativeModel | null = null;

function getModel() {
  if (!model) {
    if (!PROJECT_ID) {
      console.warn("GOOGLE_CLOUD_PROJECT is not set. AI features will fail.");
      return null;
    }
    console.log(`🚀 Initializing Vertex AI (Strict Mode). Project: ${PROJECT_ID}, Location: ${LOCATION}, Model: ${MODEL_ID}`);
    vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
    model = vertexAI.getGenerativeModel({ 
      model: MODEL_ID,
      generationConfig: {
        maxOutputTokens: 8192,
      },
      tools: [{
        // @ts-ignore
        googleSearch: {}
      }]
    });
  }
  return model;
}

function cleanJson(text: string): string {
  // 1. Try to find content within ```json ... ``` (flexible whitespace)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) return jsonMatch[1].trim();

  // 2. Fallback: Remove all code block markers and trim
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

export type OldShopScoreResult = {
  score: number;
  reasoning: string;
  short_summary: string;
  is_shinise: boolean;
};

export type ShopGuideResult = {
  history_background: string;
  recommended_points: string;
  atmosphere: string;
  best_time_to_visit: string;
};

export async function generateOldShopScore(shop: {
  name: string;
  address?: string;
  reviews?: string[];
  types?: string[];
}): Promise<OldShopScoreResult> {
  const generativeModel = getModel();
  if (!generativeModel) {
    return { score: 0, reasoning: "AI configuration missing", short_summary: "AI未接続", is_shinise: false };
  }

  const prompt = `
    あなたは「老舗鑑定の達人」です。
    以下の店舗情報と口コミをもとに、この店がどれくらい「老舗（Shines）」としての価値があるかを定性的に評価し、JSON形式で回答してください。

    【判定基準】
    - 単なる営業年数だけでなく、「語られ方」を重視する。
    - 「地元で愛されている」「昭和の雰囲気」「代々受け継がれる味」「看板娘/名物店主」などのナラティブな要素を高く評価する。
    - チェーン店は低く評価する。
    - スコアは0〜100点。80点以上は「認定老舗」。

    【入力情報】
    店名: ${shop.name}
    住所: ${shop.address || '不明'}
    ジャンル: ${shop.types?.join(', ') || '不明'}
    口コミ要約: ${shop.reviews?.join('\n') || 'なし'}

    【出力JSONフォーマット】
    {
      "score": number,
      "reasoning": "なぜそのスコアなのか、具体的なエピソードや雰囲気に触れて100文字程度で解説",
      "short_summary": "検索結果カードに表示する、情感あふれるキャッチコピー（20文字以内）",
      "is_shinise": boolean
    }
  `;

  try {
    const result = await generativeModel.generateContent(prompt);
    
    console.log("DEBUG: Full Vertex Response:", JSON.stringify(result.response, null, 2));

    const text = result.response.candidates?.[0].content.parts?.[0].text;
    
    if (!text) {
      console.warn("DEBUG: No text in response parts:", result.response.candidates?.[0].content.parts);
      throw new Error("No text response from Vertex AI");
    }

    console.log("DEBUG: Raw AI Response (Score):", JSON.stringify(text)); // Use stringify to see exact characters
    const cleanText = cleanJson(text);
    console.log("DEBUG: Cleaned JSON:", JSON.stringify(cleanText)); // Use stringify to see exact characters

    if (!cleanText) {
        throw new Error("Empty JSON after cleaning");
    }

    return JSON.parse(cleanText) as OldShopScoreResult;
  } catch (error: any) {
    console.error("Vertex AI strict error:", error);
    // Return explicit error state for debugging
    return {
      score: 0,
      reasoning: `AIエラー: ${error.message || "Unknown"}`,
      short_summary: "判定不能",
      is_shinise: false
    };
  }
}

export async function generateShopGuide(shop: {
  name: string;
  address?: string;
  reviews?: string[];
  types?: string[];
}): Promise<ShopGuideResult> {
  const generativeModel = getModel();
  if (!generativeModel) {
    return {
      history_background: "AI接続エラー",
      recommended_points: "",
      atmosphere: "",
      best_time_to_visit: ""
    };
  }

  const prompt = `
    あなたは「老舗鑑定の達人」です。
    以下の店舗情報と口コミをもとに、この店の魅力を語る「店主のガイド」を作成してください。JSON形式で回答してください。

    【入力情報】
    店名: ${shop.name}
    住所: ${shop.address || '不明'}
    ジャンル: ${shop.types?.join(', ') || '不明'}
    口コミ要約: ${shop.reviews?.join('\n') || 'なし'}

    【出力JSONフォーマット】
    {
      "history_background": "この店の歴史や背景について、物語調で（150文字程度）",
      "recommended_points": "絶対に食べるべき一品や、見るべきポイント（100文字程度）",
      "atmosphere": "店内の雰囲気や、どんな時間を過ごせるか（50文字程度）",
      "best_time_to_visit": "おすすめの訪問時間帯や混雑状況の推測（30文字程度）"
    }
  `;

  try {
    const result = await generativeModel.generateContent(prompt);
    
    console.log("DEBUG: Full Vertex Response (Guide):", JSON.stringify(result.response, null, 2));

    const text = result.response.candidates?.[0].content.parts?.[0].text;
    
    if (!text) {
      console.warn("DEBUG: No text in response parts (Guide):", result.response.candidates?.[0].content.parts);
      throw new Error("No text response from Vertex AI");
    }

    console.log("DEBUG: Raw AI Response (Guide):", JSON.stringify(text));
    const cleanText = cleanJson(text);

    if (!cleanText) {
        throw new Error("Empty JSON after cleaning");
    }

    return JSON.parse(cleanText) as ShopGuideResult;
  } catch (error: any) {
    console.error("Vertex AI strict error:", error);
    return {
      history_background: `エラー: ${error.message}`,
      recommended_points: "",
      atmosphere: "",
      best_time_to_visit: ""
    };
  }
}
