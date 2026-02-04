import { GoogleGenAI } from '@google/genai';

// --- Configuration ---
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
const LOCATION = 'global';
const MODEL_ID = 'gemini-3-pro-preview'; // Use the smart model for complex analysis

let aiClient: GoogleGenAI | null = null;

function getClient() {
  if (!aiClient) {
    if (!PROJECT_ID) return null;
    aiClient = new GoogleGenAI({
      vertexai: true,
      project: PROJECT_ID,
      location: LOCATION
    });
  }
  return aiClient;
}

function cleanJson(text: string): string {
  let match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match && match[1]) return match[1].trim();
  match = text.match(/(\{[\s\S]*\})/);
  if (match && match[1]) return match[1].trim();
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

// --- Agent Definitions ---

export type AgentType = 
  | 'praiser'       // ① 魅力発掘アナリスト [NEW]
  | 'critic'        // ② 辛口レビュー分析官
  | 'crowd'         // ② リアルタイム混雑探偵
  | 'menu'          // ③ 看板メニュー鑑定士
  | 'smoking'       // ④ 喫煙/禁煙ポリス
  | 'date'          // ⑤ デート適正診断士
  | 'sake'          // ⑥ 日本酒愛好家 [NEW]
  | 'insta'         // ⑧ インスタ映え判定士
  | 'red_flag'      // ⑨ 地雷回避コンサルタント
  | 'budget'        // ⑩ コスパ・割り勘計算官
  | 'biz_risk'      // ⑪ 接待・会食リスクマネージャー
  | 'family';       // ⑫ ママ友会・子連れ探偵

export interface AgentRequest {
  agentType: AgentType;
  shopName: string;
  shopAddress: string;
  shopId?: string; // For DB caching of results
  reviews?: string[]; // Optional pass-through
}

export interface AgentResponse {
  agentType: AgentType;
  agentName: string; // Display name
  icon: string;      // Emoji
  summary: string;   // Short result summary
  details: string[]; // Bullet points
  score?: number;    // Optional score (0-100) or -1 if N/A
  riskLevel?: 'safe' | 'caution' | 'danger'; // Optional risk level
}

// --- Prompts ---

