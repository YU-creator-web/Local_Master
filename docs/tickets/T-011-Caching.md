# Ticket: 検索結果・店舗詳細のDBキャッシュ (Firestore)

**ID**: T-011-Caching
**Status**: ✅ 完了

## 目標 (Goal)
AI生成コストの削減とレスポンス高速化のため、取得した店舗情報とAI解説をFirestoreにキャッシュ（永続化）する。
「一回検索した店舗はどんどんDBに入れていく」ことで、アプリ独自の老舗データベースを構築する。

## 実装内容 (Implementation)

### 1. 店舗詳細キャッシュ (`/api/shop/[id]`)
- **読み込み時**: Firestoreの `shops` コレクションを `placeId` で検索。
    - ヒットした場合: キャッシュされた `shop` (基本情報) と `aiGuide` (AI解説) を返す。
    - ヒットしない場合: 
        1. Google Places API で基本情報を取得。
        2. Gemini 3 で AI解説 (`history_background`, `tabelog_url` 等) を生成。
        3. Firestore `shops/{placeId}` にこれらを保存。
        4. クライアントに返す。

### 2. データ構造 (Schema Estimate)
```typescript
interface CachedShop {
  id: string; // Place ID
  shop: PlaceDetails; // Google Maps API Result
  aiGuide: ShopGuide; // Gemini Generated Content
  lastUpdated: Timestamp;
}
```

### 3. 検索結果キャッシュ (`/api/search`)
- **キャッシュキー**: `searches/{station}_{genre}`
- **動作**: 初回はAI検索・Google検索を行い、結果リストを配列として保存。2回目はその配列を即座にストリーミング返却。

### 3. TTL (有効期限)
- **期限**: 90日 (約3ヶ月)
- **動作**: データ取得時に `cachedAt` をチェック。現在時刻と比較して90日を超えていれば、キャッシュを無視して再取得・更新する。

## 検証 (Verification)
1. **初回アクセス**: 通常通り時間がかかることを確認 (ログ等で "Cache Miss" を確認)。
2. **2回目アクセス**: 爆速で表示されることを確認 (ログ等で "Cache Hit" を確認)。
3. **期限切れ**: (コードレビューにて確認) `cachedAt` が90日以上前の場合、 "Cache Expired" ログが出て再取得されるロジックを確認。
