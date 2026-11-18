# レポートの文書の書き方（今の形）

2026-11-18 時点の書き方のまとめ。利用者が文書を書きやすくする作業（[todo.md](./todo.md) の 0 の手順 6・3.2〜3.4）の出発点として、今の形と困るところを書く。

- 文書の定義と検証: [src/report/document.ts](../src/report/document.ts)
- 書き方の決まり（AI に渡す文言）: [src/report/llmCatalog.ts](../src/report/llmCatalog.ts) の `REPORT_RULES`
- 部品と provider の一覧と引数: [catalog/report-catalog.md](./catalog/report-catalog.md)（`npm run catalog` で作る。手で直さない）

**文書は構成の定義**（2026-11-18 に決めた）: 文書に書くのは、どの部品をどう並べ、どの種類のデータ（Apex のメソッド・オブジェクトの項目・ファイルの一覧など）を見せるかまで。個々のデータ（どのクラス・メソッド・オブジェクトか）は書かない。1 つずつ見せるときは for でデータの行を回し、provider の引数・`where` には行の値（`${m.name}` など）を入れる。件数が多ければ `page` で 1 件 1 ページに分ける（1.7）。こうすると、1 つの文書がどのリポジトリにもそのまま使える。構成は利用者・AI が決め、AI がその構成どおりに文章を書いて作る。

## 1. 文書の形

レポートは 1 つの JSON の文書で書く。

```json
{
    "title": "項目の一覧",
    "data": {
        "fields": { "provider": "object.fields", "args": { "includeImplicit": false } }
    },
    "spec": {
        "root": "page",
        "elements": {
            "page": {
                "type": "Stack",
                "props": {
                    "direction": "vertical",
                    "gap": "lg",
                    "align": null,
                    "justify": null,
                    "className": null
                },
                "children": ["summary", "fieldsCard"]
            },
            "summary": {
                "type": "Narrative",
                "props": { "title": "概要", "markdown": "請求書を表すオブジェクト。…" },
                "children": []
            },
            "fieldsCard": {
                "type": "Card",
                "props": {
                    "title": "項目",
                    "description": null,
                    "maxWidth": "full",
                    "centered": null,
                    "className": null
                },
                "children": ["fieldsTable"]
            },
            "fieldsTable": {
                "type": "DataTable",
                "props": {
                    "rows": { "$state": "/data/fields" },
                    "columns": [
                        { "key": "field", "label": "項目" },
                        { "key": "type", "label": "型" }
                    ],
                    "caption": null,
                    "onlyChanged": false
                },
                "children": []
            }
        }
    }
}
```

