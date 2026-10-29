# apex JSON 生成層（converter 以外）レビュー

対象: [src/analyzer/types/apex](../src/analyzer/types/apex) のうち `converter/` を除くすべて

- `commons/`（convert / excludeError / convertValue / json / source / utils）
- `statement.ts` / `expression.ts` / `declaration.ts` / `modifier.ts` / `primary.ts` / `type.ts` / `param.ts` / `unit.ts`
- `query/`（commons / soql / sosl / select / from / where / with / groupby / orderBy / limit / offset / for / usingScope / allRows / updateList / subQuery / typeof / soqlFunction）

## 確認方法

1. 全ファイルを通読し、既存方針（[apex-commons-refactoring.md](apex-commons-refactoring.md) の方針 A〜D、[apex-json-type-review.md](apex-json-type-review.md) の未対応事項）と突き合わせた。
2. `npx tsc --noEmit -p .` で型エラーを確認した。
3. 実行して確認が必要な指摘（B1〜B3）は、一時スクリプトを `ttsx` で実行して再現を確認した（スクリプトは削除済み）。

### 型チェックの現状

- 対象範囲の型エラーは 5 件で、すべて [commons/source.ts](../src/analyzer/types/apex/commons/source.ts) にある（B4）。
- それ以外の 191 件は対象外（`types/index.ts` の名前衝突、`parser/Apex` の古い参照）。

## サマリ

| 区分 | 件数 | 内容 |
| --- | --- | --- |
| **方針的におかしい部分（要修正）** | 9 | エラー処理の境界、`kind` / `sourceKeys` の有無の混在、子 JSON から識別子を剥がす処理など |
| バグ（動作が誤る） | 10 | うち 3 件は実行して再現を確認 |
| 型と実装の不一致 | 7 | |
| 命名・表記ゆれ | 8 | |
| 冗長・整理 | 10 | |

**最優先で直したいもの**: P1（エラー処理の境界）と P2（ノード表現の統一）。ほかの多くの指摘がこの 2 つの判断に依存する。B1〜B5 は方針に関係なくすぐ直せる。

## 対応状況（2026-10-29 時点）

方針は [apex-json-layer-policy.md](apex-json-layer-policy.md) の 0 章、評価は [apex-json-output-evaluation.md](apex-json-output-evaluation.md) を参照。

| 状況 | 指摘 |
| --- | --- |
| **対応済み** | P1（境界ノードの範囲外のエラーはその位置で `ErrorJson`、境界ノードは `convertValue` で検査）、P4（`StructureJson` は `base` とプロパティ名で位置を持つ）、P8（SOSL の検索語は converter で取り出す）、B1〜B5、B7〜B10、T2〜T5、T7、N1、N2、N4、N6、N7、R1、R6、R8 |
| **一部対応** | P2（宣言・複合文・SOQL / SOSL は `kind` + `sourceKeys` を持つようになった。式などは判別キーなしのまま）、P3（型・catch の修飾子は剥がさなくなった。SOQL 関数の `FORMAT` の `arg` は `type` を剥がしたまま）、P5（`DistributiveOmit` にした。`as unknown as T` のキャストは残る）、P6（`convertValue` の近道と修飾子の判別は `kind` に変えた。select の `isSpecificJsonType` は typia のまま）、P9（JSON 層の `throw` をなくし、`errorKind` を kind と一致させた。`ErrorJson` に原因（`errorCode`）はまだ持たない）、R2、R7、R10 |
| **未対応** | P7（グループ化による順序の消失。評価 10.2）、B6（`a.b()` と `a.b` の区別。評価 10.3）、T1（`ModifiersJson` の型が `sourceKeys` なしになっている）、T6、N3、N5、N8、R3〜R5、R9 |

---

## 1. 方針的におかしい部分（修正対象）

> P1〜P4 と P9 の修正方針は、[apex-json-layer-policy.md](apex-json-layer-policy.md) で具体化した。キーは全ノードではなく境界ノードだけに持たせる。エラーの検査は、境界ノードの部分木全体で行う（本体を持つ宣言・複合文・SOQL / SOSL 全体はノード自身だけ）。以下の「修正方針」より、そちらを優先する。