const AGENT_PROMPTS: Record<AgentType, (shop: AgentRequest) => string> = {
  praiser: (shop) => `
    あなたは「魅力発掘アナリスト」です。
    店名: ${shop.shopName} (${shop.shopAddress})
    Web検索で、このお店の**「創業年」**と**「良いところ・こだわり」**を徹底的に調査してください。
    ネガティブな情報は無視し、お店の魅力（歴史、看板メニューの評判、接客の良さなど）を全力でアピールしてください。
    
    出力JSON:
    {
      "summary": "魅力の一言（例：創業50年、地元に愛される名店）",
      "details": ["創業年情報（〇〇年創業、創業〇年など）", "具体的な魅力1", "具体的な魅力2"],
      "score": number (魅力度: 0-100)
    }
  `,
  critic: (shop) => `
    あなたは「辛口レビュー分析官」です。
    店名: ${shop.shopName} (${shop.shopAddress})
    Web検索で最新の口コミを収集し、**「サクラ（やらせ）」の検知**と**「隠れた致命的な欠点」**のみを報告してください。
    良い点は一切無視して、リスク管理に特化してください。
    
    出力JSON:
    {
      "summary": "一言で言うと（例：常連贔屓が激しく一見は無視される危険あり）",
      "details": ["具体的な懸念点1", "具体的な懸念点2"],
      "riskLevel": "safe" | "caution" | "danger" (サクラ度や地雷度で判定)
    }
  `,
  crowd: (shop) => `
    あなたは「リアルタイム混雑探偵」です。
    店名: ${shop.shopName} (${shop.shopAddress})
    Web検索(Google Maps混雑状況やSNSの直近投稿)から、**「今（および直近）」の混雑傾向**を推測してください。
    「予約必須か」「飛び込みでいけるか」を判定してください。
    
    出力JSON:
    {
      "summary": "混雑状況の一言（例：今なら飛び込み可／予約なしは無謀）",
      "details": ["混雑のピーク時間", "予約の取りやすさ情報", "狙い目の時間帯"],
      "score": number (空きやすさ: 100点=ガラガラ, 0点=超満員)
    }
  `,
  menu: (shop) => `
    あなたは「看板メニュー鑑定士」です。
    店名: ${shop.shopName} (${shop.shopAddress})
    Web検索で、**「この店に来たらこれを頼まないと損」**という絶対的な看板メニュー（スペシャリテ）を3つ特定してください。
    「とりあえずのメニュー」ではなく「必食メニュー」を厳選してください。
    
    出力JSON:
    {
      "summary": "必食メニュー名（例：名物・〇〇の煮込み）",
      "details": ["メニュー1とその魅力", "メニュー2とその魅力", "メニュー3とその魅力"],
      "score": number (メニューの引きの強さ: 0-100)
    }
  `,
  smoking: (shop) => `
    あなたは「喫煙/禁煙ポリス」です。
    店名: ${shop.shopName} (${shop.shopAddress})
    Web検索で、喫煙可否を**徹底的に**調査してください。
    「全面喫煙可」「分煙（仕切りあり/なし）」「完全禁煙」「店外に灰皿あり」など詳細に。
    加熱式タバコのみOKかどうかも含めて調査。
    
    出力JSON:
    {
      "summary": "喫煙ステータス（例：紙タバコOK / 完全禁煙）",
      "details": ["喫煙ルールの詳細", "タバコの臭いに関する口コミ", "近隣の喫煙所情報"],
      "riskLevel": "caution" (喫煙可なら吸わない人にcaution, 禁煙なら愛煙家にcaution。状況を正確に記述することを優先)
    }
  `,
  date: (shop) => `
    あなたは「デート適正診断士」です。
    店名: ${shop.shopName} (${shop.shopAddress})
    Web検索で、デート利用時のリスクとメリットを判定してください。
    チェック項目：照明の暗さ、席の間隔（隣の会話が聞こえるか）、客層（サラリーマンが多いかカップルが多いか）、トイレの清潔さ。
    
    出力JSON:
    {
      "summary": "デート判定（例：初デートには不向き / 口説けるカウンターあり）",
      "details": ["雰囲気・照明について", "席の距離感・個室有無", "懸念点（ガヤガヤ度など）"],
      "score": number (デート適正度: 0-100)
    }
  `,
  sake: (shop) => `
    あなたは「日本酒愛好家」です。
    店名: ${shop.shopName} (${shop.shopAddress})
    Web検索で、**「日本酒（地酒）の品揃え」**を徹底調査してください。
    「日本酒がメニューにあるか」「銘柄のこだわり（十四代・新政などあるか）」「季節の酒があるか」「飲み比べセット」などをチェック。
    
    出力JSON:
    {
      "summary": "日本酒判定（例：獺祭など有名処あり / こだわりの地酒30種以上）",
      "details": ["具体的な銘柄例（分かれば）", "品揃えの豊富さに関する口コミ", "飲み放題に日本酒が含まれるか"],
      "score": number (日本酒充実度: 0-100)
    }
  `,
  insta: (shop) => `
    あなたは「インスタ映え判定士」です。
    店名: ${shop.shopName} (${shop.shopAddress})
    Web検索で、写真映えするポイントを探してください。
    「内装」「盛り付け」「照明（自然光が入るか）」などを分析。
    動画（Reels/TikTok）映えする要素（シズル感、動き）があるかもチェック。
    
    出力JSON:
    {
      "summary": "映え度（例：照明が暗く難易度高め / 盛り付けが神）",
      "details": ["一番映えるアングルやメニュー", "写真撮影のしやすさ", "店内のフォトスポット"],
      "score": number (映え度: 0-100)
    }
  `,
  red_flag: (shop) => `
    あなたは「地雷回避コンサルタント」です。
    店名: ${shop.shopName} (${shop.shopAddress})
    Web検索で、「人によっては許せないポイント（地雷）」を探してください。
    例：「提供が異常に遅い」「店主が説教してくる」「常連以外への対応が冷たい」「現金のみ」「予約ルールが厳しすぎる」。
    
    出力JSON:
    {
      "summary": "地雷判定（例：店主のクセが強いので注意）",
      "details": ["具体的な地雷ポイント1", "地雷ポイント2", "地雷ポイント3"],
      "riskLevel": "safe" | "caution" | "danger" (地雷の大きさ)
    }
  `,
  budget: (shop) => `
    あなたは「コスパ・割り勘計算官」です。
    店名: ${shop.shopName} (${shop.shopAddress})
    Web検索で、**「リアルな客単価」**と**「会計のしやすさ」**を調査してください。
    グルメサイトの予算ではなく、口コミにある「実際払った金額」を重視。
    「お通し代が高い」「サービス料がある」「カード不可（現金のみ）」などの幹事泣かせポイントもチェック。
    
    出力JSON:
    {
      "summary": "リアル予算感（例：飲んで食べて5000円弱 / 現金のみ注意）",
      "details": ["実際の客単価目安", "お通し・チャージ料情報", "決済方法（カード/電子マネー）"],
      "score": number (コスパ度: 0-100)
    }
  `,
  biz_risk: (shop) => `
    あなたは「接待・会食リスクマネージャー」です。
    店名: ${shop.shopName} (${shop.shopAddress})
    Web検索で、ビジネス利用（接待・会食）におけるリスクを判定してください。
    「個室の壁の薄さ（音漏れ）」「領収書の発行可否（インボイス対応）」「靴を脱ぐか」「予約の正確さ」など。
    
    出力JSON:
    {
      "summary": "接待判定（例：カジュアル接待なら可 / 重要商談はNG）",
      "details": ["個室・席のプライバシー", "静寂性・騒音レベル", "ビジネス対応（領収書等）"],
      "riskLevel": "safe" | "caution" | "danger" (ビジネス利用のリスク)
    }
  `,
  family: (shop) => `
    あなたは「ママ友会・子連れ探偵」です。
    店名: ${shop.shopName} (${shop.shopAddress})
    Web検索で、子供連れ利用時のハードルを調査してください。
    「ベビーカー入店」「子供椅子」「離乳食持ち込み」「オムツ替えスペース」「子供が騒いでも平気な雰囲気か」。
    
    出力JSON:
    {
      "summary": "子連れ判定（例：座敷あるが煙たいので注意 / ベビーカーOK）",
      "details": ["設備情報（椅子・トイレ）", "雰囲気（子供歓迎か）", "注意点"],
      "score": number (子連れ適正度: 0-100)
    }
  `
};

