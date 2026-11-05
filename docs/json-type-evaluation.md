# Apex / LWC の JSON（jsonType）の評価

Apex と LWC のサンプルを実際に parse して、できた JSON（`types/apex/*.ts`・`types/lwc/*.ts` の `*Json`）を次の 3 つの観点で評価した（2026-11-05）。

1. **表現できているか**: ソースの内容が JSON に残っているか
2. **Diff を取りやすいか**: 位置だけの変更・1 か所の変更で objectKey / sourceKey がどう変わるか、要素を名前で対応付けられるか
3. **解析で使う属性が JsonType になっているか**: [apex-json-analysis.md](./apex-json-analysis.md)（Apex）と [report-components-plan.md](./report-components-plan.md) 2.5（LWC）で使う属性が、`kind` と `sourceKeys` を持つノード（位置を指せる）か、ただの値か

再実行: `npx ttsx --noCheck docs/examples/json-evaluation/evaluate.ts`（結果は [output/evaluation.json](./examples/json-evaluation/output/evaluation.json)）

## 0. まとめ

| 観点                     | Apex                                                                                                                                              | LWC（JS / TS）                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. 表現                  | **高い**。識別子の 96%（593 / 620）が構造化された値として残る。残らないのは SOQL / SOSL の予約語（正規化して持つ）と、構文エラーの範囲だけ        | **宣言は高く、本体は低い**。識別子の 71%（87 / 122）。メソッド・getter の本体の処理と、export しないモジュール直下のコードは JSON にない                                        |
| 2. Diff                  | **取りやすい**。位置だけの変更で objectKey は 0 件変わる。1 か所の変更で変わるのは、変えたノードとその祖先だけ（263 件中 5 件）                   | **宣言は取りやすいが、本体の変更が見えない**。objectKey の安定性は Apex と同じ。ただし本体を変えると objectKey は変わるのに JSON の中身は同じで、「変わった」ことしか分からない |
| 3. 解析の属性が JsonType | **ほぼ満たす**。宣言・文・DML・SOQL の句の要素は JsonType。kind のない式（リテラル・`new`・キャスト・代入）と、変数（`variants`）は位置を持たない | **公開 API・依存は満たす**。`@api`・`@wire`・イベント・import・Apex の呼び出しは JsonType。`@wire` の設定・初期値・継承元・型の宣言のメンバーは文字列で、位置を持たない         |

優先して直すとよいもの（8 章）:

1. LWC: メソッドの本体を表す（Apex の文と同じ粒度にするか、最低限、本体の変更が Diff で見えるようにする）
2. LWC: `@wire` の設定の値（`fields: [NAME_FIELD]`）を import と結び付けて構造にする（項目の利用表に要る）
3. Apex: kind のない式（特にリテラル）と変数に位置を持たせる（ハードコードされた ID などの findings の位置）
4. Apex: sourceObject の `context` が空白を失っている（ANTLR の `getText()`）。表示には元のソースを offset で切り出す

## 1. 評価に使ったサンプル

| 言語       | ファイル                                                                                                                                                      | JsonType のノード数           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Apex（13） | `docs/examples/apex-ir/` の 5 ファイル（全文法を網羅した `ParserTest.cls` など）、`docs/examples/apex-diff/after/` の 8 ファイル（`Broken.cls` は構文エラー） | 1,770（60 kind。ErrorJson 1） |
| LWC（7）   | `docs/examples/lwc/bundles/` の 4 バンドル（TS。`broken` は LWC の仕様違反）、`ssr-snapshot` の 2・`ssr-lbc` の 1（JS）                                       | 145（12 kind。ErrorJson 0）   |

LWC はいま JS / TS だけで、HTML / CSS / js-meta.xml の JSON はまだない（[lwc-parse-plan.md](./lwc-parse-plan.md) 7 章）。テンプレートが要る解析（親子関係・`field-name` など）は評価の対象外。

## 2. 観点 1: 表現できているか

### 2.1 測り方

ソースからコメントと文字列リテラルを除いた識別子（予約語を除く）が、JSON の文字列の値に残っているかを数えた。

- **構造化**: 値そのもの（名前・型名・項目のパスなど）として残る
- **文字列の中**: 式の文字列（LWC の `init` など）の中にだけ残る
- **欠落**: どこにもない

