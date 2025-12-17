import { GoogleGenAI } from '@google/genai';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
// Gemini 3 requires global location
const LOCATION = 'global';
const MODEL_ID = 'gemini-3-pro-preview';

let aiClient: GoogleGenAI | null = null;

function getClient() {
  if (!aiClient) {
    if (!PROJECT_ID) {
      console.warn("GOOGLE_CLOUD_PROJECT is not set. AI features will fail.");
      return null;
    }
    console.log(`🚀 Initializing Google Gen AI (Gemini 3). Project: ${PROJECT_ID}, Location: ${LOCATION}, Model: ${MODEL_ID}`);
    aiClient = new GoogleGenAI({
      vertexai: true,
      project: PROJECT_ID,
      location: LOCATION
    });
  }
  return aiClient;
}

function cleanJson(text: string): string {
  // 1. Try to find content within ```json ... ``` (flexible whitespace)
  let match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match && match[1]) return match[1].trim();

  // 2. Try to find strictly valid JSON object structure { ... }
  match = text.match(/(\{[\s\S]*\})/);
  if (match && match[1]) return match[1].trim();

  // 3. Fallback: Remove all code block markers and trim
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

export type OldShopScoreResult = {
  score: number;
  reasoning: string;
  short_summary: string;
  is_shinise: boolean;
  founding_year: string;
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
  const ai = getClient();
  if (!ai) {
    return { score: 0, reasoning: "AI configuration missing", short_summary: "AI未接続", is_shinise: false, founding_year: "不明" };
  }

  const prompt = `
    あなたは「老舗鑑定の達人」です。
    以下の店舗情報と口コミをもとに、この店がどれくらい「老舗（Shinise）」としての価値があるかを定性的に評価し、JSON形式で回答してください。
    ※ 本日は ${new Date().toLocaleDateString('ja-JP')} です。最新の情報を使って調査してください。

    【判定基準】
    - 単なる営業年数だけでなく、「語られ方」を重視する。
    - 「地元で愛されている」「昭和の雰囲気」「代々受け継がれる味」「看板娘/名物店主」などのナラティブな要素を高く評価する。
    - スコアは0〜100点。80点以上は「認定老舗」。
    - **創業年はWEB検索で必ず調査してください**。見つからない場合は「不明」としてください。

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
      "is_shinise": boolean,
      "founding_year": "創業年（例: 1965年創業）。不明な場合は『不明』と記載"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        tools: [{
          googleSearch: {}
        }],
        responseMimeType: 'application/json'
      }
    });
    
    // Log grounding metadata for debugging
    const groundingMetadata = (response as any).candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.webSearchQueries) {
      console.log(`🔍 [Web Grounding] Score Queries: ${JSON.stringify(groundingMetadata.webSearchQueries)}`);
    }

    const text = response.text;
    
    if (!text) {
      throw new Error("No text response from Vertex AI");
    }

    console.log("DEBUG: Raw AI Response (Score):", text.substring(0, 100) + "..."); 
    
    // Fix: Apply cleanJson before parsing
    const cleanText = cleanJson(text);
    return JSON.parse(cleanText) as OldShopScoreResult;

  } catch (error: any) {
    console.error("Gemini 3 error (Score):", error);
    return {
      score: 0,
      reasoning: `AIエラー: ${error.message || "Unknown"}`,
      short_summary: "判定不能",
      is_shinise: false,
      founding_year: "不明"
    };
  }
}

export async function generateShopGuide(shop: {
  name: string;
  address?: string;
  reviews?: string[];
  types?: string[];
}): Promise<ShopGuideResult> {
  const ai = getClient();
  if (!ai) {
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
    ※ 本日は ${new Date().toLocaleDateString('ja-JP')} です。WEB検索を活用し、最新の情報（営業状況・メニュー・口コミ等）を反映してください。

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
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        tools: [{
          googleSearch: {}
        }],
        responseMimeType: 'application/json'
      }
    });

    const groundingMetadata = (response as any).candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.webSearchQueries) {
      console.log(`🔍 [Web Grounding] Guide Queries: ${JSON.stringify(groundingMetadata.webSearchQueries)}`);
    }

    const text = response.text;
    
    if (!text) {
      throw new Error("No text response from Vertex AI");
    }

    console.log("DEBUG: Raw AI Response (Guide):", text.substring(0, 100) + "...");
    
    // Fix: Apply cleanJson before parsing
    const cleanText = cleanJson(text);
    return JSON.parse(cleanText) as ShopGuideResult;
  } catch (error: any) {
    console.error("Gemini 3 error (Guide):", error);
    return {
      history_background: `エラー: ${error.message}`,
      recommended_points: "",
      atmosphere: "",
      best_time_to_visit: ""
    };
  }
}

export async function findShiniseCandidates(stationName: string, genre?: string): Promise<string[]> {
  const ai = getClient();
  if (!ai) {
    return [];
  }

  const queryGenre = genre || "飲食店、総菜屋、甘味処、和菓子屋";
  
  const prompt = `
    あなたの任務は、指定されたエリア（${stationName}周辺）にある「地元で愛される名店（老舗）」を10軒探し出し、その店名のリストを作成することです。
    ※ 本日は ${new Date().toLocaleDateString('ja-JP')} です。最新の情報を使用し、閉店した店は除外してください。

    【検索条件】
    - エリア: ${stationName}駅 周辺
    - カテゴリ: ${queryGenre}
    - 必須条件:
        1. **創業5年以上**（できれば10年以上が望ましい）
        2. **地域密着型**（地元の人に愛されている）
        3. **チェーン店は絶対に除外**してください（大手資本が入っていない個店を優先）。
    
    【重要: WEB検索を活用】
    - 必ずWEB検索を行い、現在も営業している店を選んでください。
    - 食べログ等の評価も参照してください。

    【出力形式: JSON】
    {
      "candidates": [ "店名A", "店名B", ... ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        tools: [{
          googleSearch: {}
        }],
        responseMimeType: 'application/json'
      }
    });
    
    const groundingMetadata = (response as any).candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.webSearchQueries) {
      console.log(`🔍 [Web Grounding] Candidates Queries: ${JSON.stringify(groundingMetadata.webSearchQueries)}`);
    }

    const text = response.text;
    
    if (!text) throw new Error("No candidates text from Vertex AI");

    console.log("DEBUG: Raw Candidates Response:", text.substring(0, 100) + "...");
    
    // Fix: Apply cleanJson before parsing
    const cleanText = cleanJson(text);
    const parsed = JSON.parse(cleanText) as { candidates: string[] };
    return parsed.candidates || [];

  } catch (error: any) {
    console.error("Gemini 3 Candidate Search Error:", error);
    return [];
  }
}
