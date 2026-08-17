# 家計簿 (Expense Tracker)

レシートを撮影するだけで、Claude（Anthropic API）が金額・日付・店名を自動で読み取ってくれるシンプルな家計簿アプリです。

## 主な機能

- **レシート撮影 → 自動読み取り**: カメラで撮影、または画像を選択すると、Claude Haiku 4.5 が以下を抽出します。
  - 合計金額（お預り・お釣り・ポイント等と混同しないよう判別）
  - 購入日（西暦・和暦どちらの表記にも対応し、ISO形式 `YYYY-MM-DD` に変換）
  - 店名（自動でメモ欄に入力、手動修正も可能）
- **手入力**: 読み取りに失敗した場合や、レシートがない場合も手動で入力可能
- **カテゴリ分類**: 食費・日用品・交通費・交際費・その他
- **固定費管理**: 家賃やサブスクなど毎月発生する費用を登録し、月ごとの記録を自動生成
- **月次合計**: 今月の支出（レシート分＋固定費）と最近の支出一覧をホーム画面に表示
- **複数プロフィール**: 家族など複数人での利用を想定したプロフィール切り替え
- **オフライン保存**: すべてのデータはブラウザの IndexedDB（[idb](https://github.com/jakearchibald/idb)）にローカル保存

## 技術構成

| 領域 | 技術 |
| --- | --- |
| フロントエンド | React 18 + TypeScript + Vite |
| バックエンド | Express（レシート画像解析APIのプロキシ用） |
| AI | Claude API（`@anthropic-ai/sdk`, モデル: `claude-haiku-4-5`） |
| データ保存 | IndexedDB（`idb`） |

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. Claude APIキーの設定

[Anthropic Console](https://console.anthropic.com) でAPIキーを発行し、プロジェクト直下の `.env.local` に設定します（このファイルは `.gitignore` によりコミットされません）。

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx
```

### 3. 開発サーバーの起動

バックエンド（レシート解析API）とフロントエンドを、それぞれ別のターミナルで起動します。

```bash
# バックエンド（http://localhost:3787）
npm run server

# フロントエンド（http://localhost:5173）
npm run dev
```

ブラウザで `http://localhost:5173` を開くとアプリが使えます。Viteが `/api` へのリクエストを自動でバックエンドにプロキシします。

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | Vite開発サーバーを起動 |
| `npm run server` | レシート解析用Expressサーバーを起動（`.env.local` を自動読み込み） |
| `npm run build` | 型チェック後、本番用にビルド |
| `npm run preview` | ビルド済みアプリをローカルでプレビュー |

## ディレクトリ構成

```
.
├── server/
│   └── index.js        # レシート画像→Claudeで金額・日付・店名を抽出するAPI
├── src/
│   ├── screens/         # 画面コンポーネント（ホーム・撮影・確認・固定費など）
│   ├── components/       # 共通UIコンポーネント
│   ├── db.ts             # IndexedDBアクセス層
│   ├── ocr.ts             # レシート解析APIを呼び出すクライアント
│   └── types.ts           # 型定義
└── .env.local            # APIキー（コミットされません）
```

## 注意事項

- `ANTHROPIC_API_KEY` はサーバー（`server/index.js`）側でのみ使用され、フロントエンドのコードやブラウザには一切露出しません。
- Claudeの読み取り結果（金額・日付・店名）は必ず確認画面で表示され、誤りがあれば保存前に手動で修正できます。