### 2.2 結果

| 言語 | 識別子 | 構造化     | 文字列の中 | 欠落 |
| ---- | ------ | ---------- | ---------- | ---- |
| Apex | 620    | 593（96%） | 0          | 27   |
| LWC  | 122    | 87（71%）  | 5          | 30   |

**Apex の欠落 27 件**は、ほとんどが表し方を変えて残っているもの（このツールの数え方の限界）で、本当に失われているのは 1 件だった。

| 欠落した語                                                                             | 実際の JSON                                                             | 判定                                                                        |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `inherited`（`inherited sharing`）                                                     | modifier `INHERITED_SHARING`                                            | 残る（正規化）                                                              |
| `user`（`insert as user`）                                                             | DML の `accessLevel: 'USER'`                                            | 残る（正規化）                                                              |
| `convertCurrency` / `GEOLOCATION`                                                      | `func: 'CONVERT_CURRENCY'` / `type: 'coordinate'`（緯度・経度を構造化） | 残る（正規化）                                                              |
| `FIELDS` / `LISTVIEW` / `USING SCOPE` / `DATA CATEGORY` / `THEN` / `END` / `L` / `T00` | 句の種類・オプションとして持つ、または SOQL の予約語・リテラルの一部    | 残る（予約語）                                                              |
| `target_length`（`WITH SNIPPET (target_length = 120)`）                                | `{ mode: 'SNIPPET', value: '120' }`                                     | **オプション名が失われる**（SNIPPET のオプションは 1 つなので実害は小さい） |
| `x` / `foo`（`Broken.cls`）                                                            | 構文エラーの範囲が ErrorJson                                            | 想定どおり                                                                  |

**LWC の欠落 30 件**は、次の 3 つに分かれる。

| 欠落した語の例                                                                                       | 理由                                                                                                                  | 判定                       |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `reduce` / `sum` / `row` / `amount` / `length` / `dataset` / `HTMLElement` / `focus`                 | **メソッド・getter の本体**。JSON は本体から `calls`（Apex の呼び出し・ナビゲーションなど）と `events` だけを取り出す | **表現の欠け**             |
| `formatter` / `Intl` / `NumberFormat`（`utils.ts`）/ `records` / `record`                            | **export しないモジュール直下の宣言と、関数の本体**。`otherExports` は名前だけ                                        | **表現の欠け**             |
| `attributes` / `actionName` / `target`（`this[NavigationMixin.Navigate]({ ... })`）、`dispatchEvent` | ナビゲーションの遷移先の設定と、`dispatchEvent` の呼び出し自体（イベントは `new CustomEvent` で取る）                 | 欠け（解析で要るなら足す） |
| `detail` / `bubbles` / `composed`                                                                    | JSON のフィールド名として持つ（`lwcEvent.bubbles`）。数え方の限界                                                     | 残る                       |

### 2.3 判定

- **Apex**: 宣言・文・式・SOQL / SOSL のほぼすべてを構造で表せている。構文エラーは ErrorJson として範囲が残る。
- **LWC**: コンポーネントの外形（import・クラス・メンバー・デコレーター・型・イベント・呼び出し）は表せている。一方、**処理の中身（本体）は表していない**。これは [lwc-parse-plan.md](./lwc-parse-plan.md) 3.1.2 で「式は名前の参照とリテラルだけを構造にする」とした方針どおりだが、Diff（3.2）とルール違反の検出（`innerHTML` など）に影響する。8 章「決めること」の「JS / TS の式をどこまで構造にするか」を、この結果で決める必要がある。

## 3. 観点 2: Diff を取りやすいか

### 3.1 キーの安定性

`AccountService.cls`（Apex）と `accountList.ts`（LWC）を変えて parse し直し、変更前の JSON にない objectKey / sourceKey を数えた。

| 変更                                    | 言語 | JsonType | objectKey が変わったもの                                           | sourceKey が変わったもの |
| --------------------------------------- | ---- | -------- | ------------------------------------------------------------------ | ------------------------ |
| 先頭にコメントと空行を足す（位置だけ）  | Apex | 263      | **0**                                                              | 263（すべて）            |
| 同上                                    | LWC  | 82       | **0**                                                              | 82（すべて）             |
| SOQL の `LIMIT 200` → `LIMIT 100`       | Apex | 263      | 5（`class` → `method` → `localVariable` → `soql` → `limitClause`） | 0                        |
| `@api maxRows?: number = 10` → `20`     | LWC  | 82       | 2（`lwcComponent` → `lwcField`）                                   | 0                        |
| getter `isTable` の本体の `===` → `!==` | LWC  | 82       | 2（`lwcComponent` → `lwcProperty`）                                | 0                        |