### P1. エラー処理の境界が 2 系統あり、どちらも意図どおりに動いていない

**現状**

- 入口で `ConvertExcludeError<T>` を受け取る関数: `unit.ts`、`declaration.ts`、`expression.ts`、`primary.ts`、`param.ts`、`makeStatementJson`、`query/soql.ts` / `subQuery.ts` / `select.ts` / `where.ts` など
- ノードごとに `convertValue` を通す関数: `statement.ts` の単文、`type.ts`、`modifier.ts`、`query/*` の各句

**問題**

- `ConvertExcludeError` を受け取った時点で、部分木のエラーはすでに取り除かれている（配列からは削除され、プロパティはキーごと消える）。そのため、その下で `| ErrorJson` を返す型はほとんど到達しない。エラーは何も残らず消える。
- `convertValue` 側は、子孫にエラーが 1 つでもあれば、その **ノード全体** を `ErrorJson` に置き換える設計になっている。たとえば式の奥の 1 か所のエラーで `return` 文全体がエラーになる。
- ただし B1 のとおり判定が浅いため、実際にはこの置き換えも起きず、エラーノードが `process` にそのまま渡る。

**修正方針**

- エラーの粒度を「エラーノードの直近の親で `ErrorJson` にする」に決め、次のようにそろえる。
  - すべての `makeXxxJson` は `ConvertType<T>`（エラーを含みうる型）を受け取る。公開シグネチャから `ConvertExcludeError` をなくす。
  - `convertValue` は「自ノードがエラーか」「自ノードの必須スカラー値がエラーか」だけを見る。子ノードは子の `makeXxxJson` に任せ、子が自分で `ErrorJson` を返す。
  - 入口（unit）で `convertExcludeError` を一括で呼ぶのをやめる。
- これで `BaseExpressionJson | ErrorJson` などの型が実際の出力と一致する。

### P2. `kind` / `sourceKeys` を持つノードと持たないノードが混在している

**現状**

| 表現 | 該当 |
| --- | --- |
| `JsonType`（`kind` + `sourceKeys`） | 単文（break / insert / return …）、条件ノード、query の各句 |
| `type: 'xxx'` のみ（`sourceKeys` なし） | 複合文（if / for / while / doWhile / switch / try / runAs）、宣言（class / method / field …）、`FieldJson`、`SoqlFunctionJson`、`SubQueryJson`、`TypeOfJson` |
| 判別キーなし | 式（`BaseExpressionJson` 全体）、`PrimaryJson`、`ParameterJson`、`LocalVariableDeclarationJson`、unit、`SoqlJson` / `SoslJson`、`SelectJson` / `FromJson` / `WhereJson` / `OrderByJson` |

**問題**

- `StatementJson` のように `kind` を持つものと `type` を持つものが同じ union に入っており、1 つのキーで判別できない。
- 式は判別キーがないため、利用側が構造で推測するしかない（B6 の曖昧さの原因）。`BaseExpressionJson` と `PrimaryJson` の両方に `string` が含まれる。
- `sourceKeys` がないノードはソース位置をたどれない。`regenerateSourceObjects` で再生成した `SourceJson[]` から、式・宣言・複合文の位置が落ちる。
- `{ ...makeFieldJson() }` を `makeJsonType('selectEntry', …)` に展開するなど、`kind` と `type` を 1 つのオブジェクトに同居させる書き方が増えている（select / orderBy）。

**修正方針**

- JSON ノードはすべて `JsonType<kind>`（`kind` + `sourceKeys`）にする。判別は `kind` に一本化する。
- `type` は同じ `kind` の中の細分類（例: `LimitJson` の `literal` / `bind`）に限って使う。
- 式・宣言・複合文にも `kind` を付ける（例: `dotAccess` / `methodCall` / `new` / `cast` / `binary` / `unary` / `ternary` / `instanceof` / `class` / `method` / `if` / `for` …）。

