# IR v2 を本来の流れにつなぐ（記録）

IR v2 を parser から JSON までの流れにつなぎ、v1 の IR と置き換えたときの方針と記録。2026-11-10 に済んだ（v1・converter は消した）。v2 のフォルダは `apex_IR_v2`・`lwc_IR_v2` から `apex_IR`・`lwc_IR` に名前を変えた。以下の「v2」は今の `apex_IR`・`lwc_IR` のこと。IR そのものの決まりは [ir.md](./ir.md)、型の見直しは [ir-types.md](./ir-types.md)。

## 0. 今の流れ（2026-11-10）

```
ANTLR（ApexCommonErrorListener）/ Babel
 → IR（buildApexIr・buildLwcIr。木の中にエラーのノードはない。作れなかったところ（IrError）はリスナーの resolvedError へ）
 → JSON 層（types/apex/*.ts・types/lwc/*.ts）: IR のノードを getFields()・kind で読み、出力の JSON にする
 → processor（diff・依存関係）・report・保存データ
```

- 入口は [parser/Apex/source.ts](../src/analyzer/parser/Apex/source.ts)（`parseApexSource`）と [parser/Lwc/module.ts](../src/analyzer/parser/Lwc/module.ts)（`parseLwcModule`・`convertLwcModule`）。
- キー: Apex は [types/apex/commons/node.ts](../src/analyzer/types/apex/commons/node.ts) の `keysOf`・`structureKeysOf`・`makeNodeJson`。ソース位置の一覧は `collectSourceObjects`（[types/commons/ir.ts](../src/analyzer/types/commons/ir.ts)）で木から集め、`regenerateSourceObjects` で JSON に残ったものだけにする。LWC は `LwcJsonContext`（[types/lwc/commons.ts](../src/analyzer/types/lwc/commons.ts)）が JSON を作るときにキーと位置の一覧を作る（sourceKey にファイルのパスを含める）。
- 構文エラーのあるファイルでは、リスナーは構文エラーだけを出す（IR のエラーはその結果なので出さない）。
- JSON にエラーのノード（ErrorJson）はない。読めなかったものの理由は resolvedError だけに出る（3.4）。

## 1. 置き換える前の流れ（v1。記録）

```
ANTLR / Babel
 → v1 の IR（木の中にエラーのノードがある）
 → converter（types/apex/converter・types/lwc/converter）: IR のフィールドを写して CommonType にする
 → makeConvertType（types/apex/commons/convert.ts）: objectKey・sourceKey とソース位置の一覧を付ける
 → JSON 層（types/apex/*.ts・types/lwc/*.ts）: 出力の JSON に組み直す（例: ifStatement → 'if' と conditionBlock）
 → processor（diff・依存関係）・report・保存データ
```

- v1 の IR を直接使っていたのは、parser の入口（[parser/Apex/source.ts](../src/analyzer/parser/Apex/source.ts)・[parser/Lwc/module.ts](../src/analyzer/parser/Lwc/module.ts)）と converter だけだった。
- processor・report が見るのは JSON 層の出力だけ。外に対して守る形は JSON。

## 2. 決めたこと（2026-11-09）

| 決めること               | 決めたこと                                                                                                                                                                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| つなぎ方                 | **B**: JSON 層が v2 の木を直接読む。CommonType と converter（`converter/nodes.ts` を含む）はなくす                                                                                                                                                                                               |
| JSON の形                | 変えない。JSON の形の見直しは、つないだあとの別の作業                                                                                                                                                                                                                                            |
| 構文エラーのあるファイル | 壊れた部分は木から落ち、エラーは resolvedError だけに出る。JSON の型にある木の中の `\| ErrorJson` は、今は残す（出てこなくなるだけ）。型から消すのは processor の側と一緒にあとで行う。ファイル全体を読めなかったときの ErrorJson は残す（2026-11-10 に見直し、ErrorJson はすべてなくした。3.4） |
| キー                     | v2 の木から作る。形は今と同じ `type_ハッシュ`。値は変わるので、保存データの版を上げる                                                                                                                                                                                                            |
| 順番                     | Apex → LWC                                                                                                                                                                                                                                                                                       |

案 A（converter で v1 の CommonType の形に戻す）は、v2 で付けた型（`kind` の判別 union など）が JSON 層に届かず、形を変えたノードごとに戻すコードが要るので選ばなかった。

