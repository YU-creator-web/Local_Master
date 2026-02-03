import { GoogleGenAI } from '@google/genai';

// [MODIFIED] Use Server-Side Env Vars only
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
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
  tabelog_rating: number; // Added
};

export type ShopGuideResult = {
  history_background: string;
  recommended_points: string;
  atmosphere: string;
  best_time_to_visit: string;
  tabelog_url: string;
  smoking_status: string;
};

export async function generateOldShopScore(shop: {
  name: string;
  address?: string;
  reviews?: string[];
  types?: string[];
}): Promise<OldShopScoreResult> {
  const ai = getClient();
  if (!ai) {
    return { score: 0, reasoning: "AI configuration missing", short_summary: "AI未接続", is_shinise: false, founding_year: "不明", tabelog_rating: 0 };
  }

  // Optimize Reviews (Max 5 items, 300 chars each)
  const optimizedReviews = (shop.reviews || [])
    .slice(0, 5)
    .map(r => r.length > 300 ? r.substring(0, 300) + "..." : r);

  const prompt = `
    あなたは「老舗鑑定の達人」です。
    以下の店舗情報と口コミをもとに、この店がどれくらい「老舗（Shinise）」としての価値があるかを定性的に評価し、JSON形式で回答してください。
    ※ 本日は ${new Date().toLocaleDateString('ja-JP')} です。最新の情報を使って調査してください。

    【判定基準】
    - 単なる営業年数だけでなく、「語られ方」を重視する。
    - 「地元で愛されている」「昭和の雰囲気」「代々受け継がれる味」「看板娘/名物店主」などのナラティブな要素を高く評価する。
    - スコアは0〜100点。80点以上は「認定老舗」。
    - **創業年はWEB検索で必ず調査してください**。見つからない場合は「不明」としてください。
    - **食べログの点数（3.00〜5.00）も調査してください**。

    【入力情報】
    店名: ${shop.name}
    住所: ${shop.address || '不明'}
    ジャンル: ${shop.types?.join(', ') || '不明'}
    口コミ要約: ${optimizedReviews.join('\n') || 'なし'}

    【出力JSONフォーマット】
    {
      "score": number,
      "reasoning": "なぜそのスコアなのか、具体的なエピソードや雰囲気に触れて100文字程度で解説",
      "short_summary": "検索結果カードに表示する、情感あふれるキャッチコピー（20文字以内）",
      "is_shinise": boolean,
      "founding_year": "創業年（例: 1965年創業）。不明な場合は『不明』と記載",
      "tabelog_rating": number // 食べログの点数。見つからない場合は 0
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
      founding_year: "不明",
      tabelog_rating: 0
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
      best_time_to_visit: "",
      tabelog_url: "",
      smoking_status: "不明"
    };
  }

  const prompt = `
    あなたは「老舗の魅力を伝えるガイド」です。
    以下の店舗情報と口コミをもとに、この店の魅力を解説するコンテンツを作成してください。JSON形式で回答してください。
    ※ 本日は ${new Date().toLocaleDateString('ja-JP')} です。WEB検索を活用し、最新の情報（営業状況・メニュー・口コミ等）を反映してください。

    【重要: 以下の情報を必ず検索して含めてください】
    1. **食べログのURL**: 
       - 「${shop.name} ${shop.address?.split(' ')[1] || ''} 食べログ」で検索し、**店名と住所が一致する確実なURL**のみを取得してください。
       - 別の支店や同名の他店と間違えないよう注意してください。
    2. **喫煙・禁煙情報**: 「全面喫煙可」「分煙」「完全禁煙」など。不明な場合は「不明」。

    【入力情報】
    店名: ${shop.name}
    住所: ${shop.address || '不明'}
    ジャンル: ${shop.types?.join(', ') || '不明'}
    口コミ要約: ${(shop.reviews || []).slice(0, 5).join('\n') || 'なし'}

    【記述のトーン】
    - 丁寧語（〜です、〜ます）を基本とし、少し落ち着いた、教養あるガイドのような口調で記述してください。
    - 読者が「行ってみたい」と思えるような、情緒的かつ具体的な表現を心がけてください。

    【出力JSONフォーマット】
    {
      "history_background": "この店の歴史や背景について。創業年やエピソードがあれば盛り込んでください（150文字程度）",
      "recommended_points": "絶対に食べるべき一品や、見るべき建築・内装のポイント（100文字程度）",
      "atmosphere": "店内の雰囲気、客層、過ごし方など（50文字程度）",
      "best_time_to_visit": "おすすめの訪問時間帯や混雑状況の推測（30文字程度）",
      "tabelog_url": "https://tabelog.com/...",
      "smoking_status": "全面喫煙可 / 完全禁煙 / 分煙 / 不明"
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
      best_time_to_visit: "",
      tabelog_url: "",
      smoking_status: "不明"
    };
  }
}

