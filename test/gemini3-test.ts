/**
 * Gemini 3 Pro Preview 接続テスト（Web Grounding なし）
 * 
 * Vertex AI SDK を使用して gemini-3-pro-preview への接続を確認します。
 * 複数のリージョンを試します。
 * 
 * 実行方法:
 *   npx tsx test/gemini3-test.ts
 */

import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'gemini-free-474901';
const MODEL_ID = 'gemini-3-pro-preview';

// 試すリージョン一覧
const LOCATIONS = ['global', 'us-central1', 'us-east1', 'europe-west1'];

async function testGemini3WithLocation(location: string): Promise<boolean> {
  console.log(`\n🔧 Location: ${location} を試行中...`);

  try {
    const vertexAI = new VertexAI({ project: PROJECT_ID, location });
    
    const model = vertexAI.getGenerativeModel({
      model: MODEL_ID,
      generationConfig: {
        maxOutputTokens: 2048,
      },
    });

    const prompt = `こんにちは！あなたは何というモデルですか？`;

    const result = await model.generateContent(prompt);
    const response = result.response;

    const parts = response.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p: any) => p.text || '').join('');

    console.log('✅ 成功！');
    console.log(`📊 モデル: ${JSON.stringify(response.usageMetadata) || 'N/A'}`);
    console.log('📝 レスポンス:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
    return true;

  } catch (error: any) {
    const statusCode = error.message?.match(/(\d{3})/)?.[1] || 'unknown';
    console.log(`❌ 失敗 (${statusCode})`);
    return false;
  }
}

async function main() {
  console.log('🚀 Gemini 3 Pro Preview 接続テスト Starting...');
  console.log(`📅 本日: ${new Date().toLocaleDateString('ja-JP')}`);
  console.log(`🔧 Project: ${PROJECT_ID}, Model: ${MODEL_ID}`);
  console.log('---');

  for (const location of LOCATIONS) {
    const success = await testGemini3WithLocation(location);
    if (success) {
      console.log(`\n🎉 ${location} で接続成功！`);
      break;
    }
  }

  console.log('\n--- テスト完了 ---');
}

main();

