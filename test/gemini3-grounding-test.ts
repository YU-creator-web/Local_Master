/**
 * Gemini 3 Pro Preview + Web Grounding テスト
 * 
 * gemini-3-pro-preview で Web Grounding (Google 検索) が動作するか確認します。
 * 今日のニュースを取得して、最新情報が返ってくるかテストします。
 * 
 * 実行方法:
 *   npx tsx test/gemini3-grounding-test.ts
 */

import { GoogleGenAI } from '@google/genai';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'gemini-free-474901';
const LOCATION = 'global';  // Gemini 3 は global で利用可能
const MODEL_ID = 'gemini-3-pro-preview';

async function testGemini3WithGrounding() {
  console.log('🚀 Gemini 3 Pro Preview + Web Grounding テスト');
  console.log(`📅 本日: ${new Date().toLocaleDateString('ja-JP')}`);
  console.log(`🔧 Project: ${PROJECT_ID}, Location: ${LOCATION}, Model: ${MODEL_ID}`);
  console.log('---');

  try {
    const ai = new GoogleGenAI({
      vertexai: true,
      project: PROJECT_ID,
      location: LOCATION,
    });
    
    const prompt = `今日のニュースを日付とともに回答してください。`;

    console.log(`📝 プロンプト: "${prompt}"`);
    console.log('---');

    // Web Grounding を有効にしてリクエスト
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        tools: [{
          googleSearch: {}
        }]
      }
    });

    console.log('✅ AIレスポンス:');
    console.log(response.text || 'No text');
    console.log('---');

    // Grounding Metadata を確認
    const groundingMetadata = (response as any).candidates?.[0]?.groundingMetadata;
    
    if (groundingMetadata?.webSearchQueries && groundingMetadata.webSearchQueries.length > 0) {
      console.log('🔍 Web検索クエリ (Grounding):');
      groundingMetadata.webSearchQueries.forEach((query: string, i: number) => {
        console.log(`  ${i + 1}. ${query}`);
      });
      console.log('✅ Web Grounding が有効です！');
    } else {
      console.log('⚠️ Web検索クエリが見つかりません。');
      console.log('   Grounding Metadata:', JSON.stringify(groundingMetadata, null, 2));
    }

    console.log('\n🎉 Gemini 3 + Web Grounding テスト成功！');

  } catch (error: any) {
    console.error('❌ エラー:', error.message || error);
    console.error('詳細:', JSON.stringify(error, null, 2));
  }
}

testGemini3WithGrounding();
