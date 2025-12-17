/**
 * Verification Script for src/lib/vertex.ts
 * 
 * Imports the refactored application logic and verifies:
 * 1. findShiniseCandidates (Candidates Search)
 * 2. generateOldShopScore (Scoring)
 * 3. generateShopGuide (Guide)
 * 
 * Run: npx tsx test/verify-vertex-lib.ts
 */

import { findShiniseCandidates, generateOldShopScore, generateShopGuide } from '../src/lib/vertex';

async function verify() {
  console.log('🚀 Verifying src/lib/vertex.ts Refactor...');
  console.log('---');

  // 1. Test Candidate Search
  console.log('🔍 Testing findShiniseCandidates("神田")...');
  const candidates = await findShiniseCandidates("神田");
  console.log('✅ Candidates Result:', candidates);
  if (candidates.length > 0) {
    console.log(`   Found ${candidates.length} shops.`);
  } else {
    console.error('❌ No candidates found.');
  }
  console.log('---');

  if (candidates.length === 0) return;

  // 2. Test Scoring (using the first candidate)
  const shopName = candidates[0];
  console.log(`⚖️ Testing generateOldShopScore("${shopName}")...`);
  const scoreResult = await generateOldShopScore({
    name: shopName,
    address: "東京都千代田区...", // Dummy
    types: ["居酒屋"],
    reviews: ["昔ながらの雰囲気で最高。", "煮込みが美味しい。"]
  });
  console.log('✅ Score Result:', JSON.stringify(scoreResult, null, 2));
  console.log('---');

  // 3. Test Guide
  console.log(`📖 Testing generateShopGuide("${shopName}")...`);
  const guideResult = await generateShopGuide({
    name: shopName,
    address: "東京都千代田区...",
    types: ["居酒屋"],
    reviews: ["常連さんが多い。", "お酒が濃いめ。"]
  });
  console.log('✅ Guide Result:', JSON.stringify(guideResult, null, 2));
  console.log('---');

  console.log('🎉 Verification Complete!');
}

verify();
