# LWC の画面モック（snapshot）を表示するコンポーネントの検討

レポートに、LWC のコンポーネントがどう見えるかを、静的な画面モック（snapshot）として表示できるかを検討した。結論は **作成できる**。方式を 2 つに分け、段階的に作る案にする。

| 方式                    | 内容                                                                               | 見た目の正確さ                          | 実行するもの                                | 確認                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **A. ワイヤーフレーム** | parse したテンプレート（`LwcTemplateJson`）から、要素の配置を枠で描く              | 低（構造だけ）                          | なし（JSON を描くだけ）                     | parse の方針（[lwc-implementation.md](./lwc-implementation.md)）から作れる                                  |
| **B. SSR の snapshot**  | **`@lwc/engine-server`**（9.5.1。決定）でコンポーネントを実際に描画し、HTML にする | 高（実際のテンプレート・CSS・条件分岐） | リポジトリのコンポーネントの JS（ビルド時） | **試作で描画を確認した**（[docs/examples/lwc/scripts/ssr-snapshot/](./examples/lwc/scripts/ssr-snapshot/)） |

## 1. 方式 B: SSR の snapshot（試作の結果）

[docs/examples/lwc/scripts/ssr-snapshot/](./examples/lwc/scripts/ssr-snapshot/)（リポジトリのルートで `npx rollup -c docs/examples/lwc/scripts/ssr-snapshot/rollup.config.mjs && node docs/examples/lwc/scripts/ssr-snapshot/dist/out.mjs`）で、次を確認した。

```text
c/hello (hello.js / hello.html / hello.css)
  │ @lwc/rollup-plugin でビルド（lwc は @lwc/engine-server に向ける）
  │   lightning-card / lightning-button → スタブのコンポーネント
  │   @salesforce/apex/* → モックの wire adapter
  ▼
renderComponent('c-hello', Hello, props)  →  HTML（Declarative Shadow DOM）
```