- 位置だけの変更では objectKey が変わらない（sourceKey だけが変わる）。objectKey はキーの順序にも依らない（`sortKeys`）。
- 1 か所の変更で objectKey が変わるのは、変えたノードとその祖先だけ。Diff で「変わっていない部分木」を objectKey で読み飛ばせる。
- LWC の sourceKey はファイルのパスを含むので、同じバンドルの別のファイルの同じ位置でも別の値になる。ファイルの改名では objectKey は変わらず、sourceKey だけが変わる。

### 3.2 LWC: 本体の変更が「見えない」

getter `isTable` の本体を変えると、`lwcProperty` の objectKey は変わるが、**JSON の中身（sourceKeys を除く）は変更の前後でまったく同じ**だった。

```json
{
    "kind": "lwcProperty",
    "name": "isTable",
    "isGetter": true,
    "isSetter": false,
    "getterContent": { "modifier": {}, "calls": [], "events": [] },
    "variantType": {
        "kind": "lwcType",
        "text": "boolean",
        "type": "primitive",
        "primitiveType": "boolean"
    }
}
```

objectKey は IR（本体を含む）の内容から作るので変わるが、JSON は本体を持たない。このため Diff は「`isTable` が変わった」ことは分かっても、**何が変わったかを JSON の差分として示せない**。対応の候補:

| 案                                                                                      | 内容                                                                         |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| A. 本体を Apex の文と同じ粒度で JSON にする                                             | Diff・メトリクス（複雑度）・ルール違反に使える。JSON の層の実装が大きい      |
| B. 本体の文字列（または本体のノードの sourceKeys）を `body` として持つ                  | 「本体が変わった」ことと、ソースの差分（行単位）を示せる。構造の差分ではない |
| C. Diff の側で、objectKey だけが違うノードは sourceObject の `context` を比べて表示する | JSON を変えずに済む。ほかのノードにも同じ問題があれば共通に使える            |

### 3.3 要素の対応付け

JsonType の配列の要素が名前（`name` / `variant` / `source` / `local`）を持つか（Diff で名前で対応付けられるか）を数えた。

| 言語 | 名前を持つ（集合・名前で対応付け）                                                                                                                                            | 名前を持たない（順序・GumTree で対応付け）                                                                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Apex | `class` / `interface` / `enum` / `method` / `property` / `parameter` / `annotation` / `modifier` / `enumConstant` / `interfaceMethod`（すべて 100%）                          | 文・式（順序に意味がある。GumTree）、`field`（0 / 68）・`localVariable`（0 / 97）、`selectEntry`（項目のパスで対応付け）、`triggerCase` |
| LWC  | `lwcField` / `lwcProperty` / `lwcMethod` / `lwcParameter` / `lwcDecorator` / `lwcImport`（`source`）/ `lwcImportSpecifier` / `lwcEvent` / `lwcTypeDeclaration`（すべて 100%） | `lwcCall`（`target` で対応付けられる）                                                                                                  |

- Apex の `field` / `localVariable` は名前を `variants`（`{ name, init }` の配列）の中に持つので、Diff は `variants` の名前で対応付ける（[apex-json-diff-policy.md](./apex-json-diff-policy.md) の D）。`private Integer a = 1, b = 2;` のように 1 つの宣言に複数の変数があるため。
- LWC の `block` は、メンバーがすべて名前を持つので名前で対応付けられる。getter と setter は 1 つの `lwcProperty` にまとめてあるので、組で比べられる。
- 兄弟の要素で objectKey が重なるもの（内容が同じ要素）は、サンプルでは Apex 117 配列・LWC 19 配列のどちらも 0 件。同じ文が 2 回並ぶような場合は objectKey が重なるので、順序（GumTree）で対応付ける必要がある。

### 3.4 そのほか

