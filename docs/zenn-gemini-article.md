---
title: "【2025年12月版】Gemini 2.5-pro / 3-pro-preview + Web Grounding 接続ガイド（Vertex AI × Node.js）"
emoji: "🤖"
type: "tech"
topics: ["gemini", "vertexai", "typescript", "nodejs", "googlecloud"]
published: false
---

# はじめに

:::message
**この記事は自分への備忘録です。**
同じようにハマった方の参考になれば幸いです 🙏
:::

Google の最新 AI モデル **gemini-2.5-pro** と **gemini-3-pro-preview** に Node.js から接続する方法をまとめました。

特に **Gemini 3** は `location: 'global'` じゃないと 404 になるなど、ハマりポイントがあったので記録しておきます。

**この記事でわかること:**
- gemini-2.5-pro / gemini-3-pro-preview への接続方法の違い
- 使用する SDK（`@google-cloud/vertexai` vs `@google/genai`）
- **Web Grounding**（リアルタイム Google 検索）の有効化方法
- よくあるエラーと対処法

:::message
**2025年12月15日時点**の情報です。gemini-3-pro-preview はまだ Preview 段階のため、仕様が変更される可能性があります。
:::

---

# 前提条件

## 必要な環境

- **Node.js**: v18 以上（v20 推奨）
- **Google Cloud プロジェクト**: Vertex AI API が有効化されていること
- **認証**: Application Default Credentials (ADC) が設定済み

## 認証設定（ローカル開発）

```bash
gcloud auth application-default login
```

## 環境変数

```bash
GOOGLE_CLOUD_PROJECT=your-project-id
```

---

# SDK の選び方

| SDK | 対応モデル | 状況 |
|-----|-----------|------|
| `@google-cloud/vertexai` | Gemini 2.5 | 2025/6/24 から非推奨 |
| `@google/genai` | Gemini 2.5 & **3** | ✅ **推奨** |

:::message alert
`@google-cloud/vertexai` は 2025年6月24日から非推奨になります。
新規開発では `@google/genai` を使用してください。
:::

```bash
# Gemini 3 対応 SDK（推奨）
npm install @google/genai

# レガシー（Gemini 2.5 のみ）
npm install @google-cloud/vertexai
```

---

# Gemini 2.5 Pro への接続

## 基本接続（Web Grounding なし）

```typescript
import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT!;
const LOCATION = 'us-central1';

const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

const model = vertexAI.getGenerativeModel({
  model: 'gemini-2.5-pro',
  generationConfig: { maxOutputTokens: 8192 },
});

const result = await model.generateContent('こんにちは');
const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
console.log(text);
```

## Web Grounding あり

Web Grounding を有効にすると、Gemini がリアルタイムで Google 検索を行い、最新情報を回答に反映します。

```typescript
const model = vertexAI.getGenerativeModel({
  model: 'gemini-2.5-pro',
  tools: [{
    // @ts-ignore - googleSearch is valid but not in types
    googleSearch: {}
  }]
});

const result = await model.generateContent('今日のニュースを教えて');
const response = result.response;

// Grounding メタデータで検索クエリを確認
const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
console.log('検索クエリ:', groundingMetadata?.webSearchQueries);
```

---

# Gemini 3 Pro Preview への接続

:::message
**重要**: Gemini 3 は `location: 'global'` が必須です！
`us-central1` などのリージョン指定では 404 エラーになります。
:::

## 基本接続（Web Grounding なし）

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT!,
  location: 'global',  // ⚠️ 必須！
});

const response = await ai.models.generateContent({
  model: 'gemini-3-pro-preview',
  contents: 'こんにちは',
});

console.log(response.text);
```

## Web Grounding あり

```typescript
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

# よくあるエラーと対処法

## 404 エラー

| 原因 | 対処法 |
|------|--------|
| Gemini 3 で `global` 以外を指定 | `location: 'global'` に変更 |
| モデル名のタイポ | `gemini-3-pro-preview`（ハイフン区切り）を確認 |

## 403 認証エラー

```bash
# ADC をリフレッシュ
gcloud auth application-default login
```

## Web Grounding が動作しない

- `tools: [{ googleSearch: {} }]` が正しく設定されているか確認
- プロンプトが Web 検索を必要とする内容か確認（例：「今日の」「最新の」など）

---

# まとめ

| | Gemini 2.5 Pro | Gemini 3 Pro Preview |
|---|---|---|
| SDK | `@google-cloud/vertexai` または `@google/genai` | `@google/genai` のみ |
| Location | `us-central1` 等 | **`global`** |
| Web Grounding | ✅ | ✅ |
| 推奨度 | 安定版 | 最新機能（Preview） |

今後は `@google/genai` SDK に統一されていくので、新規開発ではこちらを使うのがおすすめです！

---

# 参考リンク

- [Gemini 3 デベロッパーガイド](https://ai.google.dev/gemini-api/docs/gemini-3?hl=ja)
- [Vertex AI ドキュメント](https://cloud.google.com/vertex-ai/docs)
- [@google/genai npm](https://www.npmjs.com/package/@google/genai)