| 部分               | 中身                                                                                                                                                                                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`            | レポートの題                                                                                                                                                                                                                                                          |
| `data`             | 「名前 → `{ provider, args }`」。ビルドが provider を実行し、結果を `/data/<名前>` に入れる。`withSource: true` を付けると行にソースの抜き出しが付く（`DataTable` の `showSource` 用）。データごとの `diff`・`compare` も書ける（1.1）。要素に直接書いてもよい（1.1） |
| `spec`             | json-render の仕様。`root` と、キー → 要素の**平らな**一覧 `elements`。入れ子は `children` にキーを並べて表す                                                                                                                                                         |
| `diff` / `compare` | 差分を見るときだけ書く。`diff: true` は保存した基準 → 作業ツリー、`compare: { "from": "main" }` は git の範囲（`{ "from": "main", "to": "HEAD" }` も書ける）。書かなければ今の状態のすべて                                                                            |

### 1.1 部品に書くデータと、データごとの比べ方（2026-11-18 から）

データの部品には、データを要素に直接書いてもよい。ビルドが上の段の `data` に移し（名前は要素のキーから作る）、props のデータ（`rows`・`data`）をつなぐ。同じデータを複数の部品で使うときは、今までどおり上の段の `data` に書いて `$state` で指す。

データの宣言（上の段でも要素でも）に `diff`・`compare` を書くと、文書の比べ方よりそちらを使う（`diff: false` は今の状態だけ）。今の状態の仕様と main からの変化を 1 つの文書に並べられる。比べ方を持つ部品の上には「比べた時点」が出る。

```json
"fields": {
    "type": "DataTable",
    "data": { "provider": "object.fields" },
    "props": { "columns": null, "caption": null, "onlyChanged": null },
    "children": []
},
"fieldChanges": {
    "type": "DataTable",
    "data": { "provider": "object.fields", "compare": { "from": "main" } },
    "props": { "columns": null, "caption": null, "onlyChanged": true },
    "children": []
}
```

- MCP のツールは、文書に出てくる比べ方ごとに入力を 1 回だけ読む（git の範囲はコミットを読み込む）。
- 問題は、データを書いた要素の場所（`spec.fieldChanges.data.args.objects` など）で返す。
- 要素の `data` と props のデータの両方を書く・データの部品でない要素に `data` を書くと、問題になる。

### 1.2 for / if / 文章（notes）（2026-11-18 から）

エンジニアがテンプレート言語のように書ける形。例は、すべてのクラスのメソッドを 1 つずつ書くもの（個々のクラス名は書かない）。

```json
{
    "title": "メソッドの仕様",
    "data": {},
    "notes": { "<owner>.<name>": "（AI が行ごとに書く文章）" },
    "spec": {
        "root": "page",
        "elements": {
            "page": { "type": "Stack", "props": { … }, "children": ["method"] },
            "method": {
                "type": "Card",
                "for": {
                    "as": "m",
                    "in": {
                        "provider": "apex.outline",
                        "where": { "memberType": "method" }
                    }
                },
                "props": { "title": "${m.name}(${m.params})", … },
                "children": ["note", "soql"]
            },
            "note": {
                "type": "Narrative",
                "props": { "title": null, "markdown": { "$note": "${m.owner}.${m.name}" } },
                "children": []
            },
            "soql": {
                "type": "DataTable",
                "if": { "hasRows": true },
                "data": {
                    "provider": "apex.dataAccess",
                    "where": { "member": "${m.owner}.${m.name}" }
                },
                "props": { "columns": null, "caption": null, "onlyChanged": null },
                "children": []
            }
        }
    }
}
```

| 書き方                           | 意味                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"for": { "as", "in", "limit" }` | 要素（と子）を `in` の行ごとに繰り返す。`in` はデータの宣言か、上の段の `data` の名前。入れ子にできる。`limit`（既定 200）を超えた行は出さず警告する。root には書けない                                                                                                                                                                                                                      |
| `${m.name}`                      | props・要素の `data`・`if` の中で、行の値に置き換える。`${m.x}` だけの文字列は値をそのまま（配列・数値も。値がなければ `null`）入れ、文の中では文字にする（配列は `, ` でつなぐ）。`m.$index` は 0 から、`m.$number` は 1 から。for の変数でない `${...}` はそのまま残す                                                                                                                     |
| `"where": { 項目: 値 }`          | データの宣言（どこに書いても）の行を、項目の値で絞る。値が配列ならそのどれか。`a.b` で入れ子の項目                                                                                                                                                                                                                                                                                           |
| `"if": {...}`                    | 条件が合わない要素（と子）を出さない。`{ "value", "eq" / "neq" / "gt" / "gte" / "lt" / "lte" / "in" / "exists" }`（比べ方がなければ空でないか）、`{ "hasRows": true }`（この要素のデータに行がある。文字列なら `data` の名前、データの宣言（`provider`・`args`・`where`）を書けばそのデータ。見出しのカードに中の表と同じ宣言を書くと、行がなければカードごと消える）、`all` / `any` / `not` |
| `"notes"` と `{ "$note": キー }` | 文章を上の段の `notes` に置き、props で引く。ないキーは「(未記入)」になり警告が出る。AI は行ごとの文章を `notes` に書けばよい                                                                                                                                                                                                                                                                |

- 展開はビルドのときに行う（json-render の `repeat` は使わない）。for の行・`hasRows` のためにデータを実行し、同じ宣言の結果は使い回す。
- 繰り返した要素のキーは `<キー>__<何行目>`（入れ子は `__0__2`）。問題の場所は `spec.soql[3].data.args...` のように返す。
- root から届かない要素は問題になる（for の中で使う要素も、どこかの `children` に書く）。

### 1.3 列の比を選べるレイアウト `Columns`（2026-11-18 から）