- **Apex の sourceObject の `context` は空白を失っている**（`classParserTestextendsBaseParser...`）。IR の span が ANTLR の `getText()`（トークンをつなげた文字列）から作られるため。Diff の表示に使うには、`start` / `end` の offset で元のソースから切り出す必要がある。LWC は元のソースを切り出すので空白も残る。
- Apex は Diff の実装（`processor/Apex`）と評価（[apex-diff/evaluation.md](./examples/apex-diff/evaluation.md)）がある。LWC の Diff はまだない。JSON は名前で対応付けられる形になっているので、Apex の宣言の Diff（集合・名前で対応付け）と同じ作りで実装できる見込み。

## 4. 観点 3: 解析で使う属性が JsonType になっているか

「JsonType」は `kind` と `sourceKeys` を持ち、ソースの位置（findings の位置・Diff の対象）を指せるもの。「値」はそのノードの中の文字列・オブジェクトで、位置は親の JsonType で指すしかない。

### 4.1 Apex（[apex-json-analysis.md](./apex-json-analysis.md) 3〜5 章の属性）

| 解析で使う属性                                                                   | 表し方                                                                                                                       | 判定 |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---- |
| クラス・メソッド・プロパティ・コンストラクタの名前、`extends` / `implements`     | StructureJsonType（`sourceKeys.name`）、`extend` / `implement` は `type`（JsonType）                                         | ○    |
| 修飾子・アノテーション（`@AuraEnabled` / `@Future` など）と引数                  | `modifier` / `annotation`（JsonType）。アノテーションの引数 `arg` は値                                                       | ○    |
| パラメータの名前・型                                                             | `parameter`（JsonType）                                                                                                      | ○    |
| 参照する型（依存関係）                                                           | `type`（最上位だけ JsonType。型引数・要素型は値）                                                                            | ○    |
| 文（if / for / while / try / switch / return / throw）                           | JsonType。条件と本体の組（`conditionBlock` など）は値                                                                        | ○    |
| DML の種類・`accessLevel`                                                        | `insert` / `update` / ...（JsonType）。**対象は `field: string`**（式の文字列）                                              | △    |
| メソッド呼び出し（呼び出しグラフ）・項目の参照                                   | `memberAccess`（JsonType）。`object` が JsonType / 値 / 文字列のどれにもなり、形がそろわない                                 | △    |
| SOQL の対象・項目・条件・`LIMIT`                                                 | `soql` / `selectEntry` / `fromField` / `singleCondition` / `limitClause`（JsonType）。句のまとまり（`select` / `where`）は値 | ○    |
| SOSL の検索語・`RETURNING`                                                       | `sosl` / `soslField`（JsonType）。`WITH` の各オプションは値                                                                  | ○    |
| トリガーのイベント                                                               | `triggerCase`（JsonType）                                                                                                    | ○    |
| **変数の名前と初期値**（使われていない変数など）                                 | `field` / `localVariable` の `variants` の中の値                                                                             | △    |
| **kind のない式**: リテラル（ハードコードされた ID・URL）・`new`・キャスト・代入 | 値（`type: 'literal'` などを持つが `sourceKeys` がない）。位置は親の `expression` / 文で指す                                 | ×    |

### 4.2 LWC（[report-components-plan.md](./report-components-plan.md) 2.5 の属性）