| 確認したこと                                           | 結果                                                                                                                                                                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@api` のプロパティを渡して描画する                    | OK（`title` がカードの見出しに出る）                                                                                                                                                                                |
| `@wire` の値をモックで差し込む                         | OK。`@salesforce/apex/*` をモックの wire adapter（`connect()` で `dataCallback({ data })` を呼ぶクラス）に置き換える。値を返す関数ではなく、wire adapter の形が要る（`connector.connect is not a function` になる） |
| `lwc:if` / `lwc:else` / `for:each` / getter            | OK。データあり（2 行のリスト）と、データなし（「データがありません」）を出し分けられた                                                                                                                              |
| 子コンポーネント（`c-child`）・slot（`slot="footer"`） | OK                                                                                                                                                                                                                  |
| CSS                                                    | OK（`:host` などのスコープ付きの CSS が `<style>` として入る）                                                                                                                                                      |
| 出力の形                                               | `<template shadowrootmode="open">` の Declarative Shadow DOM。Chrome / Edge / Safari / Firefox（123 以降）はそのまま描画できる                                                                                      |

試作で分かった注意点:

- `@lwc/rollup-plugin` は既定で `lwc` を `@lwc/engine-dom`（ブラウザ用）に解決するので、`@lwc/engine-server` に向け直す。
- モックのファイルは LWC のコンポーネントとして変換されないよう、プラグインの `exclude` に入れる。

## 2. `lightning-base-components`（npm）を使えるか（調査の結果）

`lightning-*` の部品を自前のスタブにする代わりに、Salesforce が npm で配布している [`lightning-base-components`](https://www.npmjs.com/package/lightning-base-components) を `@lwc/engine-server` で描画できるかを試した（[docs/examples/lwc/ssr-lbc/](./examples/lwc/scripts/ssr-lbc/)。採用が決まるまで本体の依存関係には入れないので、このフォルダで `npm install` → `npm run snapshot`）。

**結論: SSR で描画できる**。本物の `lightning-*` のマークアップ（SLDS のクラス付き）になり、見た目が実際の画面に近くなる。ただし、ライセンスの確認と、出力のサイズ・一部の値が出ないことへの対応が要る。

### 2.1 パッケージ

| 項目               | 内容                                                                                                                                                                                                                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 版                 | `1.28.19-alpha`（`latest`）。**alpha の版しか配布されていない**（ほかに `ssr` タグの `1.18.8-ssr`、`next` タグの `1.26.3-rc.0-alpha`）。118 版                                                                                                                                                      |
| 中身               | `src/lightning/` に 211 の部品・内部モジュール（約 13 MB）。`package.json` の `lwc.modules` に、`@salesforce/label/*`・`@salesforce/i18n/*`・`@salesforce/gate/*` などの 465 のモジュールの差し替え（スタブ）を持つ                                                                                 |
| 含まれる部品       | `card` / `button` / `button-icon` / `button-menu` / `input` / `combobox` / `datatable` / `tree-grid` / `layout` / `tabset` / `accordion` / `badge` / `icon` / `pill` / `spinner` / `formatted-*` / `progress-*` / `modal` / `vertical-navigation` など（README の一覧）                             |
| **含まれない部品** | Salesforce のデータを使う部品: `lightning-record-form` / `record-edit-form` / `record-view-form` / `input-field` / `output-field`、`lightning-file-upload`、`lightning-input-rich-text`、`lightning-map`                                                                                            |
| ライセンス         | `package.json` は MIT だが、`LICENSE.txt` は **Salesforce の利用規約**（2025-04-15 版）。複製・改変・公開表示・再配布は無償で許可される一方、AS IS（サポートなし）、Salesforce への補償（indemnify）、**利用データの収集**（"Salesforce may collect … Usage Data"）、カリフォルニア州法の条項がある |
| 外部への通信       | ソースで見つかったのはアイコンの SVG の取得（`iconUtils/fetchSvg.js`）と、表の無限スクロールだけ（SSR では実行されない）                                                                                                                                                                            |

### 2.2 描画の結果

`lightning-card`（アイコン・アクションのボタン付き）、`lightning-layout`、`lightning-input`、`lightning-combobox`、`lightning-badge`、`lightning-formatted-number`、`lightning-datatable`、`lightning-tabset` を使ったコンポーネントで確認した。

| 確認したこと                     | 結果                                                                                                                                                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 部品の描画                       | OK。カードの見出し・ボタン（`slds-button_brand`）・入力欄のラベル・コンボボックス・バッジ・タブが本物のマークアップになる                                                                                                              |
| データの表示                     | OK。`lightning-datatable` の行（`Acme` / `日本商事`）、`lightning-formatted-number` の通貨（`¥1,235`）                                                                                                                                 |
| **`lightning-input` の `value`** | **出ない**（値は描画後に DOM のプロパティとして設定されるため、HTML の `value` 属性にならない）。入力済みの画面を見せるには、描画後に値を入れる（4.2）                                                                                 |
| **アイコン**                     | **出ない**（`<use href/>` が空。SVG のスプライト（`@salesforce-ux/design-system` のアイコン）を読む設定が要る）                                                                                                                        |
| **出力のサイズ**                 | **HTML が 約 170 万文字**。うち `<style>` が 267 個・約 171 万文字で、HTML 本体は約 2 万文字。各部品が SLDS のスタイルを自分の Shadow DOM の中に持つため、部品の数だけ同じスタイルが繰り返される（重複を除くと 54 種類・約 32 万文字） |
| ビルドの時間                     | 20〜50 秒（lightning-base-components の依存をすべて変換する）。レポートの作成ごとに 1 回ビルドし、全コンポーネントをまとめる                                                                                                           |
| スタイル                         | Shadow DOM の中に部品自身の SLDS のスタイルが入るので、README の「SLDS はアプリ全体に定義する」「`@lwc/synthetic-shadow` が必要」という制約は、SSR（Declarative Shadow DOM）では問題にならなかった                                     |

### 2.3 ビルドの設定で必要だったこと

| 設定                                                                        | 理由                                                                                               |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `@lwc/rollup-plugin` の `modules` に `{ npm: 'lightning-base-components' }` | `lightning/*` をパッケージから解決し、パッケージの `lwc.modules`（`@salesforce/*` のスタブ）も使う |
| `enableDynamicComponents: true`                                             | パッケージの中で `lwc:is`（動的コンポーネント）を使う                                              |
| `import.meta.env.SSR` を `true` に置き換える                                | パッケージが Vite の書き方（`import.meta.env.SSR`）で SSR かどうかを見る（110 か所）               |
| `@lwc/engine-dom` / `@lwc/synthetic-shadow` / `@lwc/wire-service` を入れる  | パッケージのモジュール解決の設定が参照する（実行時には使わない）                                   |
| `lwc` を `@lwc/engine-server` に向ける                                      | 1 章と同じ                                                                                         |

### 2.4 自前のスタブとの比較

|                                        | `lightning-base-components`            | 自前のスタブ           |
| -------------------------------------- | -------------------------------------- | ---------------------- |
| 見た目                                 | 実物に近い（本物のマークアップ・SLDS） | 骨組み（作り込み次第） |
| 部品の数                               | 約 70（README の一覧）                 | 作った分だけ           |
| 含まれない部品（`record-*-form` など） | スタブが要る                           | スタブが要る           |
| 出力のサイズ                           | 大きい（スタイルの重複。4.2 で減らす） | 小さい                 |
| 依存関係・ライセンス                   | alpha 版のみ。Salesforce の利用規約    | なし                   |

## 3. 方式 B を本番にするために必要なもの

| 項目                           | 内容                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`lightning-*` の部品**       | `lightning-base-components`（2 章）を使うか、自前のスタブにする。どちらでも、含まれない部品（`lightning-record-*-form` / `input-field` / `output-field` など）はスタブ（SLDS のクラスを付けた骨組み）を用意する                                                                                                                                                                                                            |
| **`@salesforce/*` の import**  | `apex`: モックの wire adapter（`@wire`）と、Promise を返す関数（命令的な呼び出し）の両方として使えるもの。`schema`: `{ objectApiName, fieldApiName }` の定数。`label`: ラベルの値（なければキー）。`user/Id`・`resourceUrl` など: 固定の値                                                                                                                                                                                 |
| **`lightning/*` のモジュール** | `lightning/uiRecordApi`（`getRecord` などのモックの wire adapter）、`lightning/navigation`（何もしない `NavigationMixin`）、`lightning/platformShowToastEvent` など                                                                                                                                                                                                                                                        |
| **モックのデータ**             | snapshot ごとの「状態」（`@api` の値と、wire adapter が返す値）。レポートの仕様（skill）で指定する（5 章）                                                                                                                                                                                                                                                                                                                 |
| **TS**                         | 型を空白にした JS（[lwc-implementation.md](./lwc-implementation.md) 4 章）をビルドに渡す（rollup のプラグインで置き換える）                                                                                                                                                                                                                                                                                                |
| **SLDS の CSS**                | `lightning-base-components` の部品は、自分の Shadow DOM の中に SLDS のスタイルを持つ（2.2）。自前のスタブと、コンポーネント自身のテンプレートの SLDS のクラス（`slds-m-top_small` など）のために、`@salesforce-ux/design-system` の CSS もレポートに入れる。Shadow DOM の中にはページの CSS が届かないので、自前のスタブは light DOM（`static renderMode = 'light'`）にするか、スタブの CSS に必要な SLDS のクラスを入れる |
| **実行の隔離**                 | リポジトリのコンポーネントの JS を実行する（`connectedCallback`、getter など）。ワーカースレッド（`node:vm` の別コンテキスト）で実行し、時間の上限を付ける。ネットワーク・ファイルへのアクセスはさせない                                                                                                                                                                                                                   |
| **出力のサイズ**               | `lightning-base-components` を使うとスタイルが部品の数だけ繰り返される（2.2）。HTML を書き出すときに、同じ `<style>` を 1 つにまとめ（`<style data-lwc-style="n">` の置き場所にする）、表示するページ（`iframe`）の小さなスクリプトで、各 Shadow DOM に `adoptedStyleSheets` として共有のスタイルシートを付ける。スクリプトを使わない場合は、レポートの圧縮（gzip）に任せる                                                |
| **描画後に設定される値**       | `lightning-input` の `value` など、描画後に DOM のプロパティとして設定される値は HTML に出ない（2.2）。表示するページのスクリプトで、snapshot の状態の値を入れ直す（`input` の `value` 属性にする）か、出ないことを仕様とする                                                                                                                                                                                              |
| **アイコン**                   | `@salesforce-ux/design-system` のアイコンの SVG（スプライト）をレポートに入れ、`<use href>` の参照先を設定する（2.2）                                                                                                                                                                                                                                                                                                      |

SSR では実行されないもの（snapshot に出ない）:

- `renderedCallback`、`setTimeout` などの非同期処理、DOM の API（`this.template.querySelector`）。`connectedCallback` の中で `await` して取ったデータは出ない（wire で渡す必要がある）。
- イベントによる状態の変化（クリックしたあとの画面）。必要なら、その状態のプロパティを直接渡した snapshot を別に作る。

## 4. 方式 A: ワイヤーフレーム

JS を実行せず、parse したテンプレートの JSON から描く。方式 B の前に作れて、実行の隔離も要らない。

| テンプレートの要素                              | 描き方                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| HTML の要素（`div` / `p` / `ul` など）          | そのままの要素（テキストの式 `{row.Name}` は `‹row.Name›` のような置き場所として表示）                 |
| `c-*` のコンポーネント                          | 枠と名前。展開すると、その子コンポーネントのワイヤーフレームを入れ子で描く（再帰は深さの上限を付ける） |
| `lightning-*` の部品                            | 種類ごとの簡単な絵（ボタン・入力欄・表・カード）と、静的な属性（`label="追加"`）                       |
| `lwc:if` / `lwc:elseif` / `lwc:else`、`if:true` | 分岐ごとにタブ（または両方を点線で並べる）                                                             |
| `for:each` / `iterator`                         | 1 件分を描き、「× n」と表示                                                                            |
| `slot`                                          | 名前付きの差し込み口として枠で表示                                                                     |

- データは使わない（式の名前を表示する）。条件の分岐をすべて見せられるので、レビュー用には SSR より分かりやすい場面もある。

## 5. レポートのコンポーネントと仕様

| コンポーネント    | 用途                                                                                                     | データ（provider）                       | 方式 |
| ----------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---- |
| `LwcWireframe`    | テンプレートの構造の画面モック。分岐はタブで切り替える                                                   | `lwc.wireframe`（`TemplateIR` から作る） | A    |
| `LwcSnapshot`     | 状態ごとの画面（SSR の HTML を `iframe` の `srcdoc` に入れて表示。SLDS の CSS を同じ `iframe` に入れる） | `lwc.snapshot`（ビルド時に SSR する）    | B    |
| `LwcSnapshotDiff` | before / after の snapshot を並べる（同じ状態のモックで描いたもの）                                      | `lwc.snapshotDiff`                       | B    |

レポートの仕様（[report-components-plan.md](./report-components-plan.md) 1.1）での指定の案:

```jsonc
{
    "component": "LwcSnapshot",
    "data": {
        "provider": "lwc.snapshot",
        "params": {
            "component": "c/hello",
            "states": [
                {
                    "name": "データあり",
                    "props": { "title": "取引先一覧" },
                    "wires": { "getAccounts": { "data": [{ "Id": "1", "Name": "Acme" }] } },
                },
                { "name": "データなし", "wires": { "getAccounts": { "data": [] } } },
                {
                    "name": "エラー",
                    "wires": {
                        "getAccounts": { "error": { "body": { "message": "権限がありません" } } },
                    },
                },
            ],
        },
    },
}
```

- 状態（props と wire の値）は AI（skill）が考える部分にする。解析で `@api` のプロパティと `@wire` の一覧（型があれば型も）を渡し、AI がそれに合うモックのデータを作る。
- `wires` のキーは、wire の対象（プロパティ名）か、adapter の import 名（`getAccounts`）。モックの値がない wire は `{ data: undefined }`（読み込み中の状態）にする。

## 6. 進め方（案）

1. LWC の parse（テンプレート）ができたら、方式 A の `LwcWireframe` を作る（追加の依存なし）。
2. 方式 B（`@lwc/engine-server` / `@lwc/rollup-plugin` / `rollup` は依存関係に入れた）: スタブ（よく使う `lightning-*`）・`@salesforce/*` のモック・実行の隔離を作り、`LwcSnapshot` を作る。
3. `LwcSnapshotDiff`（before / after を同じ状態で描く）。

## 7. 決めること

- SSR は `@lwc/engine-server` に決めた（LWC には新しい SSR の `@lwc/ssr-compiler` もあるが、試作で動いた `@lwc/engine-server` を使う）。

- 方式 B のためにリポジトリのコンポーネントの JS を実行してよいか（実行の隔離の程度）。
- `lightning-*` に `lightning-base-components` を使うか（使える。2 章）。使う場合は、**ライセンス（Salesforce の利用規約。補償・利用データの収集の条項）を確認する**こと、alpha の版しかないこと、出力のサイズへの対応（3 章）を受け入れるか。
