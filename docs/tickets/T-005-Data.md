# Ticket: データ永続化 & 認証 (Firebase)

**ID**: T-005-Data
**Status**: Complete

## 目標 (Goal)
Firebaseを使用した認証機能と、ユーザーメモの保存機能を実装する。

## 要件 (Requirements)
- **Auth**: Firebase Authentication (Google Sign-In).
- **DB**: Firestore (`users`, `memos`)。

## 実装手順 (Implementation Steps)
1. [x] **Firebase Setup**:
    - `src/lib/firebase/config.ts` 作成。
    - `src/lib/firebase/auth.ts` (Hooks: `useAuth`) 実装。
2. [x] **Auth Context**:
    - アプリ全体を `AuthProvider` でラップ。
    - ヘッダーにログイン/ログアウトボタン配置。
3. [x] **Memos Feature (メモ機能)**:
    - **Schema**: `memos/{memoId}` -> `{ userId, placeId, text, createdAt }`
    - **UI**: 店舗詳細ページに「自分だけのメモ」入力欄を追加。
    - **Action**: Firestoreへの保存・読み出し処理。

## 検証 (Verification)
- Googleアカウント等でログインできること。
- メモを保存し、リロードしてもデータが維持されていること。
- ログアウト後に他ユーザーのデータが見えないこと（セキュリティルール）。