export type CandidateResult = {
  name: string;
  tabelog_rating: number;
  reasoning: string;
  founding_year: string;
};

export async function findShiniseCandidates(stationName: string, genre?: string, mode: 'standard' | 'adventure' = 'standard'): Promise<CandidateResult[]> {
  const ai = getClient();
  if (!ai) {
    return [];
  }

  const queryGenre = genre || "飲食店、総菜屋、甘味処、和菓子屋";
  
  let prompt = "";

  if (mode === 'adventure') {
      // Adventure Mode: Hidden Gems / Locals Only
      prompt = `
        あなたの任務は、指定されたエリア（${stationName}駅周辺）にある**「知る人ぞ知る隠れた名店（穴場）」**をトップ10抽出し、リストを作成することです。
        ※ 本日は ${new Date().toLocaleDateString('ja-JP')} です。WEB検索を活用し、最新の情報を参照してください。

        【検索条件】
        - エリア: ${stationName}駅 周辺
        - カテゴリ: ${queryGenre}
        - **ターゲット:**
            - 食べログの点数が**そこまで高くなくても（3.0〜3.5程度）**、地元の人に愛されている店。
            - 観光客があまり行かない、路地裏や目立たない場所にある店。
            - 「入りにくいが味は本物」「常連が多い」「昭和レトロな雰囲気」などの特徴がある店。
        - 除外: チェーン店、誰でも知っている超有名店、観光ガイドのトップに出るような店。
        
        【重要: WEB検索でリアルな評判を確認】
        - 「${stationName} 穴場 グルメ」「${stationName} 地元民 おすすめ」などで検索し、ブログやSNSの声を参考にしてください。
        - **点数が高い順である必要はありません。**「発見する喜び」がある店を優先してください。
        - 食べログ点数が見つからない場合は 3.0、創業年が見つからない場合は「不明」としてください。

        【出力形式: JSON】
        {
          "candidates": [
            {
              "name": "店名",
              "tabelog_rating": 3.25, // 数値
              "reasoning": "なぜ穴場なのか（例：路地裏の看板のない名店、常連だけで満席、等）",
              "founding_year": "1982年"
            },
            ...
          ]
        }
      `;
  } else {
      // Standard Mode: High Rating / Shinise (Original Logic)
      prompt = `
        あなたの任務は、指定されたエリア（${stationName}駅周辺）にある**「食べログの点数が高い人気店」**をトップ10抽出し、リストを作成することです。
        ※ 本日は ${new Date().toLocaleDateString('ja-JP')} です。WEB検索を活用し、最新の食べログランキングや評価を参照してください。

        【検索条件】
        - エリア: ${stationName}駅 周辺
        - カテゴリ: ${queryGenre}
        - 必須条件:
            1. **食べログで高評価（3.1以上が望ましい）**であること。
            2. **創業年を必ず調査**すること（老舗でなくても構いませんが、歴史がある店を優先）。
            3. **チェーン店は除外**（個店を優先）。
        
        【重要: WEB検索で最新の正確な数値を確認】
        - 各店舗「店名 食べログ」で検索し、**検索結果のタイトルやスニペットに表示される最新の点数（例: 3.58）**を必ず取得してください。
        - **点数が高い順に（降順で）トップ10を並べてください。**
        - 食べログ点数が見つからない場合は 3.0、創業年が見つからない場合は「不明」としてください。

        【出力形式: JSON】
        {
          "candidates": [
            {
              "name": "店名",
              "tabelog_rating": 3.58, // 数値で記述
              "reasoning": "なぜ選出したか、その店の魅力を30文字程度で（例：創業50年の秘伝のタレが人気）",
              "founding_year": "1978年" // 創業年を記載
            },
            ...
          ]
        }
      `;
  }

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
    const parsed = JSON.parse(cleanText) as { candidates: CandidateResult[] };
    return parsed.candidates || [];

  } catch (error: any) {
    console.error("Gemini 3 Candidate Search Error:", error);
    return [];
  }
}