### P3. 子 JSON から `kind` / `sourceKeys` を剥がしている

**該当**

- [type.ts](../src/analyzer/types/apex/type.ts) の配列・List・Set・Map の `elementType` / `keyType` / `valueType`
- [statement.ts](../src/analyzer/types/apex/statement.ts) の catch 句の `modifier`、`ForConditionJson.initializeType`
- [modifier.ts](../src/analyzer/types/apex/modifier.ts) の `ModifiersJson`（型の上だけ。T1 を参照）
- [query/soqlFunction.ts](../src/analyzer/types/apex/query/soqlFunction.ts) の `FORMAT` の `arg`（`type` を剥がす）

**問題**

- `ErrorJson` から `kind` を外すと `{ kindType }` だけが残り、エラーかどうか判別できなくなる。
- 子のソース位置がたどれなくなる。
- 同じ型でも、カスタム型の `generic` は剥がさず List の要素は剥がすなど、扱いがばらばら（T2）。

**修正方針**: 剥がさない。子は子の JSON をそのまま持つ（P2 と一緒に対応する）。

### P4. `StructureJson` / `targetRecords.attributes` の仕組みが機能していない

**問題**

- `attributes` は子ノードの `sourceKeys` を集める想定だが、実装（B2）では自ノード 1 件しか入らない。
- キーが `type` 名なので、同じ型の子が複数あると上書きされる。型は `ConvertKeys | ConvertKeys[]` だが、配列は生成されない。
- 利用箇所は catch 句の 1 か所だけ。その catch 句も、実質的には自ノードのキーを入れているだけになっている。

**修正方針**: P2 で各子ノードが自分の `sourceKeys` を持つなら、`attributes` と `StructureJson` は不要なので削除する。残す場合は、直下の子プロパティ名をキーにして再帰的に集める実装に直す。

### P5. `makeJsonType` が実質的にプロパティの型チェックを止めている

**問題**

- `properties: Omit<T, 'kind' | 'sourceKeys'>` の `Omit` は union に分配されない。そのため `ForConditionJson` や `LimitJson` のような union では、共通キーしか残らず、ほぼ何でも通る。
- 戻り値を `as T` でキャストしているため、誤った形でもエラーにならない（T2 / T3 が検出されない原因）。
- `ForConditionJson` は union に `{}` を含んでいるため、検査がさらに効かない。

**修正方針**

- 分配版の Omit（`T extends unknown ? Omit<T, K> : never`）を使う。
- `as T` を外せる形に直す。
- `ForConditionJson` から `{}` をなくし、空の for は `condition` などを省略可能にして表す。

### P6. 判別に typia の構造検査を使っている（方針 A と不一致）

**該当**

- `isSpicifyConvertExcludeError`（B1 の原因）
- `isModifierJson`（modifier と annotation の判別）
- `isErrorJson`
- `isSpecificJsonType`（select）

**修正方針**: 方針 A のとおり、`target.type === 'xxx'` / `json.kind === 'xxx'` のリテラル比較にする。typia の `createIs` は外部入力の検証用途だけに残す。

### P7. グループ化でソース順が失われている

**該当**

- `ClassDeclarationJson`（field / method / … ごとの配列）
- `SelectJson`（field / soqlFunction / typeOf / subQuery）
- `ModifiersJson`（access / declaration / annotation 種別ごと）
- 宣言を取れなかったメンバーを `notSet: {}[]` として空オブジェクトで残している

**問題**: 元のコードの並び（メンバーの順、SELECT の列順、修飾子の順）を復元できない。`notSet` は個数しか分からない。

**修正方針**

- 出力は「`kind` 付きノードのソース順の配列」を基本にする。分類はビューや解析側で `kind` から導出する。
- グループ形式を残すなら、各要素に元の位置（index）を持たせる。
- `notSet` は `ErrorJson` で表す。

### P8. JSON 層でソース文字列を再解析している