`Columns` は子を左から順に列に入れる。`ratio` で列の幅の比を選ぶ（`[5, 5]`・`[4, 6]`・`[7, 3]` など。1〜6 列。`null` は 2 等分）。子が列より多いときは次の段に回る。`Grid` は等分しかできない。

```json
"row": {
    "type": "Columns",
    "props": { "ratio": [4, 6], "gap": null, "stackBelow": null, "align": null },
    "children": ["note", "soql"]
}
```

- `gap`: 列の間（`sm` / `md`（既定）/ `lg`）
- `stackBelow`: この幅より狭い画面では縦に積む（`sm` 640px / `md` 768px（既定）/ `lg` 1024px / `never` は積まない）
- `align`: 列の縦の揃え方（`start`（既定）/ `center` / `stretch`）
- 幅の広い表・図は、列の中で横に動かせる（列の比は崩れない）。for の中でも使える（1.2 の例の `method` の子に置けば、メソッドごとに左に文章・右に表）

### 1.4 処理フロー `CodeFlowchart`（2026-11-18 から。Apex と LWC）

`apex.methodFlow` は、メソッド・コンストラクター・トリガー・匿名 Apex の文の木から処理フローを作る。箱は開始・処理（続く文は 1 つにまとめる）・分岐（if / switch）・繰り返し・try / catch / finally・return / throw と、SOQL / SOSL・DML・外部の呼び出し・イベントの発行（色を変え、ループの中なら印）。箱の文字はソースの元の文で、箱を押すと元のソースと行番号が出る。

`lwc.methodFlow` は、LWC の JS / TS のメソッド・関数（フィールドのアロー関数・getter / setter・モジュールの関数）から同じ形の処理フローを作る。Apex の呼び出し（`@salesforce/apex` から import した名前・`refreshApex`）・イベントの発行（`dispatchEvent`・トースト・メッセージチャネルの `publish`）・画面の遷移（`NavigationMixin.Navigate`）・`fetch` は色を変える。switch の case は次の case に続くので、本体のない case は次の case とまとめる。

for でメソッドごとに描くときは、`where` に `member` と `signature` を書いて 1 つに絞る（オーバーロードも分けられる）。

```json
"row": { "type": "Columns", "props": { "ratio": [6, 4], … }, "children": ["chart", "note"] },
"chart": {
    "type": "CodeFlowchart",
    "data": {
        "provider": "apex.methodFlow",
        "where": { "member": "${m.owner}.${m.name}", "signature": "${m.name}(${m.params})" }
    },
    "props": { "member": null, "height": null },
    "children": []
}
```

- `member`: 1 つだけ出す（`owner.name` か `name(引数の型)`）。`null` ならすべてで、2 つ以上なら選ぶ欄が出る
- `height`: 図の高さ（px）。`null` なら図に合わせる（240〜720）

### 1.5 流れの図 `EventFlow`・`SequenceDiagram`（2026-11-18 から）

処理フロー（1 つの関数の中）では分からない、関数・コンポーネントをまたぐ流れ。

- `lwc.eventFlow` → `EventFlow`: 起点のコンポーネント（と `depth` 段の子。既定 1）の、テンプレートのイベント（`<lightning-button> click`）・`@wire`・表示のとき（`connectedCallback` など）から、ハンドラー → 自分のメソッド（`this.x()`・`addEventListener` に渡したもの）→ Apex の呼び出し・`refreshApex`・イベントの発行・トースト・画面の遷移・メッセージチャネルへの流れ。子コンポーネントが発行したイベントは、親のテンプレートの `on<イベント>` につなぐ。左から右の図
- `apex.callFlow` → `SequenceDiagram`: 起点のメソッド（`members`。トリガーは名前）から、呼び出し・SOQL / SOSL・DML（`Database` へ）・非同期の開始・外部の呼び出し・イベントの発行をソースの順に並べたシーケンス図。リポジトリのクラスのメソッドは `depth` 段（既定 3）まで中をたどり、呼んだ先の出来事には段の数だけ `›` が付く。標準のメソッド（`String.valueOf` など）は出さない。ループの中には `⚠`
- `EventFlow` の Apex の箱（`Class.method`）を `apex.callFlow` の `members` に渡すと、画面の操作から Apex の中までをつなげて書ける

