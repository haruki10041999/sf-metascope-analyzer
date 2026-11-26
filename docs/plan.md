# 計画とやること

2026-11-24 に作成。このリポジトリの**方針・計画・やること（実装以外も含む）・決めること・未確認のこと**を、この 1 つの文書にまとめました。終わった作業の記録と、既存の実装の説明は入れていません（必要なら git の履歴にあります）。

- 終わった項目は、チェックを付けずに消します。この文書に、終わった作業の記録は残しません。
- 出典の元の文書は、統合したときに消しました。ただし、次の 14 ファイルはまだ統合していないので残しています（10 章の Todo の「文書」を参照）。
    - `docs/todo.md`、`docs/implementation-roadmap.md`、`docs/report-components-plan.md`、`docs/report-document-format.md`、`docs/lwc-snapshot-plan.md`
    - `docs/analysis-plan.md`、`docs/save-format-plan.md`、`docs/json-redesign-plan.md`、`docs/json-gaps.md`、`docs/commons.md`、`docs/ir.md`、`docs/ir-integration.md`、`docs/ir-types.md`、`docs/object-translation.md`
- 残したほかのもの: ルートの `README.md`（使い方）、`docs/catalog/`（`npm run catalog` が生成するもの）、`docs/examples/`（サンプル・スクリプト・ゴールデン）、`docs/reference/`（Apex の標準 API の調査の資料。`standardTypes.ts` の元）。

## 1. 目的

- **第一の目的はドキュメントの作成とコードの理解**です。差分（前回保存した時点、git の範囲）と影響の調査は、その補助です。
- レポートの形はこちらで固定せず、利用者が組み替えられるようにします。
- 今回のリファクタリングの目標は次の 5 つです。
    1. **JSON の型をそろえる**: すべての JSON の型を `JsonType` にし、`StructureJsonType` と、kind を持たない素のオブジェクトの型をなくす（4 章）。
    2. **走査を正確な型にする**: 新しい walker の書き方（kind ごとに型を絞る純粋な関数）を、Apex・LWC・メタデータの解析と Diff と依存関係に広げる（5 章）。
    3. **SQLite を使い切る**: 全単位をメモリに組み立てて JS で走査する形から、SQL で必要なノード・定義・参照だけを引く形に移す（6 章）。
    4. **解析の手法を足す**（7 章）。
    5. **コンポーネントを足す**: 解析の結果を見せる provider・部品・雛形をそろえる（8 章）。

## 2. 方針（守る決まり）

### 2.1 解析全般

- 解析は Diff に依存させず、1 時点の JSON だけを入力にする。Diff と組み合わせる処理は別に置く。
- 解析の結果には、元のノードの `sourceKeys` を必ず持たせる。位置は後から引く。
- 「呼び出しが増えた」のような意味の差分は Diff に入れず、2 時点の解析の結果を比べて出す（Apex も LWC も）。
- 派生の情報（呼び出し・DML・クエリ・トリガーの文脈・LWC の calls / events / references）は JSON に持たず、走査で出す。名前は `*Info` で、`kind` を持たず、`sourceKeys` と `context` を持つ。
- 解析の順はコードの理解に効く順にする: 概要 → データアクセス → 呼び出しグラフ → findings。
- findings は優先度を下げる。ルールは TypeScript で書き、ID（`soql-in-loop` など）・重さ・説明を持たせる。PMD と重なる、1 ファイルで閉じるルールは最小限にし、メタデータとまたがるルールに絞る。PMD の結果の取り込みは、要るときに足す。
- `unknown` は外部入力の境界（検証の前の入力、`catch`、型ガードの入力）で使ってよい。それ以外の `unknown` は、型を付けられるなら付ける。

### 2.2 walker・依存関係の解析

- walker は宣言・参照・式・位置・スコープを集める。依存先の照合と種類の決定は「依存先の解決」が受け持つ（どこまで同じフォルダに置くかは 9 章で決める）。
- 型や候補を特定できなければ、推測で確定しない。参照を残し、`unknown` にする。解決の範囲は「試みる範囲」で、一意に決まることを保証しない。
- すべての呼び出し・参照は、必ず「解決済み・候補・`unknown`」のどれかとして残す。名前の取り出しが失敗しても、無効な Apex や「依存なし」として扱わず、元の式と位置を残す。
- `missing` は、リポジトリの中の情報で欠けていることを確かめられたときだけ使う。候補だけの参照を、確定した依存に見せない。
- 引数は文字列にせず、式の JSON のまま持つ。`path` は補助の情報で、呼び出し元の式の代わりにしない。
- 標準 API は型・クラスの単位まで照合する。確認していない名前を、名前だけで「標準」と断定しない。一覧にない名前を「標準に存在しない」と判定しない。
- 動的クエリを復元して作った仮の JSON の `sourceKeys` は、元の Apex の位置として扱わない。元の呼び出しの位置と文字列の由来を別に持つ。
- 参照の重複は、参照先・種類・via・位置が同じものだけを 1 つにする。via が違えば（SELECT と ORDER BY など）別の参照として残す。
- 作り直し中の walker は `processor/Apex/semantic/`（宣言・参照・名前解決・値の流れを扱う場所。公開 API は `index.ts`）に置く。既存の `Apex/walker.ts` とは別物として扱う。
- 宣言の ID は宣言のノードの `sourceKey`。フィールド・ローカル変数は変数（`variant`）ごと、getter・setter はそれぞれの `accessor`、for-each・catch・when の変数はその節のノードのものを使う。照合は小文字の `nameKey`、表示は書いたままの `name`。`path` の先頭はクラス名・トリガー名・匿名 Apex の単位名（`semantic/declaration.ts`）。
- トリガー・匿名 Apex の直下の変数の宣言（`Integer n = 1;`）は、パーサーでは `field` のノードになる。宣言の一覧ではローカル変数（見える範囲は単位全体）とし、実行本体の文の並びには書いた順のまま `field` のノードで入れる（`ApexBodyStatementJson`）。
- SOQL・SOSL の項目は、書いた名前の並びと読む対象のオブジェクトで持つ（先頭のオブジェクト名・別名は外す）。関数の中の項目は関数名を付けて項目として残し、使った関数の名前は事実に別に持つ。サブクエリは別のクエリにし、親の ID と役割（子リレーション・準結合）を持つ。関係のパスの先は、スキーマを引く参照の解決で決める（`semantic/query.ts`）。
- 標準の名前は、名前の並びの先頭から最も長く一致する型に当てる（`Database.Batchable` は Database 名前空間の型、`Database.query` の `Database` は `System.Database`）。名前空間を書かない名前は、単位の中の宣言・リポジトリの定義を先に探し、次に System の型、次に SObject（標準オブジェクトの一覧かカスタムの接尾辞）とする。一覧にない名前は `unknown` にする（`semantic/standardNames.ts`）。
- Salesforce の公式情報の一覧（Apex の標準型・標準オブジェクト・メタデータの種類・LWC の基本コンポーネントなど）は、リリースのたびに `.claude/skills/salesforce-release-update` のスキルで公式資料（PDF）と照合して直し、`docs/reference/release-updates/` にレポートを残す。
- `dependency/apex.ts` は新しい解析（`analyzeApexUnit` → `apexSemanticDependenciesOf`）の結果を返す。依存関係に入れるのは `resolved`・`standard`・`byName` の参照だけ。以前の抽出は `dependency/apexLegacy.ts` に移し、比較のテストだけが使う（P5 で消す）。
- 名前を文字列などで渡す参照（`Label.X`・`Page.X`・`PageReference`・`Flow.Interview.X`・カスタム設定・`FeatureManagement`・`Type.forName`・`'callout:X'`・`EventBus.publish`・`Schema.SObjectType`・SOQL の `StaticResource` など）は `semantic/namedReferences.ts` が受け持つ。受け持った呼び出し・メンバーは一般の参照にしない。
- 項目の初期化式は、クラスごとの本体 `fieldInitializer`（ID はクラスの宣言の ID）の文として解析する。
- 単位の呼び出し・DML・クエリ・トリガーの文脈（report の `apex.dataAccess`・`apex.callFlow`・`apex.methodFlow` が使う）は `semantic/facts.ts` の `apexUnitFactsOf` が解析の結果から作る。呼び出しの種類（DML・動的なクエリ・非同期・EventBus・Http の send・assert・debug）は、レシーバーの型を標準の型に照合した結果（完全修飾名の最後の名前とメソッド名）で決める。文脈は member・ループの中か・テストの中か・いちばん内側の文。member の名前の決まりは `semantic/members.ts` を依存関係と共通に使う。
- 参照の解決の状態（`resolved`・`standard`・`byName`・`candidates`・`unknown`）は Apex・LWC・メタデータで共通の語（`dependency/types.ts` の `ReferenceResolution`）。依存関係の参照（`UnitReference`）は確かさ（`resolution`）を持ち、持たなければ `byName`（LWC・メタデータの参照は今はすべてこれ）。`unknown` は依存関係に入れない。`candidates`（決まらないオーバーロード・インターフェースの実装クラスなど）は依存関係に残すが、グラフの確定した辺・被依存・指摘にはせず `DependencyGraph.candidateEdges` に持つ（使われているかの判定で「使われうる」に使う）。`reference` 表にも `resolution` の列を持つ。
- Salesforce の公式情報の一覧は、系統ごとに標準のファイルにまとめる: Apex の標準型 `processor/Apex/semantic/standardTypes.ts`、標準オブジェクト `processor/commons/standardObjects.ts`、メタデータの種類 `processor/Metadata/standardTypes.ts`、LWC の capability・target・Lightning ページの種類 `types/lwc/standardTargets.ts`・基本コンポーネント `types/lwc/standardComponents.ts`（照合済みの名前と属性は生成の `standardComponentAttributes.ts`）・モジュール `types/lwc/standardModules.ts`、SLDS のアイコン名 `types/lwc/standardSldsIcons.ts`（生成）、Apex のプラットフォームが呼ぶインターフェースのメソッド `processor/Apex/semantic/standardInterfaces.ts`、カスタムのオブジェクトの接尾辞 `CUSTOM_OBJECT_SUFFIXES`（`standardObjects.ts`）（LWC はパーサーの検証でも使うので型の層に置く）。PDF のない LWC の基本コンポーネント・`lightning/*` は LWC の言語サーバー（`@salesforce/lwc-language-server`）の JSON、SLDS は `@salesforce-ux/design-system` の JSON（どちらも Salesforce が公開している npm のパッケージ）で照合し、件数の多いもの（属性・アイコン名）はスキルのスクリプトが作る。どれも照合した資料の API バージョンの定数を持ち、公式資料で照合できないもの（LWC の未照合の target・基本コンポーネント・モジュール）は `verified: false` か「未照合」と書く。リリースのたびに `.claude/skills/salesforce-release-update` で照合する。
- 標準オブジェクトの一覧とカスタムの名前の判定（`isCustomObjectName`）は `processor/commons/standardObjects.ts` の 1 か所にし、Apex・LWC・メタデータの解析とグラフで共通に使う（以前は LWC・メタデータが別の接尾辞の一覧を持っていた）。
- 単位をまたぐ解決（ほかのクラスの型・親クラス・メソッドの戻り値）は、リポジトリのクラスの宣言の索引（`semantic/repository.ts`。ID は `<単位名>#<sourceKey>`）を型の解決に渡して行う。ほかの単位の型は完全な名前（`Repo`・`Repo.Wrapper`）でだけ当て、内部クラスの短い名前では当てない。保存する定義・参照（`derived`・`symbol`・`reference`）は単位の中だけで決め、単位をまたげば解決できるかもしれない参照の数（`pendingResolution`）を持たせる。グラフを作るときに、それが 1 以上の Apex の単位だけを索引を渡して解析し直す（結果はほかの単位に依存するので保存しない）。
- Apex の処理フローの文の分類（クエリ・DML・イベント・外部の呼び出し）は、文の文字のパターンでなく、文の中の事実（`facts.ts` の文脈の文）で決める。`new Http()` や `'callout:X'` の文字だけの文は、外部の呼び出しにしない（呼び出しは `send`）。
- SOQL・SOSL の中の参照（オブジェクト・項目・子リレーション）の位置（`from.expression`）は、いちばん外のクエリの位置にする（以前の抽出と同じ。`apex.dataAccess` がクエリごとに項目をまとめる）。項目ごとの位置は `semantic/query.ts` の結果が持つ。
- 式の型は `ApexTypeRef` にそろえる。`Foo[]`・`List<Foo>`・`System.List<Foo>` は同じ list の形、`Schema.Account` と `Account` は書いたまま区別する。同じ単位の中の型に当たれば宣言の ID を持つ。標準 API は、型の構造で決まるコレクションのメソッド（`get`・`values`・`keySet` など）だけを表で持ち、ほかは理由つきの `unknown` にする（`semantic/type.ts`）。

### 2.3 JSON・Diff・版

- すべての JSON の型は `JsonType<'kind'>` で始める（4 章）。新しく型を足すときも、この決まりに従う。
- JSON の木にエラーのノードは作らず、`resolvedError` だけに出す。エラーの Diff の型も作らない。
- 数のリテラルは、精度のため文字列のまま持つ。式の型に `text`（ソースの文字列）は足さない。
- アノテーション名の大小は、解析で無視する（JSON は書いたまま）。
- `objectKey` は位置を除いた内容の hash で、同じなら子孫まで同じ（Diff は中に入らない）。`sourceKey` は内容か位置で変わる。
- ソースは LF にそろえてから読む（CRLF と LF で `sourceKey` が変わらないように）。
- Apex の `sourceKey` にはファイルのパスを含めない（1 単位 1 ソースのため）。LWC の `sourceKey` にはファイルのパスを含める（バンドルの中の別のファイルの同じ位置と分けるため）。
- 型付きの Diff は、kind ごとに書いた型と共通の部品で作り、GumTree は対応付けに使う。親をまたぐ移動は、移動先に `status: 'moved'` と `from` を持たせる。
- 再帰する Diff の型は、型の深さの上限を避けるため `interface` で切る。
- `-meta.xml` の `status`（Active・Inactive）は、差分の `status` と名前がぶつかる。差分の木をたどるときは、`status` が差分の語彙のときだけ差分のノードとみなす。
- 1 単位 = 1 解析結果 = SQLite の 1 単位。parse の入口はファイルシステムに触らない。
- JSON の形を変えたら、系統ごとの `UNIT_FORMAT_VERSIONS` を上げ、コメントに何を変えたかを書く。同じリリースに入る変更は、まとめて 1 回上げてよい。
- 1 段階ごとに、ゴールデン・Diff・依存関係のテストが通る状態にする。
- ゴールデンは `npx ttsx --noCheck test/ir/make-golden.ts` で作り直す。違いが意図したものだけであることを確かめてから入れる。大きな置き換えは「足したもの」と「変わっていないもの」を分けて確かめる。
- JSON の大きさに上限は決めない。形を変える段階ごとに `sourceObject` の数を測って記録する。

