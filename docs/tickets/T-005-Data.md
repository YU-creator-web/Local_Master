# Ticket: データ永続化 & 認証 (Firebase)

**ID**: T-005-Data
**Status**: Pending

## 目標 (Goal)
Firebaseを使用した認証機能と、ユーザーメモの保存機能を実装する。

## 要件 (Requirements)
- **Auth**: Firebase Authentication (Google Sign-In, 匿名認証)。
- **DB**: Firestore (`users`, `memos`)。

## 実装手順 (Implementation Steps)
1. [ ] **Firebase Setup**:
    - `src/lib/firebase/config.ts` 作成。
    - `src/lib/firebase/auth.ts` (Hooks: `useAuth`) 実装。
2. [ ] **Auth Context**:
    - アプリ全体を `AuthProvider` でラップ。
    - ヘッダーにログイン/ログアウトボタン配置。
3. [ ] **Memos Feature (メモ機能)**:
    - **Schema**: `memos/{userId}/shops/{shopId}` -> `{ text, createdAt }`
    - **UI**: 店舗詳細ページに「自分だけのメモ」入力欄を追加。
    - **Action**: Firestoreへの保存・読み出し処理。

## 検証 (Verification)
- Googleアカウント等でログインできること。
- メモを保存し、リロードしてもデータが維持されていること。
- ログアウト後に他ユーザーのデータが見えないこと（セキュリティルール）。