```json
"events": { "type": "EventFlow", "data": { "provider": "lwc.eventFlow", "args": { "components": ["${c.component}"] } }, "props": { "height": null }, "children": [] },
"calls": { "type": "SequenceDiagram", "data": { "provider": "apex.callFlow", "args": { "members": ["${m.owner}.${m.name}"] } }, "props": { "start": null }, "children": [] }
```

### 1.6 文書の引数 `params`（2026-11-18 から。構成の値だけ）

構成の値（見せるデータの種類・たどる段数・表示の切り替えなど）を、文書の外から変えられるようにする。文書に引数を宣言し、題・props・データの引数・if の中で `${params.<名前>}` と使う。**個々のデータの名前（クラス名など）を渡す使い方はしない**。

```json
{
    "title": "メンバーの一覧 (${params.memberTypes})",
    "params": {
        "memberTypes": { "default": ["method"], "description": "見せるメンバーの種類" },
        "depth": { "default": 2, "description": "呼び出しをたどる段数" }
    },
    "data": {},
    "spec": { … "data": { "provider": "apex.outline", "where": { "memberType": "${params.memberTypes}" } } … }
}
```

- 値は MCP のツール（`build_report`・`validate_report_spec`）の `params`（`{ "depth": 3 }`）で渡す。渡した値が `default` より優先する（コマンドラインは `--param depth=3`）
- 値も `default` もない引数、宣言していない引数を渡したときは、問題になる（場所は `params.<名前>`）
- `params` は for の変数と同じ置き換え（`"${params.x}"` だけの文字列は値をそのまま。配列・数値も渡せる）。for の `as` に `params` は使えない

### 1.7 1 件 1 ページ `page`（2026-11-18 から）

すべてのクラス・オブジェクトなどを出すと大きくなるので、件数を絞る代わりにページに分ける。要素（ふつうは for の要素）に `page` を付けると、その要素（for で広げた 1 件ずつ）と子が別の HTML になり、元の文書のその場所にはページへのリンク（`PageLink`）が並ぶ（目次）。

```json
"unit": {
    "type": "Card",
    "for": { "as": "u", "in": { "provider": "metadata.units", "args": { "types": ["apexClass"] } }, "limit": 5000 },
    "page": { "file": "${u.name}" },
    "props": { "title": "${u.name}", … },
    "children": [ … ]
}
```

- 書き出すもの: 目次（`<名前>/index.html`）と各ページ（`<名前>/pages/<file>.html`）。ページの上には目次へ戻るリンクが出る
- 各ページには、そのページで使うデータだけを入れる。大きさの警告もページごとに見る
- `page.title` を書かなければ、要素の `title` をページの題にする。ページの中のページ（入れ子）は分けない（警告）

### 1.8 エディターの補完 `$schema`（2026-11-18 から）

文書の JSON Schema を [catalog/report-document.schema.json](./catalog/report-document.schema.json) に置いた（`npm run catalog` で作る）。文書の先頭に `"$schema"` でこのファイルを書くと、VS Code などで次が補完・検証される。

- 要素の `type`（部品の名前）と、`type` ごとの `props`（足りないキー・値の誤り）
- データの宣言の `provider`（provider の名前）と、provider ごとの `args`
- `for`・`if`・`page`・`params`・`notes` の形
- `${m.x}`・`${params.x}` を含む文字列、`{ "$note": … }`・`{ "$state": … }` は、どの値の場所にも書ける。データの部品の `rows`・`data` は、要素の `data` に書くなら省ける

雛形は [catalog/templates/](./catalog/templates/) に `$schema` 付きの JSON のファイルとして置いた（コピーして直す）。`sf-metascope report new <雛形> --out <file>` も `$schema` を付けて書く。MCP のリソース `metascope://schema/report-document` も同じスキーマを返す。

### 1.9 省略と短い書き方（2026-11-18 から）

文書を確かめる前に、今の形（平らな `elements`・すべての props）に直す（[shorthand.ts](../src/report/shorthand.ts)）。すべて書く形もそのまま通る。

```json
{
    "title": "Flow の一覧",
    "spec": {
        "root": {
            "type": "Stack",
            "props": { "direction": "vertical", "gap": "lg" },
            "children": [
                { "type": "Narrative", "props": { "markdown": "(概要)" } },
                { "key": "flows", "type": "DataTable", "data": { "provider": "flow.list" } }
            ]
        }
    }
}
```

