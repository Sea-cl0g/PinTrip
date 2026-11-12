# HTTP API 仕様（設計案）

[目次へ](../README.md) · [認証](./authentication.md) · [DB](./database.md)

> 以下の**エンドポイント名・HTTPメソッド・JSON形式はすべて暫定**。実装前にboo_manKnowが各担当と協議して確定する。機能の可否は [要件](./requirements.md) に従う。

## 1. 共通

- ベースパス: `/api/v1`（暫定）
- JSON入出力、UTF-8、HTTPS。
- 公開GETは認証不要。書き込みは原則ログイン必須。
- 成功: `200/201/204`、失敗: `400/401/403/404/409/413/415/429/500` を用途に応じて返す。
- **暫定エラー形式**:

```json
{"error":{"code":"PLAN_CONTAINS_DRAFT_PIN","message":"下書きピンが含まれるため公開できません"}}
```

### データ契約とモック

- **方針**: boo_manKnowが、投稿のyua、地図のozako、計画のhaから画面に必要な項目を確認し、API・DB契約を定義・レビューする。
- **提案**: `Pin`・`Plan`・`User` 等の共有TypeScript型を用意し、閲覧用の取得結果と新規作成・編集の入力型を分ける。日時をISO 8601文字列に揃える案もある。
- **方針**: 実APIと同じ契約のモックを共通取得関数経由で利用し、実API接続時の画面変更を最小限にする。
- **提案**: 共通APIクライアントで明示的な開発モードを使い、本番API障害時にモックへ自動フォールバックしない。切替方式は未決定。静的JSONでは書き込みやログインを再現できず、その方式も未決定。
- **提案**: 一覧を `{ "items": [...], "nextCursor": null }` のようなラッパー形式にする案がある。画像構造、ページング、いいね済みフラグ、投稿者情報、入力型・日時等とともに未決定。
- モックはサーバー側の認可、下書き秘匿、画像の実体検証・削除、公開条件検証の代わりにはならない。

## 2. 認証・ユーザー

| Method | Path | 用途 | 認証 |
|---|---|---|---|
| POST | `/auth/google` | Google IDトークン検証・ログイン | 不要 |
| GET | `/auth/me` | 現在のユーザー | 必要 |
| POST | `/auth/logout` | セッション破棄 | 必要 |
| POST | `/users/onboarding` | 初回handle・表示名設定 | 必要 |
| DELETE | `/users/me` | 退会・所有データ削除 | 必要 |

初回登録とログインのAPI分離方式は未決定。

## 3. ピン

| Method | Path | 用途 | 認証 |
|---|---|---|---|
| GET | `/pins` | 公開ピン検索・一覧 | 不要 |
| GET | `/pins/{id}` | 公開ピン詳細、所有者は下書きも取得 | 条件付き |
| GET | `/me/pins` | 自分の公開・下書きピン | 必要 |
| POST | `/pins` | ピン下書き作成 | 必要 |
| PATCH | `/pins/{id}` | 所有ピン編集 | 所有者 |
| POST | `/pins/{id}/publish` | 下書きを公開 | 所有者 |
| DELETE | `/pins/{id}` | 所有ピン削除 | 所有者 |
| PUT | `/pins/{id}/like` | いいね | 必要 |
| DELETE | `/pins/{id}/like` | いいね解除 | 必要 |

**暫定検索パラメータ**: `q`, `sort=newest|likes`, `north`, `south`, `east`, `west`, `cursor`, `limit`。

**暫定ピンJSON**:

```json
{
  "id": 101,
  "title": "清水寺",
  "body": "景色がきれいだった #京都",
  "emoji": "⛩️",
  "latitude": 34.9948,
  "longitude": 135.785,
  "status": "published",
  "publishedAt": "2026-10-22T10:00:00Z",
  "images": [],
  "likeCount": 5
}
```

## 4. 旅行計画

| Method | Path | 用途 | 認証 |
|---|---|---|---|
| GET | `/plans` | 公開計画一覧 | 不要 |
| GET | `/plans/{id}` | 計画詳細 | 条件付き |
| GET | `/me/plans` | 自分の計画一覧 | 必要 |
| POST | `/plans` | 下書き計画作成 | 必要 |
| PATCH | `/plans/{id}` | 所有計画編集 | 所有者 |
| POST | `/plans/{id}/publish` | 公開条件を検証して公開 | 所有者 |
| DELETE | `/plans/{id}` | 計画削除 | 所有者 |
| POST | `/plans/{id}/pins` | ピン追加 | 所有者 |
| PATCH | `/plans/{id}/pins/{entryId}` | 並び順・滞在/移動時間更新 | 所有者 |
| DELETE | `/plans/{id}/pins/{entryId}` | 計画から参照解除 | 所有者 |

`entryId` は `plan_pins.id`。公開計画への下書きピン追加、下書きピンを含む計画の公開は `409`。

**暫定追加リクエスト**:

```json
{"pinId":101,"position":0,"stayMinutes":60,"travelMinutes":15}
```

欠損ピンはレスポンスの `pin: null` で表現する案。

## 5. 画像・通報・ブックマーク

| Method | Path | 用途 | 状態 |
|---|---|---|---|
| POST | `/pins/{id}/images` | 画像追加 | 暫定 |
| DELETE | `/pins/{id}/images/{imageId}` | 画像削除 | 暫定 |
| PATCH | `/pins/{id}/images/order` | 画像順変更 | 暫定 |
| POST | `/reports` | 通報記録 | 暫定 |
| GET | `/admin/reports` | 管理者の通報確認 | 未決定 |
| PUT/DELETE | `/pins/{id}/bookmark` | 投稿ブックマーク | 将来 |
| PUT/DELETE | `/plans/{id}/bookmark` | 計画ブックマーク | 将来 |

計画画像のAPI、R2への直接アップロードかサーバー経由か、通報対象、管理者認証は未決定。

## 6. 入力検証とページング

- 必須値、文字列長、座標範囲、画像形式・容量、所有者、公開状態を検証。
- 一覧取得件数・カーソル形式は未決定。
- クライアントの任意 `userId` で他人の所有権を指定できないようにする。
- レート制限を設けるが、閾値は未決定。