| 使う部品                                    | 解析で使う属性                                        | 表し方                                                                                                                                         | 判定 |
| ------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `LwcComponentDetail` / `LwcPublicApiTable`  | `@api` のプロパティ・メソッドの名前と型               | `lwcField` / `lwcProperty` / `lwcMethod`（StructureJsonType）と `lwcDecorator`、型は `lwcType`（JsonType）                                     | ○    |
| 同上                                        | 発火するイベント                                      | `lwcEvent`（JsonType）。`detail` は式の文字列、`detailType`（TS）は `lwcType`                                                                  | ○    |
| 同上                                        | `@wire` のアダプターと設定、`'$recordId'` の追従      | `lwcDecorator.wire`（値）。`adapter`・`adapterSource`・`config[].reactive` は文字列                                                            | △    |
| `LwcApexCallTable`                          | 呼ぶ Apex（`@wire` / imperative）                     | imperative は `lwcCall`（`apex: { className, methodName }`）。`@wire` は `adapterSource`（文字列）を `lwcImport.apex` と突き合わせる必要がある | △    |
| 同上                                        | imperative の呼び出しの引数                           | なし（`deleteAccount({ recordId })` の引数は JSON にない）                                                                                     | ×    |
| `LwcFieldUsageTable`                        | `@salesforce/schema` の import                        | `lwcImport.schema`（`objectApiName` / `fieldApiName`）                                                                                         | ○    |
| 同上                                        | `getRecord` の `fields: [NAME_FIELD, INDUSTRY_FIELD]` | `config[].value` の文字列。import の名前との対応は文字列を読み直す必要がある                                                                   | ×    |
| `LwcFindingsList`                           | `@track` の不要な使用                                 | `lwcDecorator`（`track`）と `variantType`                                                                                                      | ○    |
| 同上                                        | `innerHTML` などの使用、`dispatchEvent`               | なし（本体を表さない）                                                                                                                         | ×    |
| `LwcDiffView`                               | メンバーの追加・削除・型の変更                        | `block` の名前と `variantType`                                                                                                                 | ○    |
| 同上                                        | メンバーの本体の変更                                  | objectKey だけが変わる（3.2）                                                                                                                  | ×    |
| 依存関係（`c/*` の import・型の名前の解決） | import 先・型の参照                                   | `lwcImport`（`component`）・`lwcType`（`custom`）。型の名前の解決（[lwc-parse-plan.md](./lwc-parse-plan.md) 3.1.5）は未実装                    | ○    |
| 継承・ミックスイン                          | `NavigationMixin(LightningElement)`                   | `extend` / `mixins` は文字列（位置なし）                                                                                                       | △    |

## 5. 改善の候補

| 優先 | 対象 | 内容                                                                                                                                                               | 効く観点 |
| ---- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| 1    | LWC  | メソッド・getter / setter の本体を表す（3.2 の A〜C のどれか）。少なくとも、本体の変更が Diff で見えるようにする                                                   | 1・2・3  |
| 2    | LWC  | `@wire` の `config` の値を構造にし、`fields: [NAME_FIELD]` を `lwcImport.schema` と、`adapter` を `lwcImport.apex` と結び付ける（項目の利用表・Apex の呼び出し表） | 3        |
| 3    | LWC  | imperative な Apex の呼び出しの引数を `lwcCall` に持つ                                                                                                             | 3        |
| 4    | Apex | kind のない式（リテラル・`new`・キャスト・代入）と `variants` の要素に sourceKeys を持たせる（findings の位置を式の単位で指す）                                    | 3        |
| 5    | Apex | sourceObject の `context` を、ANTLR の `getText()` ではなく元のソースの切り出しにする（空白を残す）                                                                | 2        |
| 6    | Apex | `memberAccess.object` の表し方をそろえる（JsonType / 値 / 文字列が混ざる）                                                                                         | 3        |
| 7    | LWC  | export しないモジュール直下の宣言（`const formatter`、補助関数）を表す。`otherExports` は名前だけで位置がない                                                      | 1        |
| 8    | Apex | SOSL の `WITH SNIPPET` のオプション名（`target_length`）を残す                                                                                                     | 1        |

### 5.1 対応結果（2026-11-05）