### 2.4 メタデータ

- 新しく足した要素は、要素があるときだけ持つ（保存済みの objectKey を変えないため）。値・子・空のリストがなければ、プロパティごと持たない。
- プロパティ名は XML の要素名と同じにし、真偽値・数値は `boolean`・`number` にする。
- 種類を増やすときは、型と作る関数を足し、表（`OBJECT_MEMBERS`・`MetadataFolderSpec`・`RecordSpec`）に 1 行足す。種類ごとの違いは設定だけで表す。新しく足す種類は `RecordSpec` にそろえる。
- 読み込みはフォルダ単位、結果と保存はファイル単位（Aura はバンドル単位）。表にない要素は `skippedElements` に名前を残す。
- 種類の一覧の型を、種類ごとの型の共用体にしない（TS2590 になるため）。
- 読めない子のファイルは JSON に入れず、`resolvedError` に出す。`object-meta.xml` が読めなければ、単位全体を `dataType: 'error'` にする。
- 位置だけの変化は `unchanged`。両方にない値は差分に出さない。並び順に意味があるものは、順序付きの列として比べる。
- 読めない数式・`booleanFilter`・差し込みは文字列のまま持ち、`resolvedError` に `FORMULA_SYNTAX`・`FILTER_LOGIC_SYNTAX` を出す。
- 走査では、数式のノード（`fx*`）を文脈（メンバー・直前の境界ノード）にしない。
- マークアップで使っている部品・差し込みの一覧は JSON に持たず、解析で木から出す。
- 対象オブジェクトの名前は JSON（XML のまま）を変えず、解析で 1 つにする。
- Flow は画面上の位置と Flow Builder の設定を読まない。Layout・FlexiPage は、平らな並びに位置を持たせる。
- 値の木を型にするのは、参照・解析に使うところだけ。settings は値の木のまま。
- 選択リスト値は、ドキュメントでは定義の順に出す。差分では、項目に「並び順が変わった」の印を 1 つ付ける。
- 参照先がリポジトリにあるか（`UNKNOWN_OBJECT`・`UNKNOWN_FIELD`・`UNKNOWN_LWC` など）は、依存関係のグラフの指摘（`graph.ts` の `referenceFindingsOf`。参照している単位 + 行の sourceKeys）だけで見る。種類ごとの解析（権限・Flow・レイアウト・Lightning ページ）は、その種類の中の決まり（`APEX_NOT_INVOCABLE`・`LWC_NOT_FLOW_SCREEN`・`UNKNOWN_FLOW_ELEMENT`・LWC の公開と target とプロパティ・必須項目とレイアウト・権限の矛盾など）だけを出す。参照の取り出しは `Metadata/refs.ts` の 1 か所（Lightning ページの表示条件の項目もここ）。グラフは、参照先の種類の単位がリポジトリにあるときだけ「ない」と言う。
- パッケージディレクトリの重なり（同じ種類・同じ id の単位が 2 つ以上の場所にある）は、`Repository` を作るときに 1 つに決める。`sfdx-project.json` の `packageDirectories` に先に書いたパッケージディレクトリのもの（同じなら場所の名前の順で先のもの）を解析に使い、ほかは `Repository.overlaps` に残して `metadata.findings` に `DUPLICATE_UNIT`（source: repository）を出す。黙って片方を捨てない。
- 優先度の基準: 高 = 今の誤り・漏れを直すもの、または依存・Diff の精度に直結するもの。中 = 新しい解析ができるもの。低 = 完全さのため。

### 2.5 LWC

- 基本コンポーネント（`lightning-*`）の属性とアイコン名は、公式の一覧（`standardComponentAttributes.ts`・`standardSldsIcons.ts`）で確かめる。属性は照合済みのコンポーネントだけで、HTML の全体の属性・`aria-*`・`data-*`・`on*`・`slot`・`key`・ディレクティブは見ない（`UNKNOWN_LIGHTNING_ATTRIBUTE`）。アイコンは静的な値で種類が SLDS のものだけ（`UNKNOWN_SLDS_ICON`）。どちらも一覧の版が古いと新しいものを誤検出しうるので warning にし、指摘の文に照合した版を書く。
- JS / TS は Babel で読む。TypeScript Compiler API は使わず、型の推論はしない（型注釈だけを使う）。型の推論が必要になったら、TypeScript Compiler API（5 系）を足す。
- HTML・CSS は中間表現を作らず、parse5・postcss の木から直接 JSON にする。
- コメント（JSDoc・HTML・CSS）は JSON に入れない。
- 1 バンドル = 1 解析結果 = 保存の 1 単位。バンドル全体を `dataType: 'error'` にするのは、フォルダが読めないときと、メインのモジュールがないときだけ。
- 同じ名前の `.ts` と `.js` があれば `.ts` を読む。読まなかったファイルは、理由つきで `skippedFiles` に残す。
- TS・Flow は、型の部分を空白に置き換えてから `@lwc/compiler` で検証する。`ts.transpileModule` はデコレーターを書き換えるので使わない。空白にできない構文は `TS_UNSUPPORTED` にして検証しない。
- 構文エラーのあるファイルでは、IR のエラーと LWC の検証を出さない（構文エラーだけを出す）。
- template-compiler の設定: `enableDynamicComponents`・`enableLwcOn` は true、`apiVersion` は js-meta.xml の値を渡す、parse5 の `onParseError` は使わない。
- 非推奨の書き方（`if:true` など）は、エラーにも警告にもしない。
- バンドルの中の突き合わせはすべて `warning`。`LightningElement` 以外を継承している、または未知の mixin を使うときは、メンバーを確かめない。
- バンドルをまたぐ解析の結果は `resolvedError` にしない（ほかのバンドルの変更で結果が変わるため）。
- HTML の標準のプロパティを「子の `@api` にない」と指摘しない。標準オブジェクト・標準項目は確かめず、カスタムのものだけを確かめる。
- JS の文・式の kind は `js*`、テンプレートは `lwc*`。式はソースの文字列を持たず、構造で表す。名前・import 元・文字列のリテラルの値だけは文字列のまま持つ。
- 文は Apex と同じくすべて JSON にし、Apex と同じ考え方の文は、プロパティ名も Apex に合わせる。
- Flow の型も `LwcTypeJson` で表す。JSX は対象外（`jsUnsupported` で残すだけ）。
- コンポーネント以外のクラスとユーティリティのモジュールも対象にする。
- 初期値がそのまま関数のフィールドは、`function` だけで表す（初期値の式と重ねて持たない）。
- `processor/Lwc/calls.ts`・`walker.ts` は types だけに依存させる（parser から使っても循環しないように）。
- import の参照の解析は識別子だけを見て、型の中には入らない。
- 入れ子の関数（コールバック）の境界では、ループ・ネスト・try の文脈を 0 に戻す。
- 本体の外の式（初期値・呼び出しの引数など）は値として比べる（位置だけの変化は unchanged）。
- static ブロックは LWC のコンパイラが受け付けないので、サンプルに入れず、テストで確かめる。

### 2.6 IR

- エラーのノードは作らない。子を作れないと `IrBuildError` を投げる。省略できる子は `null`、配列の要素は除いて `IrError` を集める。
- 合う pair がない子は `UNSUPPORTED_CONTEXT` にする。

### 2.7 標準 API の資料（`docs/reference/`）

- 基準は公開されている公式の資料で、特定の組織には接続しない。
- 過去の版の資料に記載がないだけで、「その版で使えない」と断定しない。
- この資料だけで実装の方針は変えない。

### 2.8 実装の登録先

- provider を足すときは `src/analyzer/report/registry.ts` と `schemas.ts` に登録する。
- viewer の部品を足すときは `src/report/catalog.ts` と `src/viewer/report/registry.tsx` に登録する。
- どの provider も、今の決まりに合わせる: 1 時点が既定、`diff` / `compare` のときだけ行に `status`、出力のスキーマ、絞り込みの引数とそのテスト。

## 3. 進め方（段階）

| 段階   | 内容                                                                                                        | 終わりの条件                                                                                                    |
| ------ | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **P0** | 土台を戻す: walker の構文エラーを直し、型検査とテストを通す。時間とメモリの基準を取る（NPSP、3 回の中央値） | `npm run typecheck`・`npm test` が通る。基準の数字を 12 章に書く                                                |
| **P1** | JSON の型を `JsonType` にそろえる（4 章）                                                                   | `src/analyzer/types` に `StructureJsonType` と、kind のない素のオブジェクトがない。型のテストで強制する         |
| **P2** | 型の正確な走査の土台を作る（5 章）                                                                          | Apex・LWC・メタデータで、kind から型を引く表と、共通の走査関数がある。古い walker の利用を移した                |
| **P3** | SQLite を使い切る（6 章）                                                                                   | 定義・参照・シンボルが表になる。被依存と名前の解決が SQL で引ける。全単位をメモリに組み立てずに provider が動く |
| **P4** | 解析の手法と、それを見せるコンポーネントを足す（7 章・8 章）                                                | 7 章・8 章の表の「段 1」が終わる                                                                                |
| **P5** | 古い処理を消す（`Apex/walker.ts`、`calls.ts` の重なり、`snapshotInputOf`、`WeakMap` のキャッシュ）          | 古い入口が import されていない                                                                                  |

P1 と P2 は、単位の系統ごと（SOQL → Apex → LWC → メタデータ）に交互に進めてかまいません。P3 は P1 の後なら、P2 と並行して進められます。

## 4. P1: JSON の型を `JsonType` にそろえる

### 4.1 理由

- kind を持たない素のオブジェクト（約 57 型）は、保存のときにノードの行にならず、親の行の中身に埋もれます。そのため `find_nodes` で探せず、位置も持たず、Diff（GumTree）でも 1 つの塊として比べられます（SOQL の `WHERE`、`if` の条件など）。
- `StructureJsonType`（Apex 7、LWC 7）は、名前の位置を持つためだけに `sourceKeys` の形が `{ base, name }` に分かれていて、保存・Diff・走査のすべてで特別な扱いが要ります。
- 対象の型の数（数え方は `export type ...Json` の宣言。資料によって数え方が違うので、作業の前にこの基準でそろえて数え直す）:

| 系統               | `JsonType` | `StructureJsonType` | 共用体 | kind のない素のオブジェクト |
| ------------------ | ---------- | ------------------- | ------ | --------------------------- |
| Apex               | 42         | 7                   | 7      | 16                          |
| Apex の SOQL・SOSL | 15         | 0                   | 5      | 15                          |
| LWC                | 59         | 7                   | 6      | 18                          |
| メタデータ         | 87         | 0                   | 4      | 8                           |

### 4.2 決まり

- **すべての JSON の型は `JsonType<'kind'>` で始める**。`sourceKeys` は `ConvertKeys`（`objectKey`・`sourceKey`）の 1 つだけにする。
- **名前などの位置は、子のノードで持つ**（2026-11-24 に決めた）。`StructureJsonType` の `sourceKeys.name` はやめ、名前の位置は子のノード `nameRef`（kind `declarationName`、`{ name: string }`）に持たせる。**文字列の `name` は宣言にも残す**（`name` を読んでいる処理を書き換えずに済むため）。名前の位置のノードの `objectKey` は中身から作る（名前の IR の `objectKey` は名前の文字列だけから作られ、式の識別子と同じキーになるため）。
- **ソースに対応する IR のノードがないもの**（DISTANCE の引数、FORMULA の左辺、FIND の検索語、修飾子の一覧、配列の要素の型、型の `when` の変数、単位の根など）は、`makeDerivedNodeJson`（`types/apex/commons/node.ts`）で作る。`sourceKey` はいちばん近い IR のノードのもの（位置はそのノードの位置）。`objectKey` は**そのノード自身の中身**から作る（`<kind>_<hash>`。子のノードは子の `objectKey` に置きかえ、位置は除く）。借りたノードの `objectKey` から作ると、修飾子の一覧のように、持ち主（メソッド）の本体が変わっただけで一覧も「変わった」になってしまうため。中身が同じなら別の場所でも同じ `objectKey` になるので、位置の一覧（`sourceObject`）には、借りた元のノードごとに別の一覧として載せる（`regenerateSourceObjects`）。位置を引くときは、`objectKey` と `sourceKey` の組で探す（`findNodeSourceInfo`・`findSpanSourceInfo`）。
- **ほかのノードの中に展開（`...`）して使う型は、中身だけの型（`*Body`。kind を持たない）とノードの型に分ける**。例: `FieldBody` は `selectEntry`・`orderField` のノードに展開し、条件の左辺などに単独で置くときは `FieldJson`（`soqlField`）にする。展開したまま `kind` を持たせると、親の `kind` を上書きしてしまうため。Diff の関数は、中身だけの型で受ける（ノードも渡せる）。
- **GumTree の順序なしの並びは、ノードの kind とプロパティのラベルで指定する**（`soqlSelect.field`、`soqlLogical.condition` など。`processor/Apex/diff/gumtree/tree.ts`）。入れ物をノードにしたら、ラベルも直す。
- **ファイルの根は、ファイルの先頭（長さ 0）の位置を持つ**（LWC のモジュール `lwcModule`。`LwcJsonContext.fileRootJson`）。ファイル全体の位置にすると、ファイル全体のソースを位置の一覧に持ってしまうため。ファイルの入れ物とバンドルの根は、中の根の位置を借りる。
- **形を比べるテストは、P1 で足したノードの `kind`・`nameRef`・位置を除いて比べる**（`test/converter/lwcShape.ts`）。ノードになったかどうかは網羅のテストが確かめるので、形のテストは構造だけを確かめる。
- **値の木と、名前 → 値の辞書は、`kind` を持たない値として残す**（2026-11-24 に決めた）。値の木（`types/commons/valueTree.ts`。`RecordSpec` の `trees`、Flow の `properties`・値、`settings`）は種類ごとに形を決めない汎用の表現で、子の要素ごとにノードにしない。辞書（`Record<string, string>`。Visualforce・Aura・FlexiPage の属性）はキーが XML の要素名ではなくデータなので、値として扱う。網羅のテスト（`json-node-coverage.json`）は、この 2 つを `valueTrees`・`dictionaries` の一覧に固定し、それ以外の `kind` のないオブジェクトを 0 にしたまま保つ。値の木の中で、参照・解析に使う大事な要素は、これまでどおり `kind` を付けたノードにする（`makeKindedTree`）。
- **共用体は、要素がすべて `JsonType` ならそのままでよい**。
- LWC の「位置だけ（`sourceKeys` あり・`kind` なし）」「キーなし」のノードの区分と、`LwcModuleJson` を境界ノードにしない扱いは、この決まりで上書きする。
- 強制のしかた: 型の上では `AssertJsonType<T extends JsonType<string>>` に各系統のノードの一覧を通す。実行時には、`test/converter/json-node-coverage.test.ts` がサンプルの全単位をたどり、`kind` を持たないオブジェクトの場所（`単位の種類: 親の kind.プロパティ`）を `json-node-coverage.json` の「残り」と比べる。新しい場所が出たら失敗、変換して消えた場所が一覧に残っていても失敗。一覧を書き直すときは `UPDATE_JSON_NODE_COVERAGE=1` を付けて実行する。P1 の終わりに一覧を空にする。同じテストで「同じ `objectKey` のノードは、位置を除いた中身も同じ」ことも確かめる（Apex）。IR のノードのキーを、そのノードが中身全体を含まない JSON に使うと、この前提が崩れる（例: `if` の条件のキーを節全体に使う、`new X[]` の `X` のキーを配列の型に使う）。そのときは `makeDerivedNodeJson` で中身からキーを作る。