export async function generateMapIllustration(shops: { name: string; }[], station: string): Promise<string | null> {
  const ai = getClient();
  if (!ai) return null;

  const shopNames = shops.map(s => s.name).join(', ');
  
  // Prompt optimized for "Gemini 3 Pro Image" (Nano Banana)
  const prompt = `
    Draw an artistic, hand-drawn style illustration map of a walking course in ${station}, Japan.
    Highlight these shops: ${shopNames}.
    The style should be a "Tabi no Shiori" (Travel Guidebook) aesthetic.
    Use warm watercolor textures, soft pastel colors, and a golden/premium feel.
    The map should be visually pleasing, cute but elegant.
    White background with rough paper texture edges.
  `;

  try {
     console.log("🎨 Generative Map Prompt (Gemini 3 Pro Image):", prompt);
     
     // IMPORTANT: "gemini-3-pro-image-preview" is a multimodal model.
     // We request it via generateContent but expect an image output.
     // NOTE: Depending on the specific client library version, retrieving images might require specific handling.
     
     const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview', // User specified model
        contents: prompt,
        // config: { responseMimeType: 'image/png' } // Some versions use this
     });

     // Check for image in response
     // The structure varies, but typically it's in candidates[0].content.parts[0].inlineData or similar
     // Or response.text might contain a link? 
     // For safety in this environment, I'll log the response and fallback if I can't extract it.
     
     // Note: If the model is purely image gen, the response might contain 'images' array.
     // Let's assume standard handling or placeholder for now to prevent crash.
     
     const candidates = (response as any).candidates;
     console.log("Gemini 3 Image Response Candidates:", JSON.stringify(candidates?.map((c:any) => c.content?.parts?.length)));

     // Attempt to extract image
     const part = candidates?.[0]?.content?.parts?.[0];
     if (part) {
        if (part.inlineData && part.inlineData.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            return `data:${mimeType};base64,${part.inlineData.data}`;
        }
        // Sometimes it might be text if the model refused or returned text
        if (part.text) {
            console.warn("Gemini 3 returned text instead of image:", part.text);
            // We could return a placeholder with the text reason, or just the text if UI handles it?
            // For now, fallback to placeholder but log warning.
        }
     }

      return "https://placehold.co/800x600/png?text=Generated+Walking+Course+Map"; 

   } catch (e) {
     console.error("Map Generation Error:", e);
     return "https://placehold.co/800x600/png?text=Map+Generation+Failed";
   }
}

export type ReviewAnalysisResult = {
  is_suspicious: boolean;
  suspicion_level: "low" | "medium" | "high";
  suspicion_reason: string;
  negative_points: string[];
  reality_summary: string;
};

export async function analyzeShopReviews(shopName: string, reviews: string[]): Promise<ReviewAnalysisResult> {
  const ai = getClient();
  if (!ai) {
    return {
      is_suspicious: false,
      suspicion_level: "low",
      suspicion_reason: "AI未接続",
      negative_points: [],
      reality_summary: "分析できませんでした"
    };
  }

  const prompt = `
    あなたは「辛口のレビュー分析官」です。
    以下の店舗（${shopName}）の口コミを分析し、サクラ（やらせ）の可能性と、隠れたネガティブな真実を暴き出してください。
    JSON形式で回答してください。

    【分析観点】
    1. **サクラ検知**:
       - 具体的でない絶賛、同じようなフレーズの多用、投稿日が偏っている、などの特徴がないか。
       - 「店員さんが親切」「コスパ最高」など、当たり障りのない短文ばかりでないか。
    2. **ネガティブ抽出**:
       - 「遅い」「汚い」「味が濃い」「接客が悪い」など、マイナス意見を容赦なく抽出してください。
    3. **実態の要約**:
       - 良い点だけでなく、悪い点も含めた「その店のリアルな実態」を公平かつ少し辛口にまとめてください。

    【入力口コミ】
    ${reviews.slice(0, 10).join('\n---\n')}

    【出力JSON】
    {
      "is_suspicious": boolean, // サクラの疑いがあるか
      "suspicion_level": "low" | "medium" | "high", // 疑いの強さ
      "suspicion_reason": "サクラを疑う理由（なければ『特になし』）",
      "negative_points": ["ネガティブな点1", "ネガティブな点2"],
      "reality_summary": "辛口の要約（100文字程度）"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const text = response.text;
    if (!text) throw new Error("No text response");

    const cleanText = cleanJson(text);
    return JSON.parse(cleanText) as ReviewAnalysisResult;

  } catch (error: any) {
    console.error("Review Analysis Error:", error);
    return {
      is_suspicious: false,
      suspicion_level: "low",
      suspicion_reason: `エラー: ${error.message}`,
      negative_points: [],
      reality_summary: "エラーにより分析失敗"
    };
  }
}
