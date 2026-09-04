# 新温泉町役場 打刻PWA

スマホのホーム画面に追加すると、ブラウザのアドレスバーなしで起動する
本物のPWA(Progressive Web App)です。GitHub Pagesでホスティングし、
打刻データの読み書きは既存のGoogle Apps Script APIに対してfetchで行います。

## 構成

- `index.html` / `style.css` / `app.js` — 画面本体(ビルド不要)
- `manifest.json` — PWAマニフェスト
- `service-worker.js` — アプリシェルをキャッシュし、インストール判定を満たすためのService Worker
- `icons/` — アプリアイコン(192x192, 512x512、any/maskable各2種)
- `scripts/make-icons.js` — アイコンPNGを再生成するスクリプト(`node scripts/make-icons.js`)

## GitHub Pagesへのデプロイ手順

1. このフォルダをGitHubリポジトリにする(新規リポジトリを作成してpush、または
   このフォルダをリポジトリのルート/`docs`フォルダに配置)
2. GitHubリポジトリの Settings → Pages で、公開元をこのフォルダに設定して有効化
3. `https://(ユーザー名).github.io/(リポジトリ名)/` で公開される
4. スマホでそのURLを開き、共有メニューから「ホーム画面に追加」するとPWAとして
   インストールされる(アドレスバーなしの全画面アプリとして起動)

## 動作確認したこと

- ローカル静的サーバーでのファイル配信(全ファイル200)
- headless Edgeでのスクリーンショット目視確認(メイン画面/iOS位置情報ガイド4手順/
  Android位置情報ガイド4手順、いずれも既存Index.htmlのSVGモックアップと同等の見た目)
- `node --check` によるJS構文チェック

未確認: 実機での「ホーム画面に追加」インストール動作、および実際のApps Script API
との疎通(このマシンからはscript.google.comへの外部通信ができない環境だったため)。
GitHub Pagesに公開後、実機でのインストールと打刻の疎通確認を行ってください。

## APIエンドポイント

`app.js` 冒頭の `API_BASE` 定数に既存のApps Script WebアプリURLを設定済みです。
変更する場合はそこを書き換えてください。