### 4.3 順番と影響

| 順  | 対象                                                                                                                                                             | 主な書き換え先                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **済み（apex 7、2026-11-24）** SOQL・SOSL の 15 型と、値・WITH・FIND など kind のない部品のすべて（19 種類の kind `soql*`・`sosl*`）                             | `types/apex/query`、`processor/Apex/diff/query`、`calls.ts`                                                                                  |
| 2   | **済み（apex 8、2026-11-24）** Apex の文・式の素のオブジェクト（`IfConditionBlockJson`・`SwitchWhenJson`・`ForConditionJson`・`ModifiersJson` ほか）と入れ子の型 | `types/apex`、`processor/Apex/diff`、`report/codeFlow.ts`・`apexFlow.ts`                                                                     |
| 3   | **済み（apex 9、2026-11-24）** Apex の `StructureJsonType` 7 種類と単位の根                                                                                      | `types/apex/declaration.ts`・`unit.ts`、`processor/Apex/interface.ts`・`commons.ts`、walker                                                  |
| 4   | **済み（lwc 4、2026-11-24）** LWC の 18 型と `StructureJsonType` 8 種類（`lwcTypeDeclaration` を含む）                                                           | `types/lwc`、`processor/Lwc`（`diff/body.ts`・`diff/gumtree/tree.ts` の `valueLabel`・`isBlockRole` を含む）、`report/lwc*.ts`               |
| 5   | **済み（object 7・objectTranslation 2・metadata 8、2026-11-24）** メタデータの型のある部品（`ValueSetJson` など）。値の木と辞書は残す                            | `types/metadata`、`processor/Metadata/diff`                                                                                                  |
| 6   | **済み（保存の版 11、2026-11-24）** `StructureJsonType`・`isStructureJsonType`・node 表の `structure_keys` 列を消す                                              | `types/commons/json.ts`、`processor/commons/diff`（gumtree）、`commons/source.ts`、`unit/storeTree.ts`・`storeSqlite.ts`、`mcp/nodeTools.ts` |

- 系統ごとに `UNIT_FORMAT_VERSIONS` を上げ、ゴールデンを作り直す。最後の 6 で node 表の形が変わるので、`SAVE_FORMAT_VERSION` も上げる。
- `objectKey`・`sourceKey` の値が変わると、保存した基準（`save_baseline`）との比較ができなくなる。版を上げたときに作り直す、今までの決まりのとおり。
- ノードが増えるので、Diff の対応付けは細かくなる（`WHERE` の中の 1 つの条件だけが変わった、などが分かる）。ノードの数・`sourceObject` の数・Diff の時間を、P0 の基準と比べる。

## 5. P2: 型の正確な走査の土台

### 5.1 作るもの

| 部品             | 内容                                                                                                                                                                       | 場所（案）                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| ノードの一覧の型 | 系統ごとの、すべての `JsonType` の共用体（`ApexNodeJson`・`LwcNodeJson`・`MetadataNodeJson`）と、kind から型を引く表（`ApexNodeOf<K>`）。メタデータは TS2590 に注意（2.4） | `types/apex/node.ts` など              |
| 子の列挙         | `childNodesOf(node)`。P1 ですべての子がノードになるので、配列と値の木だけを特別に扱えばよい                                                                                | `processor/commons/node.ts`            |
| 走査             | `walkJson(node, { enter?, leave? })`。kind ごとのハンドラーの表で型を絞り、親の連鎖と文脈（ループの中・try・テスト）を `ctx` に持つ                                        | 同上                                   |
| 宣言・シンボル   | 宣言（クラス・メソッド・引数・ローカル変数・アクセサー）を、`sourceKey` を ID にして列挙する                                                                               | 新しい walker の `declaration.ts`      |
| 参照             | 型、呼び出し、メンバーの読み書き、SOQL・DML を、レシーバーの式と位置つきで出す                                                                                             | 新しい walker の `call.ts`・`query.ts` |
| 変換             | 確定した参照を今の `UnitDependencies` に変換する（依存関係のグラフは当面そのまま）                                                                                         | 新しい walker の `dependencies.ts`     |

### 5.2 呼び出しの解決の範囲

次の経路で解決を試みる。確認の例は `hoge.fuga(tmp()).aaa()`（`fuga`・`tmp`・`aaa` をそれぞれ別の呼び出しとして扱い、`aaa` は `fuga` の戻り値の型が分かるときだけ解決する）と、`service.fetch().save()`。

1. 同じクラス・`this`・型の分かる変数
2. 親クラス・`super` の経由
3. 項目・プロパティの経由（`this.service.run()`）
4. ユーザー定義メソッドの戻り値によるチェーン
5. 配列・`List`・`Map` の要素の経由（`Map` は値の型）
6. 引数によるオーバーロードの候補の絞り込み

標準メソッドの戻り値を通るチェーンは、標準 API をメソッドの単位で照合しない（2.2）ので、解決できないことがある。そのときは `unknown` の理由にその旨を入れる（例外を作るかは 9 章で決める）。

### 5.3 移し方

1. 新しい walker を `processor/Apex/semantic/` に置く（済み。`'../Apex/walker'` という import が、`walker.ts` を消したときに黙って `walker/index.ts` に向き先を変えないため）。
2. （済み、2026-11-25）`dependency/apex.ts` の参照の取り出しを、新しい walker の出力に移す。今ある個別の参照の処理（10 章の Todo の一覧）を落とさないことと、依存関係のゴールデンとの差が意図したものだけであることを確かめる。
3. （済み、2026-11-25）`calls.ts` の呼び出しの解析を移し、処理フローの分類を、文の文字のパターンでなく解析の結果で決める。
4. （走査は済み、2026-11-25。LWC の言語側の情報の組み立ては残り）Apex で形が固まったら、LWC とメタデータを同じ `walkJson`・`childNodesOf` に寄せる。LWC はモジュール・クロージャー・非同期・テンプレートとイベントの結び付きに合わせて、言語側の情報を組み立てる。両方で共通に使えると分かったグラフの探索・状態の伝播から共通にする。

## 6. P3: SQLite を使い切る

### 6.1 理由

- 今は、読むときに `readParsed` が単位のすべてのノードを木に組み立て直し（ノードごとに `JSON.parse`）、`Repository` が全単位の木をメモリに持っています。provider と依存関係は、その木を JS で走査しています。
- SQL で検索しているのは `find_nodes` と `list_node_kinds` だけです。
- 定義・参照は deflate した BLOB で保存しているので、中を SQL で引けません。被依存を求めるには、全単位の BLOB を展開してメモリでグラフを作る必要があります（NPSP で `crossRef.labels` の 1 回目が 1.4 秒）。
- 重いのは「起動のときに全単位の木を組み立ててメモリに持つこと」と「単位をまたぐ検索をメモリのグラフでやること」です。1 つの実行本体の中の CFG やデータフローは、どのみち本体の部分木をすべて読むので、メモリで行うのが速いです。そこで、**どの単位・どの本体を見るかは SQL で選び、選んだ本体の中はメモリで走査する**形にします。本当に重いかは P0 で計測してから決めます。

### 6.2 足す表

```sql
-- 宣言 (シンボル表)。単位をまたぐ名前の解決に使う
CREATE TABLE symbol (
    unit_id INTEGER NOT NULL,
    node_id INTEGER NOT NULL,          -- 宣言のノード
    kind TEXT NOT NULL,                -- class / method / field / property / lwcComponent / customField ...
    owner TEXT,                        -- 所有する型 (Outer.Inner)
    name TEXT NOT NULL,                -- 書いたままの名前
    name_lc TEXT NOT NULL,             -- 照合用 (小文字)
    type TEXT,                         -- 宣言の型 (戻り値・項目の型)
    signature TEXT,                    -- 引数の型の並び (オーバーロードの区別。Outer.Inner.method(型) の形)
    PRIMARY KEY (unit_id, node_id)
) STRICT, WITHOUT ROWID;
CREATE INDEX symbol_name ON symbol (name_lc, kind);

-- 参照 (今の derived の BLOB を表にしたもの)
CREATE TABLE reference (
    unit_id INTEGER NOT NULL,
    node_id INTEGER NOT NULL,          -- 参照している場所のノード
    seq INTEGER NOT NULL,
    target_type TEXT NOT NULL,         -- apexClass / customField / customLabel ...
    target_lc TEXT NOT NULL,           -- 照合用の参照先の名前
    via TEXT NOT NULL,                 -- soql.select / dml.insert / call / type ...
    access TEXT,                       -- read / write
    resolution TEXT NOT NULL,          -- resolved / candidate / unknown / missing
    PRIMARY KEY (unit_id, node_id, seq)
) STRICT, WITHOUT ROWID;
CREATE INDEX reference_target ON reference (target_type, target_lc);

CREATE INDEX node_unit_kind ON node (kind, unit_id);   -- 今の node_kind を置き換える
CREATE INDEX node_parent ON node (unit_id, parent_id);
```

- `DERIVED_VERSION` を上げて、定義・参照を表に書き直す。
- 被依存は `reference_target` の索引で引き、推移的な影響は再帰 CTE で求める。メモリのグラフは、循環（SCC）やデプロイの順序のような、全体を見る計算だけに残す。
- メトリクスの結果は `metric(unit_id, node_id, name, value)` に保存し、provider が SQL で集計できるようにする。

### 6.3 読み込みを遅らせる

- `Repository` は全単位の木を持つのをやめ、単位の目録（id・種類・場所・key）だけを持つ。木は必要になったときに読み込み、LRU で手放す。
- 本体だけが欲しいときのために `store.subtree(unitId, nodeId)` を用意する。node 表を `parent_id` の再帰 CTE で引き、その部分木だけを組み立てる。
- provider は「SQL で対象（単位・本体・行）を選ぶ → 選んだ本体だけをメモリで解析する」の 2 段にする。`snapshotInputOf` の変換はここでやめる。
- 比べるとき（before と after）は、`unit.key`（中身の hash）が同じ単位を解析し直さない。

## 7. P4: 解析の手法

「段」は進める順です。1 は P2・P3 と一緒に進め、2 はその次、3 は必要になってから進めます。★は今回新しく提案した手法です。

| 段  | 手法                                                                             | 使う土台                                       |
| --- | -------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | 名前解決・スコープ解析、型推論（式・添字・戻り値の型）                           | P2 の宣言、P3 の `symbol` 表                   |
| 1   | 呼び出しグラフ（継承・インターフェース・オーバーロードの候補）                   | `symbol` の `signature`                        |
| 1   | 依存参照の解析（解決の確度つき）                                                 | P3 の `reference` 表                           |
| 1   | ★メトリクス（循環的複雑度・認知的複雑度・ネスト・LOC など。定義は 10 章の Todo） | P2 の `walk`（構文から数える。CFG はいらない） |
| 2   | 制御フローグラフ（値解析用。評価点の単位）                                       | P2 の文の走査                                  |
| 2   | 到達定義・定数伝播（動的クエリ・文字列を経由するメタデータ参照の復元）           | CFG                                            |
| 2   | def-use・生存変数                                                                | CFG と到達定義                                 |
| 2   | 到達性解析                                                                       | CFG                                            |
| 2   | ★ガバナ制限のリスク（ループの中の SOQL・DML を、CFG の到達性と呼び出しグラフで） | CFG と呼び出しグラフ                           |
| 2   | ★CRUD/FLS・共有の検査                                                            | 呼び出しグラフ、SOQL の JSON                   |
| 2   | ★テストと本体の対応                                                              | 呼び出しグラフ                                 |
| 2   | ★オブジェクトごとの自動化の実行順                                                | `reference` 表                                 |
| 2   | LWC: テンプレートの式の値の解決、Promise の流れ、`this.<メンバー>` の読み書き    | P2 を LWC に広げたもの                         |
| 3   | パスを区別する解析（null・型の絞り込み）、支配関係・制御依存                     | CFG                                            |
| 3   | 別名・副作用・メソッド間の要約                                                   | 呼び出しグラフと到達定義                       |
| 3   | スライシング、テイント解析（外部入力 → 動的 SOQL）                               | def-use と制御依存                             |
| 3   | ★依存グラフの中心性・コミュニティ検出・レイヤー違反                              | `reference` 表                                 |
| 3   | ★git の変更頻度・同時変更（ホットスポット）                                      | `gitRange.ts`                                  |
| 3   | SSA・記号実行（今の値のモデルで答えられない例と計測から、使うかを決める）        | —                                              |