| 書き方                               | 直した形                                                                                             |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| props の省いたキー                   | その部品が `null` を受け取れるなら `null`（値の要るキーは省けない。省くと問題になる）                |
| props・children を省く               | `props: {}`・`children: []`                                                                          |
| `spec.root`・`children` に要素を書く | 平らな `elements` に置き、キーでつなぐ（キーは `key`、なければ `<親のキー>_<位置>`。root は `root`） |
| データの部品の `"rows": "@flows"`    | `{ "$state": "/data/flows" }`                                                                        |
| 上の段の `data` を省く               | `data: {}`（データをすべて要素に書いたとき）                                                         |

- JSON Schema（1.8）も、この書き方を通す（省ける props は必須にしない。入れ子の要素も確かめる）
- 問題の場所は、直したあとのキーで返す（入れ子の要素は `spec.root_0.props...` のように）

## 2. 決まり

- 要素は `type` と、使う `props` だけを書けばよい（1.9）。値の要る props（Narrative の `markdown` など）は書く。すべて書く形（使わないものは `null`、子がなければ `children: []`）もそのまま通る。
- データの部品は行を自分で書けない。`{ "$state": "/data/<名前>" }` で `data` の宣言を指すだけ。数値・一覧を手で書くと検証で落ちる。
- 部品ごとに受け取れるデータが決まっている。
    - 行（rows）→ `DataTable`・`StatusSummary`
    - 行列（matrix）→ `Matrix`
    - 図・画面の部品は決まった provider だけ: `FlowDiagram` ← `flow.diagram`、`ObjectDiagram` ← `object.diagram`、`LwcWireframe` ← `lwc.wireframe`、`DiagramText` ← `dependency.graph`、`LayoutView` ← `layout.detail`、`FlexiPageView` ← `flexiPage.detail` など
- 人・AI が書く中身は、`Narrative` の markdown・見出し・`Alert` の文言と、どのデータをどの部品で見せるかの選択だけ。
- 既定は「今の状態のすべて」（1 時点。行に status はない）。`diff` か `compare` を書いたときだけ、行に status（added・removed・changed・unchanged）が付き、`DataTable` の `onlyChanged` で変わった行だけにできる。
- 差分だけを返す provider（`requiresComparison`。`permission.diffs`・`dependency.changes` など）は、`diff` か `compare` がないと使えない（文書でもデータでもよい）。
- `DataTable` の `columns` を `null` にすると、すべての列を出す（ファイルの列は初めは隠す）。表は 200 行ごとにページを分け、絞り込みの欄が付く。

## 3. 部品と provider

部品は 27 個。

| 分け     | 部品                                                                                                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 配置     | `Stack`・`Grid`・`Columns`・`Card`・`Tabs`・`Accordion`・`Separator`                                                                                                          |
| 文       | `Heading`・`Text`・`Badge`・`Alert`・`Narrative`・`PageLink`（ページへのリンク。ビルドが置く）                                                                                |
| データ   | `DataTable`・`StatusSummary`・`Matrix`                                                                                                                                        |
| 図・画面 | `CodeFlowchart`・`EventFlow`・`SequenceDiagram`・`FlowDiagram`・`ObjectDiagram`・`LwcWireframe`・`DiagramText`・`LayoutView`・`FlexiPageView`・`AutomationView`・`ImpactView` |

provider は 50 個（汎用の `metadata.*`、`object.*`、`apex.*`、`lwc.*`、`flow.*`、`permission.*`、`translation.*`、`crossRef.*`、`dependency.*`、`feature.scope` など）。引数と出力の形は [catalog/report-catalog.md](./catalog/report-catalog.md) を見る。

## 4. 文書から HTML を作る道

| 道                   | 使い方                                                                                                                | 対象                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| MCP（AI）            | プロンプト（雛形）→ `get_report_data` で材料を読む → 文書を書く → `validate_report_spec` → `build_report`             | 利用者のリポジトリ           |
| コマンドライン       | `sf-metascope report new <雛形>`・`validate <文書>`・`build <文書>`・`data <provider>`（README の「コマンドライン」） | 利用者のリポジトリ           |
| サンプルのスクリプト | `npx ttsx --noCheck docs/examples/report/scripts/run-report.ts specs/<名前>.json`（先に `npm run build:report`）      | **サンプルのリポジトリだけ** |

