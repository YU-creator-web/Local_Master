/**
 * Web Grounding Test - Vertex AI (Gemini 2.5 Pro)
 * 
 * このテストは、Gemini 2.5 Pro + Web Grounding が
 * 今日の日付を考慮した最新のWEB検索を行っているか確認するためのものです。
 * 
 * 実行方法:
 *   npx tsx test/web-grounding-test.ts
 */

import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'gemini-free-474901';
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const MODEL_ID = 'gemini-2.5-pro';

async function testWebGrounding() {
  console.log('🚀 Web Grounding Test Starting...');
  console.log(`📅 本日: ${new Date().toLocaleDateString('ja-JP')}`);
  console.log(`🔧 Project: ${PROJECT_ID}, Location: ${LOCATION}, Model: ${MODEL_ID}`);
  console.log('---');

  const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
  
  const model = vertexAI.getGenerativeModel({
    model: MODEL_ID,
    generationConfig: {
      maxOutputTokens: 2048,
    },
    tools: [{
      // @ts-ignore - googleSearch is valid but not in types
      googleSearch: {}
    }]
  });

  const prompt = `今日のニュースを日付とともに回答してください。`;

  console.log(`📝 プロンプト: "${prompt}"`);
  console.log('---');

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;

    // Extract text from all parts
    const parts = response.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p: any) => p.text || '').join('');

    console.log('✅ AIレスポンス:');
    console.log(text);
    console.log('---');

    // Check grounding metadata
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    
    if (groundingMetadata?.webSearchQueries && groundingMetadata.webSearchQueries.length > 0) {
      console.log('🔍 Web検索クエリ (Grounding):');
      groundingMetadata.webSearchQueries.forEach((query: string, i: number) => {
        console.log(`  ${i + 1}. ${query}`);
      });
      console.log('✅ Web Grounding が有効です！');
    } else {
      console.log('⚠️ Web検索クエリが見つかりません。Grounding が使われていない可能性があります。');
    }

    // Log full grounding metadata for debugging
    console.log('---');
    console.log('📊 Grounding Metadata (Full):');
    console.log(JSON.stringify(groundingMetadata, null, 2));

  } catch (error: any) {
    console.error('❌ エラー:', error.message || error);
    console.error('詳細:', error);
  }
}

testWebGrounding();
