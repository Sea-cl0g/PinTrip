# 使用技術・インフラ構成

[目次へ](./README.md) · [開発計画](./development.md)

## 1. 採用・候補一覧

| 分野 | 技術 | 状態 |
|---|---|---|
| フロントエンド | React | 確定 |
| 言語 | TypeScript | 確定 |
| DB | Cloudflare D1 (SQLite互換) | 確定 |
| 地図 | Google Maps API | 確定 |
| ログイン | Googleログイン | 確定 |
| ホスティング | Cloudflare | 確定 |
| バックエンド実行 | Workers / Pages Functions | 未決定 |
| フロント配信 | Cloudflare Pagesを検討 | 未決定 |
| 画像ストレージ | Cloudflare R2 | 有力候補 |
| CSS | Tailwind CSS | 採用候補 |
| UIコンポーネント | shadcn/ui | 採用候補 |
| アップロードUI | react-dropzone / Uppy | 採用候補 |
| ビルド | Vite | 暫定提案 |
| パッケージ管理 | npm | 確定 |
| ソース管理 | GitHub | 確定 |

## 2. Cloudflare構成（暫定）

```text
Browser
  ├─ React静的アセット ← Cloudflare配信
  ├─ Google Maps API
  └─ /api/* → Cloudflareサーバー実行環境
                     ├─ D1
                     └─ R2
```

Cloudflare上で一般的な常駐PostgreSQLコンテナを動かす設計ではなく、D1とサーバーレス実行環境を利用する。

## 3. Google Maps

- 地図表示、座標に基づくピン表示・地図中心移動に利用。
- 現在地はブラウザの位置情報APIを利用する想定（暫定）。
- 外部地図アプリへは座標からリンクを生成。
- Places API等の地名検索は初期必須ではなく未決定。
- APIキーはブラウザ利用を前提とする適切な制限を設定し、秘密鍵と混同しない。

## 4. 開発環境

- `npm` を利用。
- 各メンバーはローカルでReact開発。
- フロントはモックAPIで先行開発。
- バックエンドのローカル開発はWrangler等を候補とし、Docker採用は未決定。
- 開発用・本番用のD1/R2/設定を分離する案。

## 5. コスト

可能な限り無料枠を使用する。Google Maps APIの利用量、Cloudflareのリクエスト数・ストレージ・DB操作量を確認し、課金上限・アラート等の具体策を決める。無料枠の最新数値はここでは固定しない。

## 6. 未決定

Cloudflare PagesとWorkersの構成、Google Maps APIの具体的な利用機能、画像処理基盤、各種ライブラリの最終選定、デプロイ設定。