実行本体の中のデータフローの考え方:

- 構文上の事実 → 名前と型 → 実行の経路 → 値と副作用、の順に深める。
- 最初の値のモデルは、リテラルから得た定数と `unknown`。`null` は確定した値の一種として区別する。解析できない演算・呼び出し・構文は、影響を受けうる値や経路を `unknown` にし、元の式と理由を残す。
- 結果は、断定できる事実・到達しうる候補・解析上の `unknown` を分けて持つ。分からない条件で 2 つの定数に分かれたら、値は `unknown` でも、到達定義の集合には両方の代入を残す。
- 状態が変わったノードの隣だけを評価し直し、ループは収束まで回す。
- 優先するのは、代入の履歴（def-use）と、動的クエリ・メタデータ参照の復元。読み取りと値の由来を検証しやすく、後続の解析にも同じ結果を使えるため。

## 8. P4: コンポーネント（provider・部品・雛形）

ここでの「コンポーネント」は、**解析 → provider（データ）→ 部品（描き方）→ 雛形（ドキュメントの種類）** の一式です。7 章の解析を足すたびに、この一式がそろうところまで進めます。

### 8.1 今の部品（27）と足りないところ

| 分類              | 部品                                                                                                                               | 足りないところ                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 配置・文章（13）  | `Card`・`Stack`・`Grid`・`Separator`・`Tabs`・`Accordion`・`Heading`・`Text`・`Badge`・`Alert`・`Columns`・`PageLink`・`Narrative` | —                                                                                                             |
| 表（3）           | `DataTable`・`StatusSummary`・`Matrix`                                                                                             | 数値を棒や閾値の色で見せる書式がない。並べ替えと書き出しがない                                                |
| 図（7）           | `FlowDiagram`・`ObjectDiagram`・`LwcWireframe`・`CodeFlowchart`・`EventFlow`・`SequenceDiagram`・`DiagramText`                     | ノードと線の一般的なグラフを描く部品がない（依存関係は Mermaid の文字だけ）。ソースの行に印を付ける部品がない |
| 専用のビュー（4） | `LayoutView`・`FlexiPageView`・`AutomationView`・`ImpactView`                                                                      | 指摘（findings）の一覧、実行順の表示がない                                                                    |

### 8.2 新しい部品

| 部品                      | 描くもの                                                                                                                  | 主に使う provider                                                                                                         | 段  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --- |
| `GraphView`               | ノードと線のグラフ（React Flow と dagre）。種類で色分けし、段数で絞り、押すとその単位のページへ。階層と放射の配置を選べる | `apex.callGraph`・`apex.classDependencies`・`lwc.componentTree`・`dependency.graph`・`dependency.cycles`・`feature.scope` | 1   |
| `CodeView`                | ソースを行番号つきで表示し、行に印（読み・書き・指摘・スライスの範囲）を付ける。before / after の並列表示もできる         | `apex.variables`・`apex.dynamicQueries`・`apex.findings`・`apex.slice`                                                    | 2   |
| `FindingsList`            | 指摘の一覧（重さ・ルール・場所）。行を開くと、根拠の経路を手順で見せる                                                    | `apex.findings`・`lwc.findings`・`metadata.findings`                                                                      | 2   |
| `DataFlowGraph`           | 変数の代入から読み取りへの流れと、値の由来（動的クエリの文字列の組み立てなど）                                            | `apex.variables`・`apex.dynamicQueries`                                                                                   | 2   |
| `ExecutionOrder`          | オブジェクトを保存したときの実行順（before トリガー → 入力規則 → after トリガー → Flow など）                             | `automation.executionOrder`                                                                                               | 2   |
| `DependencyMatrix`        | 単位 × 単位の依存の行列（DSM）。循環とレイヤー違反に色を付ける                                                            | `architecture.layers`・`dependency.cycles`                                                                                | 3   |
| `Treemap`・`ScatterChart` | 単位の大きさ・複雑度・変更頻度（ホットスポット）                                                                          | `apex.metrics`・`git.hotspots`                                                                                            | 3   |
| `DiffTree`                | 構造の差分の木（補助）                                                                                                    | 差分の provider                                                                                                           | 3   |

今ある部品の拡張:

- `DataTable`: 列の書式（`bar`・`threshold`・`badge`）。メトリクスの表を新しい部品なしで見せるため。
- `CodeFlowchart`: 到達できない箱を灰色に、ループの中の SOQL・DML への経路を強調、制御依存の分岐に印。
- `Matrix`: テスト × 本体の対応にも使えるよう、行列のデータの形を一般にする。
- `AutomationView`: 実行順の表示を `ExecutionOrder` に任せる。

### 8.3 新しい provider

| provider                                          | 出力          | 部品                               | 段  |
| ------------------------------------------------- | ------------- | ---------------------------------- | --- |
| `apex.symbols`                                    | rows          | DataTable                          | 1   |
| `apex.callGraph`・`apex.classDependencies`        | graph         | GraphView                          | 1   |
| `apex.metrics`                                    | rows          | DataTable（bar・threshold）        | 1   |
| `crossRef.fieldUsage`・`lwc.fieldUsage`           | matrix        | Matrix                             | 1   |
| `lwc.componentTree`                               | graph         | GraphView                          | 1   |
| `lwc.apexCalls`                                   | rows          | DataTable                          | 1   |
| `lwc.callGraph`（モジュールをまたぐ呼び出し）     | graph         | GraphView                          | 1   |
| `dependency.graph`（`GraphView` 用の形を足す）    | graph         | GraphView                          | 1   |
| `dependency.cycles`                               | rows・graph   | DataTable・GraphView               | 1   |
| `apex.variables`                                  | rows          | DataTable・CodeView・DataFlowGraph | 2   |
| `apex.dynamicQueries`                             | rows          | DataTable・DataFlowGraph           | 2   |
| `apex.findings`・`lwc.findings`                   | rows          | FindingsList                       | 2   |
| `apex.testMap`                                    | matrix        | Matrix                             | 2   |
| `apex.impact`（2 時点の解析の比較）               | rows          | DataTable                          | 2   |
| `automation.executionOrder`                       | object        | ExecutionOrder                     | 2   |
| `apex.slice`                                      | rows          | CodeView                           | 3   |
| `architecture.layers`・`architecture.communities` | matrix・graph | DependencyMatrix・GraphView        | 3   |
| `git.hotspots`・`git.coupling`                    | rows          | Treemap・ScatterChart・DataTable   | 3   |

### 8.4 雛形

| 雛形                          | 中身                                                   | 段   |
| ----------------------------- | ------------------------------------------------------ | ---- |
| `architecture_overview`（新） | クラス間の依存の図、循環、レイヤーの行列、中心のクラス | 1・3 |
| `code_quality_overview`（新） | メトリクス、使われないもの、指摘、ホットスポット       | 1〜3 |
| `test_overview`（新）         | テストと本体の対応、テストのないクラス                 | 2    |
| `apex_specification`（追加）  | メソッドごとの呼び出しグラフ、変数の流れ、動的クエリ   | 1〜2 |
| `security_overview`（追加）   | CRUD/FLS・共有の指摘、外部入力から動的 SOQL への経路   | 2〜3 |
| `automation_overview`（追加） | オブジェクトごとの実行順                               | 2    |
| `lwc_overview`（追加）        | コンポーネントの親子の図、Apex の呼び出しの一覧        | 1    |

## 9. 決めること

### 型・走査

- [ ] walker の責務の範囲: 収集だけにして「依存先の解決」を別の層にするか、解決・変換・値解析まで同じフォルダに置くか。動的クエリの復元をどちらに置くか。
- [x] 収集結果と未解決の参照の出力の型（スキーマ）。既存の依存グラフとのつなぎ方と一緒に決める。→ 参照ごとに解決の状態（`ApexReferenceResolution`）を持ち、依存関係には resolved・standard・byName だけを入れる（2.2）
- [ ] `MetadataNodeJson`（メタデータの全ノードの共用体）が TS2590 にならない作り方。
- [ ] LWC の型の解決の置き場所の名前（`processor/Lwc/typeReferences.ts` か `typeResolution.ts`）。

### 解析の範囲

- [ ] 動的クエリの部分的な復元: 一部が分からなくても「安全に確定できる参照」だけを解析するか、クエリ全体が確定できるときだけ解析するか。前者なら「安全に確定できる」条件も決める。
- [ ] 復元した文字列の上の位置と、元の Apex の位置の対応のしかた。
- [ ] 標準メソッドの戻り値: 型・クラスの単位までしか照合しない方針のまま、よく使うもの（`Database.query`・`Schema` など、SObject・List を返す主なメソッド）だけ戻り値の型の表を持つか。
- [x] 文字列の引数をメタデータ参照として扱う API の一覧（Label・Flow・カスタムメタデータなど）の範囲。→ `semantic/namedReferences.ts` の一覧（2.2）。値の追跡が要るものは 10 章 P4 の「文字列を経由するメタデータ参照」
- [ ] 標準オブジェクト・項目をどの情報源で確かめるか。
- [ ] `apex.findings` のルールの選別: 候補（10 章の Todo）のうち、「メタデータとまたがるルールに絞る」方針に合うものを残す。PMD との分担。
- [ ] findings の有効・無効の切り替えの場所: 設定ファイルか、provider の引数か、両方か。
- [ ] findings と動的クエリの復元結果を、SQLite に保存するか（symbol・reference・metric は保存すると決めた）。

### 保存・部品

- [ ] P3 で `Repository` を遅延読み込みにする範囲。MCP だけにするか、CLI のレポートの作成も含めるか。
- [ ] `reference` 表に移したあと、`derived` の BLOB を消すか、グラフの付随情報のために残すか。
- [ ] `GraphView` のレイアウト: 今の dagre で足りるか、`elkjs` を入れるか。
- [ ] `Treemap`・`ScatterChart` を自前の SVG で描くか、`recharts` を入れるか。
- [ ] `graph`（ノードと線）を、provider に共通の出力の種類として足すか。今の種類は rows・matrix・diagram・object。
- [ ] 旧 `viewer/types/`（`ObjectView`・`DependencyView`）は今のレポートの viewer から使われていない。消すか。

## 10. やること（Todo）

- 出典の文書は消したので、各項目は内容だけで分かるように書いています。優先度は高・中・低です。
- `（調整）` は、元の資料どうしで食い違っていた項目を、この計画に合わせて書き直したものです。

### P0: 土台を戻す

- [ ] `measure.ts` で NPSP の基準を取る（最初の読み込み、起動し直した読み込み、メモリの最大、DB の大きさ、node 表の行の数、`crossRef.labels` の 1 回目、`get_dependents`）。ビルド版・8 スレッド・3 回の中央値で、12.2 に書く。このマシンには NPSP のリポジトリがないので、取得してから測る（サンプルの基準は 12.1 に記録済み）（高）
- [ ] CI: GitHub で最初の実行を確かめる（Windows・Ubuntu × Node 24・26。`npm ci`・`npm audit`・Dependabot の設定は済み）（中）
- [ ] 未追跡の一時ファイル `test/_count_nodes.tmp.ts` を消すか決める（git の履歴にないので、消すと戻せない）（低）

### P1: JSON の型を `JsonType` にそろえる

- [ ] LWC の getter と setter をまとめたプロパティ（`lwcProperty`）のキーを、両方のアクセサーを含む中身から作る。今は最初のアクセサーのキー（サンプルにないので網羅のテストでは見つからない）（低）
- [ ] SOSL・項目の一覧の、関数のあとの別名（`TOLABEL(x) alias`）を JSON に出す（`types/apex/query/sosl.ts`・`select.ts` と `diff/query/sosl.ts`・`select.ts` に `alias` を通す）（低）
- [ ] Apex の Diff の型の残りを直す: `triggerCase` に項目の差分を持たせる（`Apex/diff/unitBody.ts`）、`notSet` の変化を共通の差分にそろえる（`Apex/diff/modifier.ts`）（低）
- [ ] オブジェクトの子のうち表で書けるもの（入力規則・Web リンク・共有の理由など）を `RecordSpec` に移す（`types/metadata/recordTypes.ts` にキーと属性を書く）（中）
- [ ] IR の型の後回しの 5 件（引数の rest、識別子の 3 分け、Flow と TS の型注釈、`.js` と `.ts` のノードの型、タプルの型など）を、その部分を触るときに `lwc_IR` のビジターと `types/lwc` の型を対で直す（低）
- [ ] Apex のサンプルの全 Diff を、実行時の型（zod）で検査するテストを足す（中〜低）

### P2: 型の正確な走査の土台

Apex の walker（ファイルごと）:

- [x] SOQL の関係のパス（`Owner.Name`・`Account.Owner.Name`）を、スキーマ（リポジトリのオブジェクトの定義・標準オブジェクトの一覧）で対象の項目まで解決する。`semantic/query.ts` は書いた名前の並びと、読む対象のオブジェクトまでを持つ（中）（2026-11-26。単位の参照は 1 段目の参照項目（`AccountId`・`Account__c`）とパス全体 `fieldPath`。グラフが参照項目の定義（子リレーションの表）と標準の関係（Owner → User など）でたどり、2 段目からの参照項目と最後の項目の参照にする。多態の関係から先は参照にしない）
- [x] リポジトリの型の一覧を `apexTypeResolverOf` に渡し、名前空間を書かない標準の型より優先する（2026-11-26。`isRepositoryType` でなく、宣言の索引 `repository` を渡す形にした）。単位の中の宣言との衝突・省略した名前（`String` → `System.String`）・全件の標準型での照合は `semantic/standardNames.ts` で済み（高）
- [x] `graph.ts` が、確認していないリレーション・型・項目を名前から `standard` に分類しているのを、`unknown` と分ける（中）（2026-11-26。オブジェクトは標準オブジェクトの一覧、Apex の型は標準の型の一覧、項目は標準オブジェクトの項目かどのオブジェクトにもある項目、子リレーションは親が標準オブジェクトのときだけ standard）