## 3. 進め方

### 3.0 比べる基準（ゴールデン）

- いまの v1 の流れで、サンプル（Apex・LWC）の出力を [test/ir/golden/](../test/ir/golden/) に保存する（[test/ir/make-golden.ts](../test/ir/make-golden.ts)）。
- キー（objectKey・sourceKey）は値が変わるので除く。ソース位置の一覧は、位置と context だけを比べる。
- [test/ir/golden.test.ts](../test/ir/golden.test.ts) が、今の出力とゴールデンを比べる。v2 に切り替えたあとも同じテストで確かめる。
- v2 で直した不具合（SOSL の `FORMAT(...) 別名`、`new X[]` など）は違いとして出る。1 つずつ確かめ、正しいものはゴールデンを作り直して受け入れる（どれを受け入れたかは 4 章に書く）。
- 構文エラーのあるサンプルは、木の形が変わる（壊れた部分を落とす）ので、違いを確かめたうえで受け入れる。

### 3.1 Apex（2026-11-09 済み）

- 入口は [parser/Apex/source.ts](../src/analyzer/parser/Apex/source.ts)。JSON 層は [types/apex/commons/node.ts](../src/analyzer/types/apex/commons/node.ts) の `keysOf`・`structureKeysOf`・`makeNodeJson` でキーを取る。
- ゴールデンの違いは 4 章。テストの [test/converter/helpers.ts](../test/converter/helpers.ts) の `toJson` も v2 の流れにした。v1 のエラーのノードを前提にしたテスト（`json-error-handling`）は、v2 の木から作る形（`json-shapes`）に書き直した。
- このときは v1 の converter・`convertValue`・`excludeError` が残っていた（3.4 で消した）。

