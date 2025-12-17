/**
 * Gemini 3 Pro Preview 接続テスト（@google/genai SDK 版）
 * 複数のモデル名・リージョンを試してGemini 3への接続を確認します。
 * 
 * 前提条件:
 * - gcloud auth application-default login が完了していること
 * - または GOOGLE_APPLICATION_CREDENTIALS 環境変数が設定されていること
 * 
 * 実行方法:
 *   npx tsx test/gemini3-genai-test.ts
 */

import { GoogleGenAI } from '@google/genai';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'gemini-free-474901';

// 試すモデル名一覧
const MODEL_IDS = [
  'gemini-3-pro-preview',
  'gemini-3.0-pro-preview',
];

// 試すリージョン一覧
const LOCATIONS = [
  'us-central1',
  'global',
  'us-east1',
];

async function testWithVertexAI(modelId: string, location: string): Promise<boolean> {
  console.log(`  📍 ${location} + ${modelId}`);

  try {
    const ai = new GoogleGenAI({
      vertexai: true,
      project: PROJECT_ID,
      location: location,
    });
    
    const response = await ai.models.generateContent({
      model: modelId,
      contents: 'Say hello in Japanese!',
    });

    console.log('    ✅ 成功！');
    console.log('    📝 レスポンス:', response.text?.substring(0, 100) || 'No text');
    return true;

  } catch (error: any) {
    // Parse error details
    let errorInfo = '';
    if (error.message) {
      const statusMatch = error.message.match(/(\d{3})/);
      const status = statusMatch ? statusMatch[1] : 'N/A';
      errorInfo = `[${status}] ${error.message.substring(0, 80)}`;
    } else {
      errorInfo = String(error).substring(0, 80);
    }
    console.log(`    ❌ ${errorInfo}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Gemini 3 Pro Preview 接続テスト');
  console.log(`📅 本日: ${new Date().toLocaleDateString('ja-JP')}`);
  console.log(`🔧 Project: ${PROJECT_ID}`);
  console.log('---');

  let succeeded = false;

  for (const modelId of MODEL_IDS) {
    console.log(`\n🔍 モデル: ${modelId}`);
    for (const location of LOCATIONS) {
      const success = await testWithVertexAI(modelId, location);
      if (success) {
        console.log(`\n🎉 ${modelId} @ ${location} で接続成功！`);
        succeeded = true;
        break;
      }
    }
    if (succeeded) break;
  }

  if (!succeeded) {
    console.log('\n❌ 全ての組み合わせで失敗しました。');
    console.log('');
    console.log('💡 トラブルシューティング:');
    console.log('   1. gcloud auth application-default login を実行してください');
    console.log('   2. Vertex AI API がプロジェクトで有効か確認してください');
    console.log('   3. https://console.cloud.google.com/vertex-ai/model-garden でモデル一覧を確認');
    console.log('   4. Gemini 3 はまだ限定プレビューの可能性があります');
  }

  console.log('\n--- テスト完了 ---');
}

main();