**該当**: [query/sosl.ts:103](../src/analyzer/types/apex/query/sosl.ts#L103) で `FIND` の検索語を正規表現で取り出している。

**問題**

- 文字列内のエスケープ（`\'`）や複数行に弱い。取り出せないときは SOSL 全文が `find` に入る。
- 構文解析の責務が JSON 層に漏れている。

**修正方針**: 検索語は IR / converter で構造として取り出し、JSON 層は値を写すだけにする。

### P9. エラーの表現が統一されておらず、原因が失われる

**問題**

- 同じ層の中で、`throw`（[query/commons.ts:180](../src/analyzer/types/apex/query/commons.ts#L180) の `makeValueJson`）と `ErrorJson` を返す処理が混在している。
- `ErrorJson` には `kindType` しかない。`convertExcludeError` が集めた `errorInfos`（`errorCode` / `contextType`）は捨てられている。
- `convertValue` に渡す `errorKind` と、成功時の `kind` が一致しない箇所がある（N2）。

**修正方針**

- JSON 層は `throw` せず、すべて `ErrorJson` で返す。
- `ErrorJson` に原因（`errorCode` / `contextType`、元ノードの `sourceKeys`）を持たせる。
- `errorKind` は成功時の `kind` と同じ値にする（定数を共有する）。

---

## 2. バグ（動作が誤る）

| # | 場所 | 内容 | 確認 |
| --- | --- | --- | --- |
| B1 | [commons/excludeError.ts:26](../src/analyzer/types/apex/commons/excludeError.ts#L26)、[commons/convertValue.ts:70](../src/analyzer/types/apex/commons/convertValue.ts#L70) | `isConvertExcludeError` は `ConvertExcludeError<CommonType<string>>` の検査なので、`objectKey` / `sourceKey` / `type` の 3 つしか見ない（浅い検査）。そのため、子孫にエラーを含むノードでも先頭の分岐が真になり、エラーノードがそのまま `process` に渡る。後段の `convertExcludeError` は、ノード自体がエラーの場合以外は実行されない | 再現済み: `return` の `value` がエラーのノードで `process` が呼ばれ、`field.type === 'error'` が出力された |
| B2 | [commons/convertValue.ts:19-41](../src/analyzer/types/apex/commons/convertValue.ts#L19-L41) | `_makeStructureSourceKeys` が子プロパティへ再帰しないため、`attributes` には自ノードしか入らない | 再現済み: `attributes` が `{ returnStatement: <base と同じ> }` だけだった |
| B3 | [commons/source.ts:98](../src/analyzer/types/apex/commons/source.ts#L98) | `_gatherSourceKeys` は `JsonType` / `StructureJson` の分岐で `rest` を再帰したあと、末尾のループでも全プロパティを再帰する。各階層で子を 2 回たどるため、計算量が深さに対して指数的に増える。重複したキーも積まれる | 再現済み: 深さ 10 / 14 / 18 でそれぞれ 4 / 15 / 212 ms。深さ 25 前後で数十秒になる見込み |
| B4 | [commons/source.ts:88-91](../src/analyzer/types/apex/commons/source.ts#L88-L91) | `StructureJson.sourceKeys` が `ConvertKeys \| ConvertKeys[]` に変わったのに、`value.objectKey` を直接参照している。配列だと `undefined` がキーになる | tsc エラー 5 件 |
| B5 | [statement.ts:217-228](../src/analyzer/types/apex/statement.ts#L217-L228) | `for (; cond; )` のように init がないと `target.init!.value` で TypeError になる（update がない場合も同じ）。`for (int i = 0; ; i++)` のように条件がないと、else 分岐に入り `{}` を返すため init / update が消える | コード上で確認。`ForControlType` の各フィールドは `\| null` |
| B6 | [expression.ts:61-88](../src/analyzer/types/apex/expression.ts#L61-L88) | フィールド参照 `a.b` と引数なしの呼び出し `a.b()` が区別できない。どちらも `memberArg` が付かない（引数なしの呼び出しでは `param` が `null`）。式に `kind` がない（P2）ことが原因 | 要確認: converter が `()` を `null` にするかどうか |
| B7 | [modifier.ts:207](../src/analyzer/types/apex/modifier.ts#L207) | 修飾子の分類に else がなく、どの分類にも当たらない修飾子は何も残らず捨てられる（アノテーションには `otherAnnotation` がある） | コード上で確認 |
| B8 | [declaration.ts:95](../src/analyzer/types/apex/declaration.ts#L95) | プロパティ名 `constructor` が `Object.prototype.constructor` と衝突する。コンストラクタがないクラスでも `json.constructor` は真になり、`'constructor' in json` も常に真になる | コード上で確認 |
| B9 | [query/commons.ts:179-181](../src/analyzer/types/apex/query/commons.ts#L179-L181) | `makeValueJson` が `valueType === 'error'` で throw する。B1 によりエラーが下に流れてくるため、SOQL の値が 1 つ壊れているだけで変換全体が落ちうる | コード上で確認 |
| B10 | [query/soqlFunction.ts:106-174](../src/analyzer/types/apex/query/soqlFunction.ts#L106-L174) | `DISTANCE` / 座標の引数を `target[0]!` と `as` で決め打ちで取り出している。要素数や型が違っても検出されない | コード上で確認 |

---

## 3. 型と実装の不一致

| # | 場所 | 内容 |
| --- | --- | --- |
| T1 | [modifier.ts](../src/analyzer/types/apex/modifier.ts) `ModifiersJson` | 型は `Omit<ModifierJson, 'sourceKeys'>[]` だが、実際は `sourceKeys` 付きのまま入る。また `Record<string, …>` を展開して返しているため、キー名（`'serializeAnnotation'` など）の誤記が型で検出されない |
| T2 | [type.ts:164-190](../src/analyzer/types/apex/type.ts#L164-L190) | `CustomTypeJson.generic` は型では `Omit<…, 'kind' \| 'sourceKeys'>` だが、実装は剥がさずに返している（List / Map は剥がしている） |
| T3 | [statement.ts:187](../src/analyzer/types/apex/statement.ts#L187) | `ForConditionJson.initializeType` は型では Omit だが、実装は `makeTypeJson` の結果をそのまま入れている |
| T4 | 式・宣言・unit 全般 | `ConvertExcludeError` を受け取る関数の戻り値型に `\| ErrorJson` があるが、到達しない（P1） |
| T5 | [query/soql.ts](../src/analyzer/types/apex/query/soql.ts) / [query/subQuery.ts](../src/analyzer/types/apex/query/subQuery.ts) | `orderBy` が soql では `OrderByJson \| ErrorJson`、subQuery では `OrderByJson`。`makeOrderByJson` は `ErrorJson` を返さない。where も同様 |
| T6 | [modifier.ts:29-46](../src/analyzer/types/apex/modifier.ts#L29-L46) | `ModifierJson.name` は大文字リテラルの union だが、値は IR の文字列をそのまま入れている（`makeJsonType` の `as T` で通っている）。小文字で書かれたソースの場合に型と一致するか要確認 |
| T7 | [statement.ts:253](../src/analyzer/types/apex/statement.ts#L253) | `export const IfConditionJson = typia.createIs<…>()` が型名と同じ名前になっている。`isIfConditionJson` の誤り |

---

## 4. 命名・表記ゆれ

| # | 内容 |
| --- | --- |
| N1 | `kind` 名の末尾に `Json` が付いている: `doWhileConditionJson` / `ifConditionJson` / `whileConditionJson` |
| N2 | `errorKind` と `kind` が一致しない: 条件 3 種の `errorKind` がすべて `'statementCondition'`、`'fieldOrder'`（errorKind）と `'orderField'`（kind） |
| N3 | 句の `kind` で `Clause` の付け方がばらばら: `limitClause` / `offsetClause` / `forClause` / `allRowsClause` / `usingScopeClause` / `updateClause` と、`groupBy` / `fromField` / `soslField` |
| N4 | `type: 'WhileStatement'` だけ先頭が大文字（ほかは `ifStatement` など） |
| N5 | 同じ意味のフィールド名がばらばら: `variantType` と `variantsType`、本体が `body`（while / doWhile）と `block`（for / if ほか） |
| N6 | 誤字: `parentheSize`、`isSpicifyConvert` / `isSpicifyConvertExcludeError`（Specify） |
| N7 | `isWhenJson` が `TypeOfBlockJson` を検査している（[query/typeof.ts:27](../src/analyzer/types/apex/query/typeof.ts#L27)） |
| N8 | 演算子の型: `FormulaJson.operator` の末尾に `\| string` があり、リテラル union の意味がない。しかも `<` `>` `<=` `>=` `<<` `>>` `>>>` が列挙から漏れている。比較演算子の union は `query/commons.ts` と `where.ts` に 3 回コピーされている |

---

## 5. 冗長・整理

| # | 内容 |
| --- | --- |
| R1 | [unit.ts](../src/analyzer/types/apex/unit.ts) の anonymous と trigger のブロック変換が同じ処理（約 40 行ずつ）。共通関数にする |
| R2 | [declaration.ts](../src/analyzer/types/apex/declaration.ts) `makeClassDeclarationJson` で、`push({ ...declaration, modifier: makeModifiersJson(b.modifier) })` が 7 回繰り返されている（P7 と一緒に対応する） |
| R3 | [statement.ts:430-493](../src/analyzer/types/apex/statement.ts#L430-L493) `makeWhenVariantJson` に式の型名 25 個が直書きされている。converter 側の定数から導出する |
| R4 | [query/sosl.ts:46-56](../src/analyzer/types/apex/query/sosl.ts#L46-L56) で if と else が同じ処理になっている |
| R5 | `LogicalConditionJson`（query/commons）と `WhereLogicalExpressionJson`（where）がほぼ同じ構造。`WhereSingleConditionJson` は `kind: 'singleCondition'` が同じなのに `field` の型が違う |
| R6 | `makePropertyDeclarationJson` が副作用目的で `.map` を使っている。`isGetter` / `isSetter` は `getterContent` / `setterContent` の有無と重複している |
| R7 | 未使用の import / 変数: `Convert`、`isConvert`、`convertExcludeError`、`isErrorJson`、`StructureJson`、`ConvertKeys`（param.ts / statement.ts / typeof.ts / soqlFunction.ts など）、`ErrorType`（type.ts）、`let fieldValue`（query/commons.ts）、`isCatchConditionJson` |
| R8 | [type.ts:88](../src/analyzer/types/apex/type.ts#L88) の `recordAttribute` は再帰で渡しているだけで、どこでも使われていない |
| R9 | `OrderByJson = { orderBy: [...] }` のため、利用側では `soql.orderBy.orderBy` になる。`FromJson = { field }`、`WhereJson = { condition }` も 1 段余計に包んでいる |
| R10 | `convertValue` が、使わない場合でも `errorJson` を毎回先に生成している。`makeConvertType` は同期処理なのに async（コメントで意図は明記済み） |

---

## 6. 修正の進め方（提案）

1. **方針を決める**: P1（エラーの粒度と入口）、P2（全ノードを `JsonType` にして `kind` で判別）、P7（順序を保持するか）。ほかの指摘の多くはこの 3 つに従う。
2. **方針に関係なくすぐ直す**: B1〜B5、B7〜B9、T7。B1 は P1 の方針次第で、`convertValue` の判定を `target.type` の比較に変える形になる。
3. **方針に沿って型を作り直す**: P3、P4、P5、P6、T1〜T6。
4. **仕上げ**: 命名（N）、冗長（R）、P8、P9。
5. **検証**: 修正前の出力を [docs/examples](examples) で保存しておき、修正後の差分を確認する。B1 / B3 / B5 / B6 は再発防止のテストを `test/converter/` に追加する。
