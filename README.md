# vite-vanilla-v1

## Overview

シンプルで使いやすい日記アプリケーションです。日々の出来事や気持ちを記録し、振り返ることができます。

**主な機能:**
- 📝 日記の作成・編集・削除
- 😊 気分トラッカー（感情を絵文字で記録）
- 🌙 ダークモード対応
- 📄 テンプレート機能（よく使う形式を保存）
- 📷 画像・ファイル添付
- 🔍 キーワード検索・期間フィルタ
- 📊 統計・分析機能（投稿頻度、文字数トレンド、気分統計）
- ⏰ 日記リマインダー
- 🔥 継続日数カウンター
- 💾 データのバックアップ・復元
- 📥 インポート・エクスポート（JSON、PDF）
- ☁️ クラウド同期機能

## Tech Stack

- **Frontend Framework**: Vanilla TypeScript
- **Build Tool**: Vite 7.x
- **CSS Framework**: Tailwind CSS 4.x
- **Language**: TypeScript 5.8.x
- **Storage**: LocalStorage（ブラウザローカル）

## Setup

### 前提条件
- Node.js（推奨: v18以上）
- npm または yarn

### インストール手順

1. リポジトリをクローン
```bash
git clone <repository-url>
cd vite-vanilla-v1
```

2. 依存関係をインストール
```bash
npm install
```

3. 開発サーバーを起動
```bash
npm run dev
```

4. ブラウザで `http://localhost:5173` を開く

## Usage

### 開発

```bash
npm run dev
```

開発サーバーが起動し、ホットリロードが有効になります。

### ビルド

```bash
npm run build
```

本番用にビルドされたファイルが `dist/` ディレクトリに生成されます。

### プレビュー

```bash
npm run preview
```

ビルドされたアプリケーションをローカルでプレビューできます。

## Directory Structure

```
vite-vanilla-v1/
├── public/           # 静的ファイル
│   └── vite.svg     # Viteロゴ
├── src/
│   ├── main.ts      # メインのアプリケーションロジック
│   ├── style.css    # カスタムスタイル
│   ├── pdf-template.html  # PDFエクスポート用テンプレート
│   └── vite-env.d.ts      # Vite型定義
├── index.html       # エントリーポイント
├── package.json     # プロジェクト設定
└── tsconfig.json    # TypeScript設定
```

## License

This repository is for personal/private use only.