参照の収集と照合:

- [x] 古い名前の並びの関数（`semantic/call.ts` の `makeApex…CallNameOf`）を、移行が済んだら消す。参照の収集（型・`extends`・`implements`・`new`・呼び出し・`x.a` の読み書き・SOQL・SOSL・DML・式の中の型）は `semantic/dependencies.ts` で済み（低）（2026-11-26。テストだけが使っていたので、型・関数・テストと一緒に消した）
- [x] 呼び出しの解決の 6 つの経路（5.2）を、単位をまたいで使えるようにし（2026-11-26。`semantic/repository.ts` の宣言の索引。`apex-semantic-repository.test.ts`）、`hoge.fuga(tmp()).aaa()` と `service.fetch().save()`（`Service` が別のクラス）で確かめる。単位の中の解決は `semantic/type.ts` で済み（経路 1〜5 と、6 の引数の数での絞り込み）。単位の外の型は今は `unknown`（`externalMethod`・`externalMember`）になるので、P3 のシンボル表から宣言を引く（高）
- [x] `this.x`、`super.x`、`obj.x`、`Type.x` をレシーバーに応じて解決する。修飾のない識別子（スコープ → 引数 → 内側から外側の型のメンバー）は `semantic/statement.ts` で解決済み。継承したメンバー（ほかの単位の親クラスも）は、修飾のない名前を型の名前より先に親クラスのフィールド・プロパティで引く（2026-11-26）。親クラスのフィールド・プロパティそのものの修飾のない読み書きも、参照（`apexTypeMember:<親>.<名前>`）にした（2026-11-26。`inheritedMemberOf`・`inheritedAccesses`。自分のクラスのフィールドの修飾のない読み書きは、今までどおり参照にしない）（高）
- [x] 継承とオーバーロードは、宣言型と引数で候補を絞る。1 つに決まらなければ、候補と理由を残す。同じ単位の中の親クラスと、引数の数での絞り込みは済み（`methodCandidatesOf`・`ambiguousOverload`）。ほかの単位の親クラスは済み（2026-11-26）。インターフェースの実装クラス・上書きしている子クラスを候補にするのも済み（2026-11-26）。残りは引数の型での絞り込み（高）（2026-11-26。引数の型での絞り込みも済み: 確実に合わないものを外し、型がぴったり合う引数の多いものを選ぶ。分からない型では外さない）
- [x] リポジトリの宣言・オブジェクト・項目・子リレーションを、単位をまたぐ解決の入力として渡せる形にする。標準カタログに一致したら、型・オブジェクトの根拠として使う（`Database.Batchable` と `System.Database` を別の型として照合する）（中）（2026-11-26。宣言は `semantic/repository.ts` の索引。オブジェクト・項目・子リレーションはグラフの参照項目の表で、SOQL と変数のメンバーの連鎖（`a.Owner.Name`・`this.acc.Owner.ManagerId`）の関係のパス `fieldPath` をたどる。`Database.Batchable` と `System.Database` は標準の型の一覧で別の型として照合済み）
- [x] 参照の解決の結果に `missing`（リポジトリにも標準にもない）を足す。今は `resolved`・`standard`・`byName`・`candidates`・`unknown`（理由つき）まで（`ApexReferenceResolution`）。`missing` はリポジトリの定義（P3 のシンボル表）と突き合わせて決める（中）（2026-11-26。`ReferenceCertainty` に `missing`。単位の参照は持たず、グラフの辺 `DependencyEdge.resolution` が参照先のノードの由来から resolved・missing・standard を決める）
- [x] `apexSemanticDependenciesOf` の出力で今のグラフを作り、依存関係のゴールデンとの差が「取りこぼしの拾い直し」だけであることを確かめる。基準（`docs/examples/analysis/output/baseline-*.json`）で、消えた辺は以前の抽出の誤りの 4 本だけ、指摘は変わらない（12.1.1）（高）

古い処理からの移行:

- [x] `dependency/apex.ts` の参照の取り出しを、新しい walker の出力に移す。既存のテストと依存関係のゴールデンが変わらないことを確かめる（高）
- [x] 移行で落とさないことを確かめる、今ある個別の参照の処理（`semantic/namedReferences.ts`。以前の抽出との比較のテスト `apex-semantic-dependencies.test.ts`）（高）
    - `Label.X`・`Page.X`・`Label.get`・`PageReference`
    - `Flow.Interview.X` と `createInterview`
    - `FeatureManagement.checkPermission`
    - カスタム設定・カスタムメタデータの `getInstance`・`getAll`
    - `PageReference.forResource`、SOQL の `StaticResource` の `Name = 'X'`・`IN (...)`
    - `Type.forName`、文字列の `callout:Name`、`EventBus.publish` の型、`Schema.SObjectType…`・`Account.SObjectType`
    - トリガーの対象への `triggers`、`new` の `creates`
    - `Database` の DML メソッドの第 1 引数の型
    - 重複を 1 つにする決まり（2.2）
- [x] `calls.ts` の呼び出しの解析（`unitInfoOf` の queries・dml・calls。report の `apex.dataAccess`・処理フローが使う）を、`analyzeApexUnit` の結果に移す（`semantic/facts.ts`。以前の解析との比較のテスト `apex-semantic-facts.test.ts`）（高）
- [ ] `Apex/calls.ts` の `analyzeApexUnit`・`makeApexInfoVisitor` を消す（`apexLegacy.ts` が使う部品 `apexSoqlObjectOf` などと、比較のテストと一緒に）。P5（低）
- [ ] `apexLegacy.ts` を消す（以前の抽出との比較のテストも、差の一覧 `EXPECTED_ONLY_OLD` と一緒に消す）。P5（低）
- [x] 処理フローの分類（SOQL・DML・HTTP・dispatchEvent など）を、文の文字のパターンでなく解析の結果で決める。Apex（`apexFlow.ts`）は `facts.ts` の文脈の文、LWC（`lwcFlow.ts`）は文ごとの `Lwc/calls.ts` の callType（`fetch` は `walkJson` で `jsCall` を探す）（高）
- [x] LWC（`Lwc/walker.ts`）の `walkLwcJson` を、共通の `walkJson` の上に作り直す（文脈 `LwcWalkContext` は `state`。try の節は `jsTryClause` のノードで `inTry` にする。呼び出し側の Visitor の形は変えない）（中）
- [x] メタデータ（`Metadata/walker.ts`）を `walkJson` に寄せる。ノードは `walkJson` で辿り、ノードの中の値の木（kind のないオブジェクト・文字列）はノードに入るときに辿る。値の木の中で出会ったノードは、そこまでの文脈（path・member など）を覚えて使う。ノードの中では値の木と文字列を先に、子のノードを後に訪ねる（Visitor の形は変えない）（中）
- [ ] ソースの位置、宣言と参照の ID、CFG の辺、到達定義、`unknown` の理由が、LWC でも使えるかを確かめる（中）

`unknown` を型に置き換える（P1・P2 と一緒に。2026-11-20 時点で引数 319・型属性 146 か所。直す前に数え直す）:

- [x] `unknown` の一覧を数え直すスクリプトを置き、P1・P2 のあとにも数え直せるようにする（中）（2026-11-26。`docs/examples/analysis/scripts/unknowns.ts`。@babel/parser で読み、置いた場所（引数・属性・戻り値・変数・キャスト・型の別名・型引数）と、そのままか型の中かで数える。2026-11-26 時点で src の 575 か所: 引数 261（そのまま 213）・属性 88（69）・キャスト 126・戻り値 48・型の別名 30・変数 16・ほか 6）
- [ ] 解析の走査: `processor/Apex/walker.ts`・`calls.ts`・`commons.ts`、`processor/dependency/apex.ts`・`units.ts`（`getUnitDependencies(result: unknown)`）・`formula.ts`、`processor/Lwc/walker.ts`・`calls.ts`・`analysis.ts`、`processor/Metadata/walker.ts`・`refs.ts`・`flowRefs.ts`・`labelAnalysis.ts`・`markup.ts`・`references.ts`・`permissionAnalysis.ts`（P2 の `walk` に移すか、P5 で消す）（高）（2026-11-26 途中: JSON を調べる関数（`isRecord`・`str`・`rows`・`strings`）を `processor/commons/json.ts` にまとめ、`getUnitDependencies` の入力を `IdParseResult`、ノードを鍵にする表を `Map<object, …>` にした。src 全体で 575 → 556 か所。残りは JSON をそのまま辿る関数（`walk(node: unknown)` など）で、`walkJson` に移すときに直す）
- [ ] Diff の共通部品: `processor/commons/diff`（`gumtree/tree.ts` の `GumTreeNode.raw` など、`typed.ts`、`commons.ts`、`present.ts`、`change.ts`、`list.ts`、`unit.ts`、`formula.ts`）と、言語ごとの Diff（`Apex/diff/statement.ts`・`unitBody.ts`・`query/soqlFunction.ts`、`Lwc/diff/body.ts`・`template.ts`、`Metadata/diff/markup.ts`・`record.ts`）。P1 のあとノードの共用体で型を付ける（中）
- [x] 解析の結果の `base: unknown`: `UnitResult.base`、`IdParseResult.result.base`、`report/commons.ts`、`report/permission.ts`、`unit/processor.ts` の `objectsOf`・`translationsOf`・`objectInfosOf`。単位の種類から型を引く（中）（2026-11-26: 種類 → 中身の型の表 `parser/unitBase.ts`（`UnitBaseJsonMap`・`unitBaseOf`・`isUnitOfType`）を作り、`report/commons.ts` の `readable`（型を種類から引く。呼び出し側の `readable<型>` 13 か所を外した）・`report/crossRef.ts`・`report/apex.ts`・`unit/processor.ts` の `objectsOf`・`translationsOf`・`objectInfosOf`・メタデータの解析のキャストを置き換えた。`base` のキャストは 21 → 15 か所。Apex の Diff（`Apex/diff/unitBody.ts`）はファイルの種類 → 中身の型の表 `ApexContentJsonMap` で、呼び出し側の型を確かめる。`units.ts` に残る `base as Json` は JSON をそのまま辿るためのもので、「解析の走査」で `walkJson` に移すときに直す）
- [x] レポートの解析: `report/lwcEventFlow.ts`、`report/metadata.ts`、`report/members.ts`、`report/lwc.ts` の `keysOf`、`report/commons.ts`、`apexFlow.ts`・`lwcFlow.ts` の `sourceTextsOf`、`report/code.ts` の `compareInterfaces`（中）（2026-11-26。`compareInterfaces` の `sourceKeys` を `ConvertKeys`、`members.ts` のオブジェクトの属性を `keyof CustomObjectJson` で引く、`apexFlow.ts` の `as unknown as ClassDeclarationJson` を `kind` で絞る形にし、各ファイルの `record`・`isRecord`・`text` を `processor/commons/json.ts`（`recordOf`）に寄せた。`readable` は種類から型を引く（`parser/unitBase.ts`）。残る `unknown` は、メタデータの値の木をそのまま辿る関数（`propertiesOf`・`leafOf`）・位置のキーの型ガード（`keysOf`）・ソースと `-meta.xml` の位置が混ざった配列を読む `sourceTextsOf` で、型ガードの入力として残す）
- [x] 型の層: `types/metadata/criteria.ts`（`Record<string, unknown>` の交差）、`types/metadata/formula.ts`（インデックスシグネチャ）、`types/apex/commons/source.ts`、`types/lwc/commons.ts` の `unwrapExpression`（中）（2026-11-26。`formulaTextOf` を `Record<string, unknown>` とキャストで読むのをやめ、数式の JSON の型 `FxJson` で `kind` ごとに絞る形にした（位置つきの木 `FxSyntax` も形は同じ）。残る `unknown` は、値の木のノード `KindedTreeJson`（要素名がそのままプロパティ）・組み立て中の `FxSyntax`・JSON を辿る `gatherSourceKeys`・Babel のノードを確かめる `unwrapExpression` で、型ガードの入力として残す）
- [x] ビルダー・viewer の行と状態の型: `viewer/report/components/rowsTable.tsx` の `Row`、`builder/reportBuilder.ts` の `filterRows`・`fieldOf`・`sameValue`・`SourceResult.value`、`builder/sources.ts` の `attachSources`、`report/document.ts` の `ReportCondition`、`builder/expand.ts` の `Scope.row`、`builder/pages.ts` の `State.data`、2 か所に別々に書かれた `EmbeddedReport.spec.state`（`reportBuilder.ts`・`viewer/report/view.tsx`）と 3 か所の `$state` の判定（中）（2026-11-26。2 か所に書かれた `EmbeddedReport` と 3 か所の `$state` の判定を `src/report/embedding.ts`（`EmbeddedReport`・`stateRefOf`・`dataNameOf`）に、2 か所ずつの行の値のたどり方と比べ方を `src/builder/values.ts`（`valueAtPath`・`sameJsonValue`）にまとめた。行・state・where の値は provider の出力と文書に書いた値で、形が決まらないので `unknown` のまま扱う（provider ごとの形は `provider の引数と viewer の部品` の項目で、registry と schemas から引く））
- [ ] provider の引数と viewer の部品: `Source`・`DataSource` の `args`・`where`（registry と schemas の引数の型から引く）、`MatrixView.data`、`AnyComponent.props`、`details.tsx`・`status.tsx` の `status`、`builder/inputs.ts` の `compare`・`diff`、`report/llmCatalog.ts` の `ProviderEntry.example`（低）
- [ ] テスト: JSON・Diff の形を手書きしているテスト（`metadata-bc`・`metadata-folders`・`gumtree-diff`・`lwc-statement`・`worker`・`test/ir/golden.ts`）を、公開している JSON・Diff の型に置き換える（低）
- [ ] そのままでよい `unknown`（`catch`、外部ライブラリの例外の型ガード、`isRecord`・`hash`・`sortKeys` などの汎用の関数、型ガードの入力、SQLite の行、zod で検証する provider の引数、文書の入口、JSON Schema、MCP の結果、テストの補助、偽の MCP サーバー、サンプルのリポジトリの LWC）には、理由のコメントを付けて残す（低）