雛形は 15（ドキュメント 13・差分 2）。TypeScript の関数（[templates.ts](../src/report/templates.ts)・[domainTemplates.ts](../src/report/domainTemplates.ts)・[detailTemplates.ts](../src/report/detailTemplates.ts)）と、MCP のプロンプトの中にだけある。

雛形は個々のデータを引数に取らない（構成とデータの種類だけを決める）。`apex_specification`・`lwc_overview`・`object_definition`・`feature_overview` は、すべてのクラス・コンポーネント・オブジェクト（feature はカスタムオブジェクト）を for で広げ、1 件 1 ページにする。`impact_analysis` は起点を指定せず、保存した基準から変わった単位を起点にする。文章は `notes` に書く。キーは、クラス・トリガーは名前、メソッドは `<owner>.<name>(<引数の型>)`、コンポーネントは `c/<名前>`、LWC の関数は `<Owner>.<name>`、オブジェクトは API 名（どれも for の行の値から作る）。

- Apex: クラスごとに説明・メンバー、メソッドごとに左に処理フロー・右に説明（`Columns` 6:4）、下にデータアクセスと呼び出しのシーケンス図（行があるときだけ）。トリガーは本体の処理フローと呼び出し
- LWC: 置かれている Lightning ページ、コンポーネントごとに説明・画面の骨組み・イベントの流れ、関数ごとに処理フローと説明
- オブジェクト: 一覧と ER 図のあとに、オブジェクトごとに説明・項目・選択リスト値・入力規則・レコードタイプと選択リスト値・そのほかの定義（行のあるものだけ）

| 雛形                   | 中身                                             |
| ---------------------- | ------------------------------------------------ |
| `system_overview`      | システムの構成                                   |
| `object_definition`    | オブジェクト定義書                               |
| `apex_specification`   | Apex の仕様書                                    |
| `lwc_overview`         | LWC のコンポーネント一覧（ワイヤーフレーム付き） |
| `translation_overview` | 翻訳の状況                                       |
| `metadata_inventory`   | メタデータの棚卸し                               |
| `automation_overview`  | 自動化                                           |
| `security_overview`    | セキュリティと共有                               |
| `ui_overview`          | 画面                                             |
| `integration_overview` | 連携                                             |
| `analytics_overview`   | 分析                                             |
| `feature_overview`     | 機能のまとまり（起点から依存関係をたどった範囲） |
| `permission_overview`  | 権限の一覧                                       |
| `impact_analysis`      | 変更の影響の調査（差分）                         |
| `release_review`       | リリース前のレビュー（差分。`diff: true`）       |

## 5. 利用者が自分で書くときに困るところ

0 の手順 6 で直す候補。

1. ~~**長い**~~（2026-11-18 に省略と入れ子の書き方を足した。1.9。U13）: 表 1 つに `Card` と `DataTable` の 2 要素が要るのは変わらない（`Card` と表をまとめた部品は、要るかを見て決める）
2. ~~**平らな elements**~~（2026-11-18 に入れ子で書けるようにした。1.9。U13）
3. ~~**エディタの補完がない**~~（2026-11-18 に文書の JSON Schema のファイルを置いた。1.8。U12）
4. ~~**AI を使わずに自分のリポジトリで HTML を作る CLI がない**~~（2026-11-18 に CLI を足した。U11）
5. ~~**雛形をコピーして直せる JSON のファイルがない**~~（2026-11-18 に [catalog/templates/](./catalog/templates/) に置いた。U12）
6. **リポジトリごとの設定ファイルがない**: 保存先・スレッド数・既定の除外などの置き場（[todo.md](./todo.md) 3.3）。

直す計画は [todo.md](./todo.md) の 3.2（特に 3.2.1: 部品ごとのデータ・for / if・レイアウト・Apex と LWC の処理フロー）・3.2.2（文書の引数・部分の使い回し・文章の鮮度・ドキュメントのサイト）・3.6（読み手のための画面と書き出し）にある。