| 優先 | 対応                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 状態     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| 1    | 3.2 の **B** にした。メソッド・getter / setter・関数に `body`（kind `lwcBody`。本体のブロックの位置と直下の文の数）を持たせた。本体の文字列は sourceObject の `context` が持つ（LWC は空白を残す）。本体が変わると `lwcBody` の objectKey が変わるので、Diff で「本体が変わった」ことと前後のソースを示せる。あわせて `lwcCall` に `dispatchEvent` と `innerHTML`（`innerHTML` / `outerHTML` への代入）を足した（ルール違反の検出用）                                                                                                | 対応     |
| 2    | `@wire` の設定の項目を `lwcWireConfig`（JsonType）にし、値の中で使っている import を `references`（`local` / `source` / `schema` / `apex`）に持たせた。`fields: [NAME_FIELD, INDUSTRY_FIELD]` は `Account.Name` / `Account.Industry` と結び付く。Apex のアダプターは `wire.apex`（`{ className, methodName }`）に解決する。フィールドの初期値（`@api title = TITLE_LABEL`）も `references` を持つ                                                                                                                                    | 対応     |
| 3    | `lwcCall` に `arg`（引数の式の文字列）と `references`（引数の中の import）を持たせた（`deleteAccount({ recordId })` の `{ recordId }`）                                                                                                                                                                                                                                                                                                                                                                                              | 対応     |
| 4    | kind のない式（リテラル・`new`・キャスト・算術 / 代入・単項・三項・括弧・配列の添字・`instanceof`）と `VariantJson` に `sourceKeys` を持たせ、sourceObject に位置を残す（`regenerateSourceObjects` も対象にした）。`kind` は持たないので JSON ノードではなく、Diff の値の比較（`getValueKey`）では `sourceKeys` を無視する。位置だけの変更で Diff が `unchanged` のままであることをテストで確認した。`new` の初期化部分の種類は `kind` から `initType` に変えた（`kind` と `sourceKeys` を両方持つと JSON ノードと区別できないため） | 対応     |
| 5    | IR の span の `context` を、ANTLR の `getText()` ではなく元のソースの切り出し（トークンの入力の `getText(start, stop)`）にした。objectKey / sourceKey は `context` を使わないので変わらない                                                                                                                                                                                                                                                                                                                                          | 対応     |
| 6    | 4 により、`memberAccess.object` のうち名前以外の式（JsonType・kind のない式）は、すべて位置を持つ。**名前（識別子）の式は文字列のまま**（`acc.Name` の `acc`）。名前をオブジェクトにすると、Diff の `typeof … === 'string'` の判定をすべて直す必要があるため、今回は見送った。名前の位置は、親の `memberAccess` の位置で指す                                                                                                                                                                                                         | 一部対応 |
| 7    | モジュールの直下の宣言を `declarations`（kind `lwcDeclaration`。StructureJsonType）にした。export しないものも含む（`exported` で区別）。変数は `variableKind`・`init`・`references`、関数（と、関数を初期値にした変数）は `param`・`returnType`・`async`・`body`・`calls`・`events` を持つ。コンポーネントのクラスは含めない。`otherExports` は残した                                                                                                                                                                               | 対応     |
| 8    | 文法上 `SNIPPET` のオプションは `target_length` だけなので、`{ mode: 'SNIPPET', targetLength }` という名前にした（`SPELL_CORRECTION` は `value` のまま）                                                                                                                                                                                                                                                                                                                                                                             | 対応     |

再評価（`evaluate.ts` を再実行）:

| 項目                                       | 対応前                                    | 対応後                                                                       |
| ------------------------------------------ | ----------------------------------------- | ---------------------------------------------------------------------------- |
| LWC の識別子（構造化 / 文字列の中 / 欠落） | 87 / 5 / 30（122 中）                     | 94 / 16 / 12（122 中）                                                       |
| LWC の JsonType                            | 145（12 kind）                            | 176（15 kind。`lwcBody` 14・`lwcWireConfig` 5・`lwcDeclaration` 3 が増えた） |
| LWC の getter の本体の変更（3.2）          | objectKey だけが変わり、JSON の中身は同じ | `lwcBody` の objectKey が変わる（中身として見える）                          |
| Apex の位置だけの変更での Diff             | unchanged                                 | unchanged（式・変数の sourceKeys を足しても変わらない）                      |

- LWC で欠落として残る 12 件は、本体の中の処理（`reduce` / `dataset` など）。本体は構造ではなく位置（`lwcBody`）とソースで持つ方針（3.2 の B）なので、意図どおり。本体の処理を構造で解析する（複雑度などのメトリクス）ときは、3.2 の A（Apex の文と同じ粒度）が要る。
- Apex の JSON の形が変わったところ（`initType`・式と変数の `sourceKeys`・`targetLength`）は [apex-json-reference.md](./apex-json-reference.md)、LWC の新しい kind は [lwc-parse-plan.md](./lwc-parse-plan.md) 3.1.6 に書いた。

## 6. 評価の限界

- 識別子の数え方は、正規化した表し方（`INHERITED_SHARING` など）や JSON のフィールド名を「欠落」と数える。表の判定は、欠落した語を 1 つずつ JSON で確かめたもの。
- LWC のサンプルは小さい（7 バンドル・145 ノード）。HTML / CSS / js-meta.xml はまだ JSON にならない。
- Diff の評価はキーの安定性と対応付けのしやすさまで。LWC の Diff の実装はまだないので、Apex のような実際の差分の出力は評価していない。