### P3: SQLite を使い切る

- [x] `symbol` 表と `symbol_name` の索引を足す。位置は node の番号でなく `source_key`（`node.source_key` と突き合わせる）。`backend.findSymbols` で名前から引く（2026-11-25）（高）
- [x] `reference` 表と `reference_target` の索引を足す。位置は member・文・式の `source_key`。`backend.findReferences` で参照先から引く。解決の状態（`resolution`）の列は、変換前の参照（`apexSemanticDependenciesOf` の references）を保存するときに足す（2026-11-25）（高）
- [x] `node` の索引を `(kind, unit_id)` と `(unit_id, parent_id)` にする（`SAVE_FORMAT_VERSION` 12）（中）
- [x] `DERIVED_VERSION` を上げ、定義・参照を表に書き直す（2。Apex の取り出しを新しい解析にしたことも含む）（中）
- [x] 保存した後に作業ツリーで変えた単位（after だけにある単位）の定義・参照も表に入れる。読み込みのたびには作らず（今までどおりグラフが要るときに作る）、表で引く前に `UnitStore.writeMissingDependencies(repository)` で、置き場に今の版の定義・参照がない単位だけを書く（2026-11-25）（高）
- [x] walker の結果の保存は、P2 の間は行わず、ここで行う（調整）（中）（2026-11-25。新しい解析の定義・参照を derived・symbol・reference に保存）
- [ ] 被依存（`get_dependents`・`dependency.dependents`・`crossRef.*`）を `reference_target` の索引で引く。推移的な影響を再帰 CTE で求める。**NPSP で計測してから決める**（2026-11-25 時点。今のグラフは、名前のそろえ方・子リレーションの解決・メンバーから単位へのまとめ上げをしてから辿るので、SQL に移すにはそれを表の側で再現する必要がある。サンプルではメモリのグラフで足りている）（高）
- [ ] `Repository` を、目録だけを持ち、木を必要なときに読み込む形（LRU）にする（高）
- [ ] `store.subtree(unitId, nodeId)` で、本体の部分木だけを組み立てる（中）
- [ ] provider を「SQL で対象を選ぶ → 選んだ本体だけをメモリで解析する」の 2 段にする。`snapshotInputOf` の変換をやめ、provider の単位の status を構造の Diff に寄せる（調整）（中）
- [x] 参照先の確かめを種類ごとの解析の関数から外し、`MetadataContext` を整理する。指摘の形を「単位の id + 行の sourceKeys」にそろえる（2026-11-25。参照先があるかはグラフの指摘 `referenceFindingsOf` に一本化。`MetadataContext` は種類の中の決まりに使う objects・apexClasses・invocableApexClasses・lwcMeta だけにした。`ReferenceInputs` はすでになかった）（中）
- [ ] グラフの指摘（`referenceFindingsOf`）を `reference` 表から作る（被依存を SQL で引くかと一緒に、NPSP で計測してから決める）（低）
- [x] パッケージディレクトリの重なり（同じ種類・同じ名前の単位が複数のパッケージディレクトリにあるとき）の扱いを、新しい `Repository` の目録で持つ（2026-11-25。`Repository.overlaps`。解析には `packageDirectories` に先に書いたものを使い、`metadata.findings` に `DUPLICATE_UNIT` を出す）（中）
- [ ] 重なりのとき Salesforce がどう扱うか（デプロイで弾くか、どちらかが勝つか）を公式資料で確かめ、指摘の重さ（今は warning）と、どちらを使うかの決まりを合わせる（低）
- [ ] 1 回目の provider の時間を短くする（`crossRef.labels` 1.4 秒など）。`reference` 表で引く形にしたあとで測り直す（低）
- [x] メトリクスの結果を `metric` 表に保存する（中）（2026-11-26。本体ごとに `metric(unit_id, seq, body, source_key, name, value)`。Apex・LWC の派生データ `UnitDependencies.metrics` と一緒に書き、`findMetrics` で名前・値の大きい順に引く）
- [x] **サンプルのコードから SQLite の生成物を作る**（2026-11-25。`docs/examples/analysis/scripts/store.ts` → `output/store-<side>.json`。node 表は単位ごとの種類の数にし、symbol・reference は行のまま。ゴールデンは `test/unit/store-golden.test.ts`）: `docs/examples/repository/before`・`after` を読み込んで `metascope.db` を作るスクリプトを置き、生成物（または表ごとの中身を書き出した JSON）を `docs/examples/` に置く。node・span・symbol・reference の表の中身を目で確かめる材料と、保存の形のゴールデンのテストに使う。P1・P3 で表の形が変わるたびに作り直す（中）
- [ ] 起動の時間・メモリの最大・`get_dependents` と `crossRef.labels` の 1 回目の時間が、P0 より悪くならないこと（高）
- [ ] DB の大きさが増えすぎないこと。`reference` 表の行の数を見て、`via` などを整数のコードにするか決める（中）

### P4: 解析（段 1）

- [x] **型の解決**: リポジトリの中の継承と、メソッドの戻り値の型をたどる（`getAccounts()[0].Name` を参照にする）（2026-11-26。保存する定義・参照は単位の中だけで決め、`pendingResolution` のある Apex の単位だけを、グラフを作るときに索引を渡して解析し直す。NPSP での時間は未計測）（高）
- [x] **インターフェース・継承を通した呼び出しの解決**: `handler.handle()` で型がインターフェース・親クラスのとき、実装しているクラスを候補として返す。`apex.callFlow` と呼び出しグラフで使う（高）（2026-11-26。`dispatchCandidatesOf`。実装・上書きしているメソッドは実行時の候補（`dispatchIds`）として持ち、依存関係には候補の参照（via: dispatch）で残してグラフの確定した辺には入れない。`apex.callFlow` は単位をまたいで解析し、実装クラスへもたどる）
- [x] **オーバーロードの区別**: 引数の数（分かれば型）で、同じ名前のどのメソッドを呼んでいるかを決める（中）（2026-11-26。`methodCandidatesOf`。基本の型の広げ方・Id と String・SObject・継承と実装・コレクションで判定。`apex-semantic-overload.test.ts`）
- [x] **プロジェクトをまたぐ解析**: シンボル表、使われていないメソッド、SObject の利用表、トリガーとハンドラーの対応、テストクラスとテスト対象の対応。使われていないメソッドは済み（2026-11-26。provider `apex.unusedMethods`。呼ばれているかは単位をまたいで解決したグラフの辺で決め、候補の呼び出しからだけ呼ばれうるものは candidateOnly。入口（テスト・@AuraEnabled などのアノテーション・global・webservice・プラットフォームが呼ぶ標準のインターフェースのメソッド・Visualforce のコントローラー）は出さない）（中）。SObject の利用表は `object.usage`、トリガーとハンドラーは `apex.triggerHandlers`、テストとテスト対象は `apex.tests`（テストの DML で動くトリガーを通る届き方も数える）（2026-11-26。`report/crossProject.ts`。どれも単位をまたいで解決したグラフから作り、候補の呼び出しはたどらない）
- [x] **メトリクス**: 構文から数える（処理フローの箱からは数えない）。Apex の数え方は `semantic/metrics.ts` の `apexMetricsOf` で済み（2026-11-25。認知的複雑度は SonarSource の定義に合わせた）。provider は `apex.metrics`（本体ごとの行。オーバーロードはシグネチャで分け、比べると値が変わった項目を出す）。LWC は `processor/Lwc/metrics.ts` と provider `lwc.metrics`（2026-11-26。構文の数え方は Apex と共通の `processor/commons/metrics.ts` の `syntaxMetricsOf` に言語ごとの kind の表を渡す。行の共通の項目はスキーマの断片 `bodyMetricsShape`）。`metric` 表への保存も済み（2026-11-26）（中）
    - 循環的複雑度 = 1 + if の分岐 + for・while・do + catch + switch の when（else を除く）+ 条件式の `&&`・`||` + 三項演算子
    - ほかに、認知的複雑度、文の数、最大のネスト、SOQL・SOSL・DML の数（ループの中のものを別に数える）、呼び出しの数（呼び出し先の一覧も持つ）
    - 対象はメソッド・コンストラクター・アクセサー・初期化ブロック
- [x] **JSON にあるが使っていない情報**: `@AuraEnabled(cacheable)` と LWC の `@wire` の突き合わせ（Apex の署名をキーにする）、公開 API（`@RestResource` など）の一覧、`@TestVisible`・SeeAllData、`@future(callout)`、`WITH SECURITY_ENFORCED`（中）
    - [x] アノテーションの引数を宣言に持つ（`ApexModifierInfo.annotationArgs`）。Apex のメソッドの定義に `auraEnabled`・`cacheable` の性質（`UnitDefinition.traits` → グラフのノードの `traits`）
    - [x] LWC の `@wire` のアダプターが Apex のメソッドなら参照（via `wire`）。グラフで `APEX_METHOD_NOT_AURA_ENABLED`（import したメソッドが `@AuraEnabled` でない）・`APEX_METHOD_NOT_CACHEABLE`（`@wire` のメソッドが `cacheable=true` でない）
    - [x] 公開 API の一覧: `apex.entryPoints`（REST の urlMapping と HTTP メソッド・`@AuraEnabled`・`@InvocableMethod`・`@RemoteAction`・`webservice`・`@future`。呼んでいるほかの単位つき）
    - [x] 単位の中で決まる指摘（`semantic/rules.ts`。`metadata.findings` の source `apex`）: `SEE_ALL_DATA`・`TEST_VISIBLE_NOT_NEEDED`・`FUTURE_CALLOUT_NOT_ALLOWED`・`QUERY_SECURITY_ENFORCED`。`apex.dataAccess` のクエリの行に `WITH` のアクセスモード（`accessLevel`）

### P4: 解析（段 2）

実行本体の中のデータフロー（この順に進める）:

- [ ] **CFG（値解析用）**: `StatementJson[]` と子の式を評価の順に評価点へ変換し、通常・真偽・ループ・例外・終了の辺を付ける。表示用の処理フロー（複数の文を 1 つの箱にまとめている）とは分け、評価点と元の位置を持つ。三項、短絡、`for` の更新式、`finally` を含む例で確かめる（高）
- [ ] **スコープと値の追跡（直列）**: `Integer old = x++;` で、読み取り時の古い値と更新後の `x` を区別する。複数の宣言、引数、名前の衝突、ブロックを抜けるときを確かめる（高）
    - [ ] スコープへの登録: 引数は本体の入口で登録する。`for` の初期化、拡張 `for` の反復変数、`catch` の例外変数、型付きの `when` の変数は、それぞれのスコープに登録する。setter には、プロパティの型を持つ暗黙の引数 `value` を登録する
    - [ ] 式の評価: 初期化式・式文・条件・呼び出しの引数・`return` などで、同じ評価の処理を使う。式の結果と評価後の状態の両方を返す。`=` は書き込み、`+=`・`++` は古い値も読む。`x++` は更新前、`++x` は更新後の値を結果にする
    - [ ] 例: `final Integer count = flag ? 1 : 0;` で、`flag` が分からなければ `unknown` にし、宣言の位置と初期化式から `1`・`0` の由来をたどれる
- [ ] **分岐と終了**: 三項・短絡・`if / else` を評価する。合流で、すべての経路の定数が一致すれば値を保ち、違う・一部が分からなければ `unknown` にする。代入元の集合は両方の経路から残す。片方が `return` したら、残った経路の値を使う（高）
- [ ] **呼び出し・メンバー・標準型と依存参照の解決**: `this.x` と同じ名前のローカル変数、クラスと標準 API の名前の衝突、呼び出しのチェーン、解決できない名前を確かめる（高）
- [ ] **クエリ・DML と値の追跡をつなぐ**（高）
    - [x] 静的クエリ: `FROM`・項目・関係・バインド式と、SOSL の `RETURNING` を集める。子サブクエリは、メタデータで子リレーションを引けるときに実オブジェクトへ解決する（`semantic/query.ts`。子サブクエリはグラフが子リレーションから実オブジェクトに解決する）
    - [x] DML: 文と `Database` の呼び出しを同じ操作として表し、対象の型と位置を持つ（`semantic/facts.ts` の DML の事実。via で文と Database のメソッドを分ける）
    - [ ] `Database.query(q)` で確定した文字列から対象を取り出し、分からない文字列なら元の引数と位置を残す
- [ ] **動的 SOQL・SOSL の復元**: 最初の段は、文字列のリテラル、同じメソッドの中で値が確定するローカル変数、それらの連結。復元した文字列を今のパーサーにかけ、静的クエリと同じ取り出しに渡す。復元した文字列の位置と元の Apex の位置を区別する。分岐・再代入を含む広いデータフローは、定数伝播ができてから広げる（調整）（高）
- [ ] **文字列を経由するメタデータ参照**: `Type.forName`、`Label.get`、`Schema.getGlobalDescribe().get('X')`・`describeSObjects`、`rec.get('Field__c')` / `put`、変数で渡した `FeatureManagement.checkPermission` を、確定した文字列で今の処理に渡す（調整: 優先度を上げた）（高）
- [ ] **ループと例外の経路**: `return`・`throw` を通常の後続の文から分ける。`break`・`continue` を対象のループにつなぐ。ループの戻りの辺では、状態が収束するまで評価する。代入の ID はソースの上の場所で固定する。`try` の例外の経路と `finally` へのつながりを別に確かめる。型付きの `when` のスコープを確かめる。通常の経路と例外の経路の書き込みを区別する（中）
- [ ] **到達定義・定数伝播の実装**（高）
    - [ ] 評価点ごとの読み取り先・書き込み先を宣言の ID に結び付ける（`x += y`・`x++` は読み取りと書き込みの両方。代入の右辺と入れ子の呼び出しも評価する）
    - [ ] 前向きの解析: 代入で到達定義を更新し、合流で和集合を取る。入力は `semantic/statement.ts` の定義（`ApexDefinition`）と読み（`ApexVariableAccess`）。今の `definitionCandidatesOf` は分岐を考えない候補なので、CFG ができたら置き換える。到達できない地点・値が分からない地点・`null` と分かっている地点を区別する
    - [ ] 状態が変わったノードの隣だけを評価し直し、ループは収束まで回す。最初は代入の場所の ID の有限集合と、`定数 / unknown` の値で始める
    - [ ] 解析できない呼び出しは、戻り値と影響を受けうるメンバーを保守的に扱い、理由と位置を返す
