# Cloudflare D1 データベース設計

[目次へ](../README.md) · [バックエンド](./backend.md) · [未決定事項](./open-decisions.md)

> **D1採用は確定**。以下のテーブル定義は**設計案（未承認）**。SQLは概念的な草案であり、そのまま本番適用する前に仕様を確定する。

## 1. 設計原則

- 本番用D1データベースは原則1つ、内部でテーブルを分割する。
- 画像の実体はD1に入れず、R2に保存する案。
- 原則 `INTEGER PRIMARY KEY` を採用。公開URLに連番IDを使うかは未決定。
- `user_id`、`pin_id`、`plan_id` 等は外部キー。
- `google_sub`、ユーザーの公開用 `handle` は一意。
- 外部キーによる削除と画像削除を混同しない。
- **方針**: boo_manKnowがDB・API契約を管理し、投稿のyua、地図のozako、計画のhaと必要なデータ項目を協議・レビューする。以下のスキーマ、画像構造、IDや日時等はこれによって確定されたものではない。

## 2. リレーション

```text
users (1) ── (N) pins (1) ── (N) pin_images
   │               │
   │               ├── (N) pin_likes (N) ── users
   │               └── (N) plan_items (N) ── plans (N) ── (1) users
   ├── (N) sessions
   └── (N) reports

[将来] users ── pin_bookmarks / plan_bookmarks
```

## 3. テーブル案

### users
| カラム | 型 | 制約・説明 |
|---|---|---|
| `id` | INTEGER | PK |
| `google_sub` | TEXT | NOT NULL, UNIQUE。Googleの安定識別子 |
| `handle` | TEXT | NOT NULL, UNIQUE、変更不可 |
| `display_name` | TEXT | NOT NULL、重複可 |
| `created_at` | TEXT | NOT NULL、UTC時刻 |

メールアドレス、パスワード、アクセストークンの永続保存は原則不要（暫定）。

### sessions
| カラム | 型 | 制約・説明 |
|---|---|---|
| `token_hash` | TEXT | PK、セッション秘密値のハッシュ |
| `user_id` | INTEGER | FK → users.id、ON DELETE CASCADE |
| `expires_at` | TEXT | NOT NULL |
| `created_at` | TEXT | NOT NULL |

セッション方式自体は未決定。トークン方式を採用した場合のテーブル案。

### pins
| カラム | 型 | 制約・説明 |
|---|---|---|
| `id` | INTEGER | PK |
| `user_id` | INTEGER | FK → users.id、NOT NULL |
| `title` | TEXT | NOT NULL |
| `body` | TEXT | プレーンテキスト |
| `emoji` | TEXT | 任意 |
| `latitude` | REAL | NOT NULL、-90〜90 |
| `longitude` | REAL | NOT NULL、-180〜180 |
| `status` | TEXT | `draft` / `published` |
| `created_at` | TEXT | 作成日時 |
| `updated_at` | TEXT | 更新日時 |
| `published_at` | TEXT | 投稿日時。下書きではNULL |

いいね件数は原則 `pin_likes` から集計する案。住所保存は未決定。

### pin_images
| カラム | 型 | 制約・説明 |
|---|---|---|
| `id` | INTEGER | PK |
| `pin_id` | INTEGER | FK → pins.id、ON DELETE CASCADE |
| `object_key` | TEXT | NOT NULL, UNIQUE。R2オブジェクトキー |
| `position` | INTEGER | NOT NULL、画像順 |
| `mime_type` | TEXT | 検証済みMIME |
| `size_bytes` | INTEGER | 保存後のサイズ |

ピンあたり3枚上限はサーバーで検証。画像のバイト列をR2に保存する案。

### plans
| カラム | 型 | 制約・説明 |
|---|---|---|
| `id` | INTEGER | PK |
| `user_id` | INTEGER | FK → users.id、NOT NULL |
| `title` | TEXT | NOT NULL（暫定） |
| `body` | TEXT | 任意 |
| `emoji` | TEXT | 任意 |
| `cover_image_key` | TEXT | 任意、R2キー（暫定） |
| `status` | TEXT | `draft` / `published` |
| `created_at` | TEXT | 作成日時 |
| `updated_at` | TEXT | 更新日時 |
| `published_at` | TEXT | 公開日時 |

旅行計画の画像の枚数・アップロード規則は未決定。

### plan_items

ピンとひとコマを共通の項目として保存する**提案**。テーブル名・カラム名・制約は未承認。
| カラム | 型 | 制約・説明 |
|---|---|---|
| `id` | INTEGER | PK。計画内の項目そのものを識別し、欠損ピンの枠も識別 |
| `plan_id` | INTEGER | FK → plans.id、ON DELETE CASCADE |
| `type` | TEXT | `pin` / `moment`（ひとコマ） |
| `position` | INTEGER | NOT NULL、表示順 |
| `duration_minutes` | INTEGER | 共通の時間を任意の所要時間（分）とする案 |
| `pin_id` | INTEGER | ピンの参照先。FK → pins.id、ON DELETE SET NULL、NULL可 |
| `title` | TEXT | ひとコマの名前。ピンのタイトルは参照先から取得 |


### pin_likes
| カラム | 型 | 制約・説明 |
|---|---|---|
| `user_id` | INTEGER | FK → users.id |
| `pin_id` | INTEGER | FK → pins.id |
| `created_at` | TEXT | いいね日時 |
| **主キー** | `(user_id, pin_id)` | 複合PK（暫定） |

### reports
| カラム | 型 | 制約・説明 |
|---|---|---|
| `id` | INTEGER | PK |
| `reporter_user_id` | INTEGER | FK → users.id（暫定） |
| `target_type` | TEXT | `pin` / `plan` 等（対象未決定） |
| `target_id` | INTEGER | 対象ID |
| `reason` | TEXT | 通報理由 |
| `status` | TEXT | `open` / `reviewed` 等（暫定） |
| `created_at` | TEXT | 通報日時 |

`target_type` + `target_id` の方式ではDB外部キーで対象を保証できない。ピン専用・計画専用テーブルに分ける案もあり、未決定。

### ブックマーク（将来用）
`pin_bookmarks(user_id, pin_id, created_at)` と `plan_bookmarks(user_id, plan_id, created_at)` を別表で追加する案。各 `(user_id, 対象ID)` を複合PKとする。

## 4. 削除規則（暫定）

| 操作 | 関連データ |
|---|---|
| ピン削除 | `pin_images`・`pin_likes`削除、ピン項目の `plan_items.pin_id = NULL`、R2画像削除 |
| 計画削除 | `plan_items`削除、ピン自体は保持、計画画像削除 |
| 退会 | 所有ピン・計画・画像・セッション・いいね等を削除。第三者の計画には欠損ピン枠を残す |

**重要**: 退会時の削除順序と `users → pins` の外部キー動作は実装前に確定すること。

## 5. インデックス案

- `pins(status, published_at)` — 公開新着一覧
- `pins(status, latitude, longitude)` — 地図範囲検索の候補
- `pins(user_id, status)` — 自分の投稿
- `plans(user_id, status)` — 自分の計画
- `plan_items(plan_id, position)` — 計画の並び順
- `pin_likes(pin_id)` — いいね集計

本文・ハッシュタグ検索は小規模ならLIKE、必要に応じてFTS5等を検討する。地図検索のインデックス方式、ページング、検索性能は負荷試験後に確定。