// --- Agent Metadata (for UI) ---
export const AGENT_REGISTRY: Record<AgentType, { name: string; emoji: string; description: string }> = {
  praiser: { name: "魅力発掘アナリスト", emoji: "✨", description: "創業年・良い点・こだわり" },
  critic: { name: "辛口レビュー分析官", emoji: "🧐", description: "サクラ排除・欠点抽出" },
  crowd: { name: "リアルタイム混雑探偵", emoji: "🕵️", description: "今の混雑・予約難易度" },
  menu: { name: "看板メニュー鑑定士", emoji: "🍖", description: "必食メニュー特定" },
  smoking: { name: "喫煙/禁煙ポリス", emoji: "🚬", description: "喫煙ルール徹底調査" },
  date: { name: "デート適正診断士", emoji: "💘", description: "雰囲気・距離感判定" },
  sake: { name: "日本酒愛好家", emoji: "🍶", description: "地酒・銘柄・品揃え" },
  insta: { name: "インスタ映え判定士", emoji: "📸", description: "映えポイント・照明分析" },
  red_flag: { name: "地雷回避コンサルタント", emoji: "💣", description: "店主の癖・提供スピード" },
  budget: { name: "コスパ・割り勘計算官", emoji: "💰", description: "リアル予算・決済方法" },
  biz_risk: { name: "接待リスクマネージャー", emoji: "👔", description: "個室・音漏れ・領収書" },
  family: { name: "ママ友会・子連れ探偵", emoji: "👶", description: "ベビーカー・子供椅子" }
};

// --- Execution Function ---
export async function executeAgent(request: AgentRequest): Promise<AgentResponse> {
  const { agentType } = request;
  const ai = getClient();
  const meta = AGENT_REGISTRY[agentType];

  if (!ai) {
    return {
      agentType,
      agentName: meta.name,
      icon: meta.emoji,
      summary: "AI接続エラー",
      details: ["APIキーが設定されていません"],
      riskLevel: "danger"
    };
  }

  const promptGenerator = AGENT_PROMPTS[agentType];
  const prompt = `
    ${promptGenerator(request)}
    
    ※本日は ${new Date().toLocaleDateString('ja-JP')} です。必ずGoogle検索ツールを使用して最新情報を取得してください。
  `;

  let retries = 0;
  const MAX_RETRIES = 5;
  const BASE_DELAY = 2000;

  while (retries <= MAX_RETRIES) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || "{}";
      const data = JSON.parse(cleanJson(text));

      return {
        agentType,
        agentName: meta.name,
        icon: meta.emoji,
        summary: data.summary || "情報なし",
        details: data.details || [],
        score: data.score,
        riskLevel: data.riskLevel
      };

    } catch (error: any) {
      const isQuotaError = error.message?.includes('429') || error.status === 429 || error.code === 429;
      
      if (isQuotaError && retries < MAX_RETRIES) {
        retries++;
        const delay = BASE_DELAY * Math.pow(2, retries - 1) + (Math.random() * 1000); // Exponential backoff + jitter
        console.warn(`[Agent ${agentType}] Rate limit hit (429). Retrying in ${Math.round(delay)}ms... (Attempt ${retries}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      console.error(`Agent Error (${agentType}):`, error);
      
      // If final attempt failed with 429, prevent generic error message if possible or just show busy
      if (isQuotaError) {
          return {
            agentType,
            agentName: meta.name,
            icon: meta.emoji,
            summary: "混雑中...",
            details: ["現在アクセスが集中しており、AIが応答できませんでした。", "少し時間をおいて再度お試しください。"],
            riskLevel: "caution"
          };
      }

      return {
        agentType,
        agentName: meta.name,
        icon: meta.emoji,
        summary: "調査失敗",
        details: [`エラーが発生しました: ${error.message}`],
        riskLevel: "caution"
      };
    }
  }

  // Should not reach here
  return {
    agentType,
    agentName: meta.name,
    icon: meta.emoji,
    summary: "不明なエラー",
    details: ["予期せぬエラーが発生しました"],
    riskLevel: "caution"
  };
}
