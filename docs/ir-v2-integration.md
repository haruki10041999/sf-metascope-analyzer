# IR v2 を本来の流れにつなぐ

IR v2（`apex_IR_v2`・`lwc_IR_v2`）を parser から JSON までの流れにつなぎ、v1（`apex_IR`・`lwc_IR`）と置き換えるための方針。IR v2 そのものの決まりは [ir-v2.md](./ir-v2.md)、型の見直しは [ir-v2-types.md](./ir-v2-types.md)。

## 1. 今の流れ

```
ANTLR / Babel
 → v1 の IR（木の中にエラーのノードがある）
 → converter（types/apex/converter・types/lwc/converter）: IR のフィールドを写して CommonType にする
 → makeConvertType（types/apex/commons/convert.ts）: objectKey・sourceKey とソース位置の一覧を付ける
 → JSON 層（types/apex/*.ts・types/lwc/*.ts）: 出力の JSON に組み直す（例: ifStatement → 'if' と conditionBlock）
 → processor（diff・依存関係）・report・保存データ
```

- v1 の IR を直接使うのは、parser の入口（[parser/Apex/source.ts](../src/analyzer/parser/Apex/source.ts)・[parser/Lwc/module.ts](../src/analyzer/parser/Lwc/module.ts)）と converter だけ。
- processor・report が見るのは JSON 層の出力だけ。外に対して守る形は JSON。

## 2. 決めたこと（2026-11-09）

| 決めること               | 決めたこと                                                                                                                                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| つなぎ方                 | **B**: JSON 層が v2 の木を直接読む。CommonType と converter（`converter/nodes.ts` を含む）はなくす                                                                                                                                       |
| JSON の形                | 変えない。JSON の形の見直しは、つないだあとの別の作業                                                                                                                                                                                    |
| 構文エラーのあるファイル | 壊れた部分は木から落ち、エラーは resolvedError だけに出る。JSON の型にある木の中の `\| ErrorJson` は、今は残す（出てこなくなるだけ）。型から消すのは processor の側と一緒にあとで行う。ファイル全体を読めなかったときの ErrorJson は残す |
| キー                     | v2 の木から作る。形は今と同じ `type_ハッシュ`。値は変わるので、保存データの版を上げる                                                                                                                                                    |
| 順番                     | Apex → LWC                                                                                                                                                                                                                               |

案 A（converter で v1 の CommonType の形に戻す）は、v2 で付けた型（`kind` の判別 union など）が JSON 層に届かず、形を変えたノードごとに戻すコードが要るので選ばなかった。

## 3. 進め方

### 3.0 比べる基準（ゴールデン）

- いまの v1 の流れで、サンプル（Apex・LWC）の出力を [test/ir-v2/golden/](../test/ir-v2/golden/) に保存する（[test/ir-v2/make-golden.ts](../test/ir-v2/make-golden.ts)）。
- キー（objectKey・sourceKey）は値が変わるので除く。ソース位置の一覧は、位置と context だけを比べる。
- [test/ir-v2/golden.test.ts](../test/ir-v2/golden.test.ts) が、今の出力とゴールデンを比べる。v2 に切り替えたあとも同じテストで確かめる。
- v2 で直した不具合（SOSL の `FORMAT(...) 別名`、`new X[]` など）は違いとして出る。1 つずつ確かめ、正しいものはゴールデンを作り直して受け入れる（どれを受け入れたかは 4 章に書く）。
- 構文エラーのあるサンプルは、木の形が変わる（壊れた部分を落とす）ので、違いを確かめたうえで受け入れる。

### 3.1 Apex（2026-11-09 済み）

- 入口は [parser/Apex/source.ts](../src/analyzer/parser/Apex/source.ts)。JSON 層は [types/apex/commons/node.ts](../src/analyzer/types/apex/commons/node.ts) の `keysOf`・`structureKeysOf`・`makeNodeJson` でキーを取る。
- ゴールデンの違いは 4 章。テストの [test/converter/helpers.ts](../test/converter/helpers.ts) の `toJson` も v2 の流れにした。v1 のエラーのノードを前提にしたテスト（`json-error-handling`）は、v2 の木から作る形（`json-shapes`）に書き直した。
- まだ v1 の converter・`convertValue`・`excludeError` は残っている（3.4 で消す）。

1. v2 の基底（[commons/ir.ts](../src/analyzer/types/commons/ir.ts)）のキー・ソース位置の作り方を直す（3.3）。
2. 入口（parser/Apex/source.ts）で `buildApexIr` と `listener.irErrors` を使う。
3. JSON 層（types/apex/*.ts）の読む側を、v2 のノード（`getFields()`・`kind`）を受け取るように書き換える。`convertValue`・`excludeError` の、木の中のエラーを調べる処理はいらなくなる。
4. ゴールデンと比べる。

### 3.2 LWC

3.1 と同じ。Babel 8 に合わせて分けたノード（classMethod・classPrivateMethod など）を読む側も合わせる。

### 3.3 v2 の基底のキー・ソース位置（2026-11-09 済み）

今の `CommonTypeClass` は、コンストラクタでノードごとに次を作っている。

- objectKey: 部分木全体をたどってハッシュにする（深い木では同じ部分木を何度もたどる）
- ソース位置の一覧: 子孫の分をすべて自分の一覧に写す

また `sourceKeys` を読む関数がない。今の `makeConvertType` と同じく、木を作り終えたあとに 1 回たどってキーとソース位置の一覧を作る形にする（キーは `type_ハッシュ`、objectKey はフィールドの順に依らない）。

### 3.4 後始末

- 保存データの版を上げる（キーの値が変わるため。古い保存データは読み直しになる）。Apex の分は 3 に上げた。LWC をつないだらもう 1 つ上げる。
- v1（`apex_IR`・`lwc_IR`・converter・`converter/nodes.ts`）と v1 のテスト（`test/apex_IR`・`test/lwc_IR` など）を消す。
- [ir-v2.md](./ir-v2.md) を直す（v1 との比べ方の節など）。

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