1. v2 の基底（[commons/ir.ts](../src/analyzer/types/commons/ir.ts)）のキー・ソース位置の作り方を直す（3.3）。
2. 入口（parser/Apex/source.ts）で `buildApexIr` と `listener.irErrors` を使う。
3. JSON 層（types/apex/*.ts）の読む側を、v2 のノード（`getFields()`・`kind`）を受け取るように書き換える。`convertValue`・`excludeError` の、木の中のエラーを調べる処理はいらなくなる。
4. ゴールデンと比べる。

### 3.2 LWC（2026-11-10 済み）

- 入口は [parser/Lwc/module.ts](../src/analyzer/parser/Lwc/module.ts)。`parseLwcModule` が `buildLwcIr` と `listener.irErrors` を使い、`convertLwcModule` が JSON にする。
- JSON 層（[types/lwc/](../src/analyzer/types/lwc/)）は v2 のノード（`getFields()`・`kind`）を読む。Babel 8 に合わせて分けたノード（classMethod・classPrivateMethod など）を読む側も合わせた。キーとソース位置の一覧は `LwcJsonContext` が作る。
- 回復できない構文エラーのモジュールは null（理由は resolvedError）。モジュールの JSON から `errors` をなくした。
- 確かめたこと: ゴールデンのテスト 39 件がすべて成功（[test/ir/golden.test.ts](../test/ir/golden.test.ts)）。node_modules などの JS / TS 600 ファイルで、置き換える前の流れの出力と比べ、違いは 0。

### 3.3 v2 の基底のキー・ソース位置（2026-11-09 済み）

今の `CommonTypeClass` は、コンストラクタでノードごとに次を作っている。

- objectKey: 部分木全体をたどってハッシュにする（深い木では同じ部分木を何度もたどる）
- ソース位置の一覧: 子孫の分をすべて自分の一覧に写す

また `sourceKeys` を読む関数がない。今の `makeConvertType` と同じく、木を作り終えたあとに 1 回たどってキーとソース位置の一覧を作る形にする（キーは `type_ハッシュ`、objectKey はフィールドの順に依らない）。

### 3.4 後始末（2026-11-10 済み）

- 保存データの版を 4 にした（[parser/commons.ts](../src/analyzer/parser/commons.ts)。Apex の分で 3、LWC と ErrorJson の削除で 4）。古い保存データは読み直しになる。
- v1 を消した: v1 の IR、converter（`types/apex/converter/`・`types/lwc/converter/`。`converter/nodes.ts` を含む）、`types/commons/converter.ts`（`CommonType`・`SourceInfo` など）、`types/apex/commons/` の `convert.ts`・`convertValue.ts`・`excludeError.ts`（`makeConvertType` など）。
- v2 のフォルダの名前を変えた: `apex_IR_v2` → `apex_IR`、`lwc_IR_v2` → `lwc_IR`、`test/ir-v2` → `test/ir`。
- v1 のテスト（`test/apex_IR`・`test/lwc_IR`・`test/converter/convert-exclude-error`・`output-types`）を消した。
- ErrorJson をなくした（`types/commons/json.ts` の `ErrorJson`・`isErrorJson`・`makeErrorJson`、`makeXmlErrorJson`・`makeSpanErrorJson`）。読めなかったものは次のようにし、理由は resolvedError だけに出す。
    - Apex のソース: `{ fileName, fileType: 'error' }`（`content` なし）。`-meta.xml`: `meta` が null。
    - LWC のモジュール・テンプレート・スタイルシート・js-meta.xml: null。バンドルそのもの: `dataType: 'error'`（`BUNDLE_UNREADABLE` / `MAIN_MODULE_NOT_FOUND`）。
    - メタデータの子のファイル: 配列から落とす。単位全体: `dataType: 'error'`（`result.base` は null）。
    - `readXmlRoot` は読めなければ null を返す（理由は `problems` に足す）。修飾子の JSON の `error` の分類もなくした。
- Diff: `ErrorJsonDiff`・`makeErrorJsonDiff`・`ListOrErrorDiff`・`makeListOrErrorDiff` を消した。`'error'` の単位は中身の差分を持たない（`dataType` と `resolvedError` の差分だけ）。
- 文書: `ir-v2.md` → [ir.md](./ir.md)、`ir-v2-types.md` → [ir-types.md](./ir-types.md)、`ir-v2-integration.md` → この文書、`lwc-ir-v2-types.md` → [lwc-ir-types.md](./lwc-ir-types.md)。`lwc-converter-types.md` は消した。ir.md の v1 との比べ方の節を消した。

## 4. ゴールデンの違いとして受け入れたもの

### Apex（2026-11-09）

サンプルの Apex 28 ファイルのうち 23 ファイルは、v1 と同じ JSON だった。違いは次の 3 種類で、受け入れてゴールデンを作り直した。

1. **ソース位置の context が正しくなった**（AccountService.cls・ParserTest.cls、各 1 か所）。context は objectKey ごとに 1 つで、v1 は `for (Account acc : ...)` の `Account acc` の位置に、キーが同じだった別のノードの `Account` を付けていた。v2 はその位置の文字列（`Account acc`）になる。
2. **キーワードを決まった書き方にそろえる**（ParserTest.cls の `USING SCOPE Mine` → `mine`）。Apex・SOQL のキーワードは大文字・小文字を区別しないので、v2 は決まった書き方で持つ。大文字・小文字だけの変更は差分に出なくなる。サンプルにはないが、同じ理由で次も変わる: `ALL ROWS`、WHERE の `FORMULA(...)`、switch の `when null`（`'null'`）。
3. **構文エラーのあるファイル**（Broken.cls・broken.apex）。木の中の ErrorJson がなくなり、壊れた部分を落とした木になる（2 章の決めたこと）。ANTLR の回復で、ソースにない形の文ができることがある（Broken.cls の `Integer x = ;` と次の行の `foo(1, );` が、余分な `;` を読み飛ばして `Integer x = foo(1)` になる。v1 は空の引数がエラーのノードになるので文ごと ErrorJson だった）。構文エラーは resolvedError に出る。

サンプルにはないが、v2 で直した不具合で JSON が変わるもの（JSON 層の書き換えで確かめた）:

- `new X[]`（初期化子なし）: v1 は IR を作るところで例外。v2 は `{ initType: 'array' }`。
- SOSL の `FORMAT(関数) 別名`: v1 は別名を値にして関数を落としていた。v2 は関数の JSON になる（関数のあとの別名は、JSON に欄がないので出さない）。
- `when (-1)`（括弧の中の符号）: v1 は符号を落としていた。v2 は `operator: '-'` を出す。
- 引数のない `System.runAs()`: v1 は例外。v2 は runAsCondition の field が空。