- [ ] **定義と使用の対応・生存変数解析**: 分岐ごとの代入から使われる場所を引く。読まれる前に上書きされる代入を見つけ、その右辺の呼び出しも取り出す（`x = f(); x = 2;` でも `f()` の呼び出しと副作用の可能性は残す）（調整: 優先度を上げた）（高）
- [ ] **到達性解析**: `return` のあとの文、定数の条件で実行されない分岐（中）
- [ ] **メンバーと参照型**: フィールドやコレクションの要素は、ローカル変数への再代入とは別の書き込み先として表す。フィールドの初期化式は、初期化の時の情報として持つ。プロパティは getter・setter の呼び出しとして集める。`get;`・`set;` は保存値への読み書きとして扱い、本体があれば本体を解析する。`new Account(Name = 'Example')` の `Name = ...` は項目への書き込みとして扱う（中）
- [ ] **データアクセスの詳しい内訳**: 本体ごとに、型・項目・プロパティの読み書き、SOQL・SOSL・DML を集める。今の `inLoop` を CFG の到達性と組み合わせる（中）
- [ ] **例外・非同期・外部接続の経路**: 例外の伝わり方、Queueable・Batch に渡すクラス、callout の位置（中）

チェックと横断:

- [ ] **★ガバナ制限のリスク**: ループの中の SOQL・DML を、CFG の到達性と呼び出しグラフで判定する（中）
- [ ] **★CRUD/FLS・共有の検査**: `with sharing` の有無、`stripInaccessible`、`WITH USER_MODE` / `SECURITY_ENFORCED`、`accessLevel` のない DML（中）
- [x] **★テストと本体の対応**: `@isTest` から呼び出しグラフをたどる（中）（2026-11-26。`apex.tests`。呼び出しと、途中の DML で動くトリガーを通る経路）
- [ ] **★オブジェクトごとの自動化の実行順**（トリガー・Flow・入力規則）（中）
- [ ] **Apex の変更の影響**: 2 時点の解析の結果を比べて、変わったメソッドのメトリクスの増減、SOQL の項目・条件の増減、呼び出しグラフを逆にたどった影響の範囲（メソッド・トリガー・テスト）、メタデータの Diff で削除・変更された項目を使う Apex、after にだけある findings を出す（公開 API の変化は `apex.interface` で済んでいる）（中）
- [ ] **`apex.findings` のルールの候補**（9 章で選別する）（中〜低）
    - 共有設定がない、`without sharing` の公開クラス、メンバー数・長さ・複雑度が大きすぎる
    - テストに assert がない、同じ SObject に複数のトリガー、トリガーの本体に処理を直接書いている
    - static 初期化ブロックの中の SOQL・DML、空の宣言、setter だけのプロパティ、公開された非 final の static
    - 引数が多すぎる、非推奨のアノテーション
    - リテラルだけの条件、enum の switch に `when else` がなく網羅もしていない、`while(true)`
    - 空の catch、`Exception` をそのまま握りつぶす、テスト以外での `runAs`
    - 使っていない変数、`System.debug` の数、ハードコードされた ID・URL
    - `LIMIT` も `WHERE` もないクエリ、先頭が `%` の `LIKE`、`!=`・`NOT IN`、`OFFSET` > 2000、ループの中の `FOR UPDATE`・SOSL
- [ ] **Flow のアクションの引数名と Apex の `@InvocableVariable` の突き合わせ**（中）

LWC・Aura・Visualforce:

- [ ] **テンプレートの式の値の解決**: `field-name={nameField}` を、JS の値・import から解決する。`@salesforce/contentAssetUrl`、名前空間つきの label、`@salesforce/userPermission` などの参照も足す（中）
- [ ] **`this.<メンバー>` の読み書きの解析**: テンプレート → getter → フィールドの依存、`@api` への代入の指摘、使っていないフィールド。JSON の型にはせず、解析の結果として出す（中）
- [ ] **`querySelector` の結果へのメソッド呼び出し**: `child.refresh()` を子の `@api` メソッドの呼び出しとして拾う。`data-*` とテンプレートを突き合わせる（中）
- [ ] **LWC のモジュールをまたぐ呼び出しグラフ**: `accountList` → `c/utils.formatAmount`（中）
- [ ] **LWC の依存の細かさ**: import の位置だけでなく、`from.member`・文・式のキーまで持たせる。`@wire` と imperative を分ける。import だけで呼んでいない Apex を、呼び出しにしない（中）
- [ ] **受け取るイベントの一覧**: テンプレートの `onxxx` に加えて、`addEventListener` で受けるもの（中）
- [ ] **TS の型の名前をバンドルをまたいで解決**し、型注釈のない項目の型を推論する。解決の順は、同じファイル → import → 組み込み・外部。ほかのバンドルの型は、保存する JSON に入れず解析の結果として持つ（必要になったら。低）
- [ ] **Aura の参照**: JS の参照（`component.get('c.method')`・`$A.get('e.c:event')`）と `aura:handler`、`{!v.x}` / `{!c.handle}` が実在するか、JS の中身の解析（案: `processor/Metadata/auraScript.ts`）（中）
- [ ] **Visualforce・Aura の専用の解析**: 使う部品・コントローラー・差し込みの項目（`{!Account.Name}`）を取り出す（中）

メタデータ:

- [ ] **オブジェクトの参照の穴**: 主従関係・積み上げ集計の対象・制御項目・`lookupFilter` の項目、`searchLayouts`・`webLinks` の URL と数式の中の項目を参照にする（`Metadata/refs.ts`・`dependency/formula.ts`）（中）
- [ ] **レイアウトの残り**: `customLink`・`miniLayout`・`summaryLayout`・`feedLayout` を読む（低）
- [ ] **Flow などの参照の残り**: Flow の `submit`（承認プロセス）、Id を直接書いたカスタム通知、レポートタイプの関係をたどった列、重複ルールの条件の項目（`flowRefs.ts`・`automation.ts`）（中）
- [ ] **項目の属性の残り**: `encryptionScheme`・`securityClassification`・`complianceGroup`、積み上げ集計の条件 `summaryFilterItems`（低）
- [ ] **暗黙の標準項目をオブジェクトごとに変える**（`OwnerId` の有無など。案: `types/metadata/standardFields.ts` を、項目の一覧と参照の確かめの両方から引く）（低）
- [ ] **翻訳のメタデータ API の形式**（`.objectTranslation`）も読む（中）
- [ ] **カスタム表示ラベルの翻訳の網羅**（どの言語に訳があるか）（中）
- [ ] **メールテンプレートの参照の残り**: 標準項目の差し込みも参照にする。Lightning のテンプレート（`{{{Recipient.Name}}}`）と Visualforce のテンプレート（`messaging:`）を読む（今の状態を先に確かめる）（中）

### P4: 解析（段 3。必要になってから）

- [ ] **別名と、メソッド・アクセサーをまたぐ副作用**: setter が更新したフィールドを次の getter が読める。複数の変数が共有するリストへの更新を追い、別のインスタンスへの更新と区別する（低）
- [ ] **メソッド間の要約**: 1 つに解決できる本体の戻り値・読み書き・例外を要約し、呼び出し側の引数とレシーバーに対応付ける（低）
- [ ] **パスを区別する解析**: `x != null`・`instanceof`・定数の条件で、分岐の辺ごとに状態を絞る。安全ナビゲーション（`?.`）の経路も考える（低）
- [ ] **支配関係・制御依存**（低）
- [ ] **プログラムスライシング**: `Database.query(q)` の文字列を組み立てた文と、対象を切り替える条件の一覧（低）
- [ ] **テイント解析**: 外部入力から動的 SOQL の文字列への経路。クエリの文字列とバインドの値への流入を分けて記録する（低）
- [ ] **SSA・記号実行**: 使うかを決める（低）
- [ ] **★依存グラフの中心性・コミュニティ検出・レイヤー違反**（低）
- [ ] **★git の変更頻度・同時変更**（低）
- [ ] **名前の変更の推定**: 項目・メソッドなど、ファイルの中の要素で今は removed + added になるものを「名前の変更」と推定し、依存の差分でも使う（`commons/diff/list.ts` で候補を照合し、`commons/diff/change.ts` に改名の候補の型を足す）（低）

### P4: コンポーネント

新しい部品:

- [ ] `GraphView`（段 1・高）
- [ ] `CodeView`（段 2・中）
- [ ] `FindingsList`（段 2・中）
- [ ] `DataFlowGraph`（段 2・中）
- [ ] `ExecutionOrder`（段 2・中）
- [ ] `DependencyMatrix`（段 3・低）
- [ ] `Treemap`・`ScatterChart`（段 3・低）
- [ ] `DiffTree`（段 3・低）

今の部品の拡張と改修:

- [ ] `DataTable` の列の書式（`bar`・`threshold`・`badge`）（段 1・中）
- [ ] `CodeFlowchart`: 到達できない箱を灰色に、ループの中の SOQL・DML への経路を強調、制御依存の印（段 2〜3・中）
- [ ] `CodeFlowchart` の改修: 繰り返しの戻り線が箱をまたいで交差する（dagre の線の向きを変える）、箱を押したときのソースを図の横に出す（`CodeView` を使う）、図の中を検索できるようにする（中）
- [ ] `SequenceDiagram` の改修: 呼び出しの活性区間と返り値を描く、長い図を段ごとに折りたたむ、横に動かしたときに参加者の見出しを固定する（中）
- [ ] `EventFlow`: 箱をコンポーネントごとの枠でまとめる（中）
- [ ] `FlowDiagram` と `CodeFlowchart` の箱の形と色をそろえる（低）
- [ ] `Matrix` の行列のデータの形を一般にする（段 2・中）
- [ ] `AutomationView` の実行順を `ExecutionOrder` に任せる（段 2・低）

新しい provider（ファイル名は案）:

- [ ] 段 1: `apex.symbols`、`apex.callGraph`・`apex.classDependencies`（`report/apexCallGraph.ts`。メソッドの辺を作り、クラスの辺にまとめる）（高）、`apex.metrics`（`report/apexMetrics.ts`）、`crossRef.fieldUsage`・`lwc.fieldUsage`（`report/fieldUsage.ts`）、`lwc.componentTree`（`report/lwcComponentTree.ts`）（高）、`lwc.apexCalls`（`report/lwc.ts` に `getLwcApexCalls`）、`lwc.callGraph`、`dependency.graph`（`GraphView` 用の形）、`dependency.cycles`
- [ ] 段 2: `apex.variables`、`apex.dynamicQueries`、`apex.findings`・`lwc.findings`（`report/apexFindings.ts`・`lwcFindings.ts`）、`apex.testMap`、`apex.impact`、`automation.executionOrder`
- [ ] 段 3: `apex.slice`、`architecture.layers`・`architecture.communities`、`git.hotspots`・`git.coupling`
- [ ] 自動化の中身: 承認プロセス・割り当て / 自動応答 / エスカレーションルール・重複 / 一致ルールの条件とアクション（`report/automation.ts`）（中）
- [ ] 権限の残り: システム権限・カスタム権限・タブの表示・レコードタイプの表示・ページレイアウトの割り当て・権限セットグループの構成（中）
- [ ] 本文のテキストの表示: メール・Visualforce・Aura の JS（`report/sourceText.ts`）（中）
- [ ] 差分の provider（補助）: `object.fieldDiffs`・`apex.diffs`・`lwc.diffs`・`lwc.publicApiChanges`・`change.files`・`change.summary`・`translation.diffs`（`report/change.ts`）。意味の差分は 2 時点の解析の比較で出す（中〜低）
- [ ] 画面のスナップショットの方式 B（`lwc.snapshot`。明示したときだけ。`report/lwcSnapshot.ts`）（低）
- [ ] 新しい provider ごとに、出力のスキーマ・1 時点 / 比べるとき・絞り込みの引数のテストを書く（中）

今の provider の改修:

- [ ] 列の既定: 列の並びと日本語のラベルを provider の定義に持ち、カタログの生成に渡す（中）
- [ ] `apex.outline` に `signature` の列を足す。行のスキーマ、`src/report/detailTemplates.ts`・`src/mcp/prompts.ts` の `m.signature` を直し、`npm run catalog` で配布用の雛形を作り直す（中）
- [ ] `metadata.units` などの行にノードの id（`apexClass:Name`。`nodeId`）を持たせる（中）
- [ ] 引数の名前と値の形をそろえる（`c/` の有無、`classes`・`members` の書き方）（低）
- [ ] `object.list` の種類の分け: カスタム設定・カスタムメタデータ型・プラットフォームイベント（中）
- [ ] `feature.scope` の範囲の制御: 段ごとの件数の上限と、省略した情報を返す。よく使われる種類を既定で外すか（コミュニティ検出の結果も候補）（中）
- [ ] 処理フローの対象を広げる: Apex のプロパティの get / set の本体と、初期化ブロック（`static { }`・`{ }`）。フローの起点に種別と一意の内部キーを足す（中）
- [ ] LWC の Promise の流れ: `then` / `catch` / `finally` のチェーンを分岐として描く（中）
- [ ] JS の switch の中の break: case の途中の break を、switch を抜けるものとして描く（低）
- [ ] 大きいメソッドの処理フロー: 箱の数の上限と、繰り返し・try の単位での折りたたみ（中）
- [ ] `lwc.eventFlow` の線を足す: `@wire` のデータがテンプレートで使われる所、親から子へのプロパティの受け渡し、画面の遷移先（中）
- [ ] 処理フロー・流れの図の比べる時点: 変わった箱に色を付ける（補助。低）
- [ ] Visualforce・Aura の処理フロー: 同じ `CodeFlowchart` で描く（`report/markupFlow.ts`）（低）
- [ ] LWC の置き場所を広げる: タブ・クイックアクション（低）
- [ ] ラベルの使用箇所: Visualforce での使用箇所も出す（低）

雛形:

