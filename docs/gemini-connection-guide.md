# Gemini AI 接続マニュアル

このドキュメントは、Vertex AI 経由で Gemini モデルに接続するための包括的なガイドです。
人間とAIの両方が参照・再現できるように記述されています。

---

## 📋 前提条件

### 必要な環境変数
```bash
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1  # or global for Gemini 3
```

### 認証設定
```bash
# ローカル開発時
gcloud auth application-default login

# 本番（Cloud Run等）
# サービスアカウントが自動的に使用される
```

### 必要なパッケージ
```bash
# Gemini 2.5 用（レガシー）
npm install @google-cloud/vertexai

# Gemini 3 用（推奨）
npm install @google/genai
```

---

## 🔧 接続パターン一覧

| モデル | SDK | Web Grounding | Location |
|--------|-----|---------------|----------|
| gemini-2.5-pro | @google-cloud/vertexai | ✅ 対応 | us-central1 |
| gemini-3-pro-preview | @google/genai | ✅ 対応 | **global** |

---

## 1️⃣ Gemini 2.5 Pro（現行）

### SDK: `@google-cloud/vertexai`

#### 基本接続（Web Grounding なし）
```typescript
import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT!;
const LOCATION = 'us-central1';
const MODEL_ID = 'gemini-2.5-pro';

const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

const model = vertexAI.getGenerativeModel({
  model: MODEL_ID,
  generationConfig: { maxOutputTokens: 8192 },
});

const result = await model.generateContent('こんにちは');
const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
console.log(text);
```

#### Web Grounding あり
```typescript
import { VertexAI } from '@google-cloud/vertexai';

const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

const model = vertexAI.getGenerativeModel({
  model: 'gemini-2.5-pro',
  generationConfig: { maxOutputTokens: 8192 },
  tools: [{
    // @ts-ignore - googleSearch is valid but not in types
    googleSearch: {}
  }]
});

const result = await model.generateContent('今日のニュースを教えて');
const response = result.response;

// レスポンステキスト
const parts = response.candidates?.[0]?.content?.parts || [];
const text = parts.map((p: any) => p.text || '').join('');

// Grounding メタデータ（検索クエリなど）
const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
console.log('検索クエリ:', groundingMetadata?.webSearchQueries);
```

---

## 2️⃣ Gemini 3 Pro Preview（新世代）

### SDK: `@google/genai`（推奨）

> ⚠️ **重要**: `@google-cloud/vertexai` は 2025/6/24 から非推奨。Gemini 3 は `@google/genai` を使用。

#### 基本接続（Web Grounding なし）
```typescript
import { GoogleGenAI } from '@google/genai';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT!;
const LOCATION = 'global';  // ⚠️ Gemini 3 は global リージョンが必須
const MODEL_ID = 'gemini-3-pro-preview';

const ai = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: LOCATION,
});

const response = await ai.models.generateContent({
  model: MODEL_ID,
  contents: 'こんにちは',
});

console.log(response.text);
```

#### Web Grounding あり
```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: 'global',
});

const response = await ai.models.generateContent({
  model: 'gemini-3-pro-preview',
  contents: '今日のニュースを日付とともに教えて',
  config: {
    tools: [{
      googleSearch: {}
    }]
  }
});

console.log(response.text);

// Grounding メタデータ
const groundingMetadata = (response as any).candidates?.[0]?.groundingMetadata;
console.log('検索クエリ:', groundingMetadata?.webSearchQueries);
```

---

## 🔍 トラブルシューティング

### 404 エラー
| 原因 | 対処法 |
|------|--------|
| リージョンが間違っている | Gemini 3 は `global` を使用 |
| モデル名が間違っている | `gemini-3-pro-preview`（ハイフン区切り） |
| APIが有効でない | Cloud Console で Vertex AI API を有効化 |

### 認証エラー（403）
```bash
# ADC をリフレッシュ
gcloud auth application-default login
```

### Web Grounding が動作しない
- `tools: [{ googleSearch: {} }]` が正しく設定されているか確認
- `groundingMetadata` が空の場合、プロンプトが Web 検索を必要としない内容の可能性あり

---

## 📁 テストファイル

このプロジェクトには以下のテストが含まれています:

| ファイル | 内容 |
|----------|------|
| `test/web-grounding-test.ts` | Gemini 2.5 + Web Grounding |
| `test/gemini3-test.ts` | Gemini 3 基本接続（Vertex AI SDK） |
| `test/gemini3-genai-test.ts` | Gemini 3 基本接続（@google/genai） |
| `test/gemini3-grounding-test.ts` | Gemini 3 + Web Grounding |

### テスト実行
```bash
npx tsx test/web-grounding-test.ts
npx tsx test/gemini3-grounding-test.ts
```

---

## 📝 更新履歴

| 日付 | 内容 |
|------|------|
| 2025-12-15 | 初版作成。Gemini 2.5/3 接続パターン記載 |
