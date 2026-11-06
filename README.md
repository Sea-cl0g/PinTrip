# Travel Map SNS — 詳細仕様書

> 状態: Draft / 2026-10-22  
> これまでの協議に基づき復元した実装用仕様書。  
> **確定**: 会話で決定済み / **暫定**: 実装提案 / **未決定**: 要確認。

## ドキュメント一覧

| 文書 | 内容 |
|---|---|
| [Product requirements](./docs/requirements.md) | 機能要件、スコープ、公開ルール |
| [Frontend](./docs/frontend.md) | 画面構成、UI、操作、状態 |
| [Backend](./docs/backend.md) | サーバー責務、認可、処理フロー |
| [Database](./docs/database.md) | D1テーブル、主キー、外部キー、削除規則 |
| [API](./docs/api.md) | HTTPエンドポイント、入出力、エラー |
| [Authentication](./docs/authentication.md) | Googleログイン、セッション、個人情報 |
| [Media](./docs/media.md) | 画像処理、R2、アップロード |
| [Technology](./docs/technology.md) | 採用技術、Cloudflare構成、開発環境 |
| [Security & operations](./docs/security-operations.md) | セキュリティ、性能、運用 |
| [Development](./docs/development.md) | 担当分担、Git、実装順序、テスト |
| [Open decisions](./docs/open-decisions.md) | 未決定事項と確認待ちの提案 |

## システム概要

旅行の思い出や訪問候補を地図上の**ピン**として管理し、複数のピンを**旅行計画**にまとめて公開できるWeb SNS。

- 誰でも公開投稿・公開旅行計画を閲覧できる。
- 投稿・旅行計画の作成、編集、いいね等の書き込みにはGoogleログインが必要。
- 公開範囲は「公開」または「作成者のみの下書き」。限定公開やグループ限定公開は初期実装の対象外。
- 旅行計画は自分や他人のピンを参照できる。ピンは複数計画から共有される。
- 経路案内はアプリ内で実装しない。外部地図アプリを開く。

## 論理アーキテクチャ（暫定）

```text
React + TypeScript
  ├─ Google Maps JavaScript API
  └─ HTTPS /api/*
         ↓
Cloudflareのサーバー実行環境（Workers / Pages Functions は未確定）
  ├─ Google IDトークン検証 / アプリセッション
  ├─ 認可・入力検証・ビジネスロジック
  ├─ Cloudflare D1（構造化データ）
  └─ Cloudflare R2（画像本体、採用候補）
```

## 仕様書の管理

仕様変更は各詳細文書を修正し、必要なら `open-decisions.md` の状態も更新する。