- [ ] 新しい雛形: `architecture_overview`、`code_quality_overview`、`test_overview`
- [ ] 今の雛形への追加: `apex_specification`、`security_overview`、`automation_overview`、`lwc_overview`（8.4）

### 部品と viewer（段階によらない）

- [ ] 表の並べ替えと列の出し分け（高）
- [ ] CSV / Excel への書き出し: 表ごとのボタン（`src/report/export/table.ts` を `report export` と共通にする）（高）
- [ ] status のない「変化」の列を出さない（`AutomationView`・`LayoutView`・`FlexiPageView`）（中）
- [ ] API 名とラベルの切り替え（中）
- [ ] `PageLink` を表や複数の列で並べる（中）
- [ ] ページの間のリンク: 単位の名前からその単位のページへ、ファイルの列から VS Code・GitHub を開く（`src/viewer/report/links.ts`）（中）
- [ ] MCP Apps の画面でページを開く（中）
- [ ] ページの中の目次（中）
- [ ] `Card` と表をまとめた部品（`components/cardTable.tsx`）（中）
- [ ] 部品の説明を日本語でも出す（低）
- [ ] 印刷・PDF と静的な HTML（`src/builder/export/staticHtml.ts`）（中〜低）
- [ ] 文書の中の検索（`components/reportSearch.tsx`）（低）
- [ ] 見た目の調整: 色・ロゴ・表紙を、利用者がどこまで変えられるかを決める（theme のスキーマを `document.ts`・`documentSchema.ts` に足す）（中）

### ビルドと文書（段階によらない）

- [ ] where だけ違う同じデータを使い回す: `sourceRunner` で provider の結果を（provider・引数・比べる時点）のキーで覚え、where は `filterRows` で絞るだけにする（高）
- [ ] 同じデータを 1 つにまとめて埋め込む（データを ID で引く形にする）（中）
- [ ] 大きい文書のビルドの進み具合を知らせる（`ResolveReportOptions` に進み具合のフック。NPSP の Apex の仕様書の時間を測る）（中）
- [ ] 行の中の配列を for で回す（`"in": "${m.items}"`）（中）
- [ ] for の並べ替え（`"sort": "name"`）（中）
- [ ] where の比べ方を増やす: 否定・含む・前方一致・数の比較（中）
- [ ] `${` をそのまま書くエスケープ（低）
- [ ] ページの入れ子: クラスのページの中にメソッドのページ（`SplitPage` に親のページの ID）（低）
- [ ] ページのファイル名: 大文字・小文字だけ違う名前（Windows で重なる）と、種類が違う同じ名前を区別する（中）
- [ ] 部分の使い回し（`use` / `with`。スコープと循環の検出を付ける）（中）
- [ ] YAML でも書ける（`src/report/readDocument.ts`）（中）
- [ ] 文書の形の版（`"version": 1`）（中）
- [ ] notes のキーの一覧を出す（MCP の `list_note_keys`、CLI の `report notes`。`src/builder/notes.ts` の `listNoteKeys`）（高）
- [ ] notes を別のファイルに置く（中）
- [ ] 文章の鮮度: データの指紋で「文章が古い可能性」を知らせる（中）
- [ ] AI の注記（annotations。`components/annotations.tsx`）（中）
- [ ] 問題のメッセージを日本語にする（英語と選べる）。どの行かを示し、よくある誤りには直し方を出す（`src/report/diagnostics.ts`）（中）

### CLI と MCP（段階によらない）

- [ ] `report watch`: 保存するたびに作り直す（`src/cli/reportWatch.ts`）（中）
- [ ] `report export`: Excel・Markdown・Word への書き出し（`src/builder/export/`）（中）
- [ ] `report notes`（高）
- [ ] CLI の引数を足す: `--threads`・`--quiet`・`--json`（低）
- [ ] MCP で雛形を返すツール（`list_report_templates` と雛形の JSON）。利用者の雛形も同じ一覧に出す（高）
- [ ] 設定ファイル `sf-metascope.config.json`（対象のプロジェクトのルート。`src/config.ts`）と `config show`（高）
- [ ] 初めての読み込みの進み具合: MCP の進捗の通知か `status` のツール（中）
- [ ] 保存先の `.gitignore` を知らせる（中）
- [ ] 配布の形: npm の公開、`bin`・`files`（`docs/catalog` の JSON Schema と雛形を含める）・`version`・`license` を整え、`LICENSE` を足す。`npm pack` の成果物をインストールして確かめる CI のステップを足す（高）
- [ ] 作ったレポートの一覧と作り直し: `report rebuild --all`（`src/builder/reportManifest.ts`）（低）

### 品質（段階によらない）

- [ ] 画面のテスト: viewer をブラウザで描き、画面写真の差分を取る（Playwright。`playwright.config.ts`・`test/browser/report.spec.ts`）（中）
- [ ] サンプルの出力を作り直すスクリプト（`docs/examples/report/output/` はスクリプトが作る）（中）
- [ ] 大きいリポジトリのゴールデン: NPSP の一部で、処理フロー・流れの図の箱と線を確かめる（低）
- [ ] 書き込みのスレッドのテストを速くする（ttsx で 26 秒）（低）
- [ ] テストの残り: S3 の key で比べるのを省いた差分が、すべて比べた差分と同じこと。設定ファイル・YAML のテスト（中〜低）
- [ ] 実際の組織での洗い出し: NPSP などで、読めない要素・`skippedElements`・指摘の誤検出を洗い出す（中）
- [ ] サンプルに不具合確認用の構文が入っているかを確かめ、なければ足す: getter の中の SOQL、`this.f()`、`Database.Batchable`、`FIND :x`、サブクエリ、`Database.insert(list, false)`、`Trigger.isBefore`（中）
- [ ] サンプルのスクリプトを 1 つにまとめる（`docs/examples/run.ts`。P2 の `walk` を使う）（低）
- [ ] 網羅の表を登録表から作る（`docs/catalog/coverage.md` を `npm run catalog` で）（低）

### 調査

- [ ] Salesforce のリリースの更新のスキルを定期実行にする（リリースの公開に合わせて 2 月・6 月・10 月ごろ、または月 1 回。`/schedule` など）（低）
- [x] LWC の公式資料（Component Reference・開発者ガイド・リリースノート）を自動で取れる場所を探し、スキルの照合の対象にする（今は PDF が見つからず、HTML は 403）（中）（2026-11-26。基本コンポーネントは `@salesforce/lwc-language-server` の `transformed-lwc-standard.json`（スキルの `lwc-components`）、SLDS のアイコンは `@salesforce-ux/design-system` のメタデータ（`slds`）で照合する。開発者ガイド・リリースノートは対象外のまま）
- [ ] package.xml の既定の API バージョン（`graph.ts` の `toPackageXml` の `'62.0'`）を、新しくするか `sourceApiVersion` を必ず渡すかを決める（低）

- [ ] 標準 API の調査の残り: 型の一覧の未収録の領域と、各型の公開条件。必要ならメソッド名・非推奨・導入版。型の解決に要るなら、オーバーロード・引数・戻り値の型（中）
- [ ] 標準オブジェクトと項目の収集。公式資料の不足分と、組織の設定・権限で変わる部分を分ける（中）
- [ ] 標準 API の、過去の公式資料の版ごとの比較（低）
- [ ] メタデータで単位の種類がないもの: Profile のパスワードの方針・セッションの設定、共有セット、テリトリー、組織の設定（settings）の中の構造を持つ文字列（低）
- [ ] 数式の演算子の全一覧を Salesforce の文書で確かめる（低）

### 文書

- [ ] **まだ統合していない 14 ファイル**（冒頭の一覧）を読み、未完了の作業・方針・未確認のことをこの文書に移してから消す（高）
- [ ] コードのコメントにある、消した文書への参照（`docs/*.md`。約 320 か所）を、この文書の節への参照に直すか消す（中）
- [ ] `docs/catalog/generate.ts` と `docs/examples/*/scripts` の、消した文書への参照を直す（低）
- [ ] IR のノード型の一覧を作り直す手段を決める（以前は TypeScript 5.9 の型チェッカーを別に入れたスクリプトで作った。リポジトリの typescript 7 には JS の API がない）（低）
- [ ] JSON の型と Apex 構文の対応の説明（型の解決・実在は保証しないこと）を、P1 のあとで必要なら作り直す（低）

### P5: 古い処理を消す

- [ ] 旧 `processor/Apex/walker.ts` と、`calls.ts` の新しい walker と重なる部分を消す。古い入口が import されていないことを確かめる（中）
- [ ] `snapshotInputOf` と、解析結果を覚える `WeakMap` のキャッシュ（P3 の表に移したもの）を消す（中）

## 11. 未確認のこと

- 共有の理由（オブジェクトの子）が `skippedElements` を持つか（資料によって記述が違った）。
- `analyzeApexUnit` が本番の provider につながっているか（`apex.dataAccess` で 2026-11-17 につないだという記述と、つないでいないという記述があった）。
- 選択リスト値の並び順の印: コード（`report/object.ts` の `orderChanged`）では実装済みに見える。
- `lwc.apexCalls` が「済」と書かれていた意味（JSON がそろったという意味か）。provider は src にない。
- LWC のレポートが JS の JSON を使っているか（`report/lwcFlow.ts`・`lwcEventFlow.ts` はある）。
- 受け取るイベントの一覧（`addEventListener`）と、`querySelector` の結果へのメソッド呼び出しが、解析で出せるか。
- LWC の依存の参照が、メンバー単位（`from.member`）になっているか。
- 括弧や `as` で包んだ関数の初期値で、`function` と `init` の両方を持つ形になっているか。
- Flow の画面の項目の `objectFieldReference`（動的な項目）を参照にしているか。
- Lightning と Visualforce のメールテンプレートを読んでいるか。
- 数式を文字列で出している利用側（オブジェクトの表示など）があるか。
- コメント・ApexDoc は IR に入っていない（ANTLR の隠しチャネル）。対象外としてよいか。
- `unknown` の一覧の件数（2026-11-20 時点）が今も正しいか。新しい walker が数えた対象に入っていたか。
- IR のノード型の一覧（250 ノード、304 ファイル）が今の IR と合っているか。
- 最初の GitHub Actions の実行結果。
- `docs/examples/report/output/` が今もないか。
- `docs/implementation-details/*.md` は、この整理の前に作業ツリーから消えていた（意図したものとして扱った）。

## 12. 計測の記録

### 12.1 サンプルのリポジトリ（`docs/examples/repository` の after）

`measure.ts` を ttsx で、3 回の中央値（2026-11-24、Node v26.8.2、Windows）。サンプルは小さいので、時間はぶれが大きい。主に、JSON の形を変えたときの数（ノード・位置・`sourceObject`）を比べるために使う。

| 項目                                      | P0               | P1 後            | P3 後 |
| ----------------------------------------- | ---------------- | ---------------- | ----- |
| 単位の数                                  | 83               | 83               |       |
| 定義 / 参照                               | 223 / 606        | 223 / 606        |       |
| node 表の行の数（`flattenUnit` のノード） | 3,352            | 4,583（+37%）    |       |
| 位置の行の数（`flattenUnit` の span）     | 3,467            | 4,630（+34%）    |       |
| `sourceObject` の数                       | 2,604            | 3,498（+34%）    |       |
| すべて parse したあとのヒープ             | 234 MB           | 382 MB（※）      |       |
| 最初の読み込み（すべて parse）            | 568.8 ms         | 452.6 ms         |       |
| 起動し直した読み込み                      | 103.2 ms         | 85.9 ms          |       |
| 保存データ                                | 1,540 KB         | 1,800 KB（+17%） |       |
| 定義・参照 / グラフ                       | 23.0 ms / 5.9 ms | 14.4 ms / 5.9 ms |       |
| 差分（before → after）                    | 31.1 ms          | 28.3 ms          |       |

before は、単位 79、ノード 3,199、位置 3,311、`sourceObject` 2,469。

P1 後（2026-11-24。P1 の 6 段をすべて終えたあと）: before は、単位 79、ノード 4,379、位置 4,421、`sourceObject` 3,321。定義・参照の数は P0 と同じ（依存関係は変わっていない）。時間はぶれの範囲。※ヒープは before で 248 MB で、after だけが増えている。GC の時期によるぶれと考えられるので、NPSP で確かめる。

### 12.1.1 新しい解析の参照の変換（2026-11-25、after のサンプルの Apex）

| 項目                                     |     件数 | 備考                                                                                                                                                                      |
| ---------------------------------------- | -------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 今の抽出（`dependency/apex.ts`）の参照   |      335 | 種類・対象・意味・via・member が同じものを 1 件                                                                                                                           |
| そのうち新しい変換にもあるもの           |      330 | 残る 5 件は今の抽出の誤り（標準の関係の先を `Account.Owner` にする 4 件、WHERE の別名 `a` を外さない 1 件）。新しい変換は理由つきの `unknown`（`relationshipPath`）で持つ |
| 新しい変換にだけあるもの                 |       37 | WHERE の中のサブクエリ、TYPEOF の型ごとの項目、HAVING・関数の中の項目、戻り値の型をたどった項目、`this.x` への代入、匿名 Apex の DML の対象など                           |
| 基準のグラフの辺（before・after）        | 421・460 | 切り替えで before・after とも +26・−4。消えたのは上の誤りの 4 本（`Account.Owner`・`Account.Parent`・`Account.a`・`Account.Contacts.Account`）。指摘（8・20）は変わらない |
| 新しい変換の参照の解決（変換前のすべて） |      615 | standard 369・byName 209・resolved 16・unknown 21                                                                                                                         |

### 12.2 NPSP

ビルド版、8 スレッド、3 回の中央値で測る。**このマシンに NPSP のリポジトリがないので、P0 ではまだ測っていない**（10 章の P0 の Todo に残っている）。

| 項目                              | P0  | P1 後 | P3 後 |
| --------------------------------- | --- | ----- | ----- |
| 最初の読み込み（秒）              |     |       |       |
| 起動し直した読み込み（秒）        |     |       |       |
| メモリの最大（MB）                |     |       |       |
| DB の大きさ（MB）                 |     |       |       |
| node 表の行の数                   |     |       |       |
| `crossRef.labels` の 1 回目（秒） |     |       |       |
| `get_dependents`（秒）            |     |       |       |
