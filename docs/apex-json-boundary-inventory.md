# JsonType / StructureJson 一覧と呼び出し元

対象: [src/analyzer/types/apex](../src/analyzer/types/apex)（`converter/` を除く）

関連: [apex-json-layer-policy.md](apex-json-layer-policy.md)（設計方針案）

[apex-json-layer-policy.md](apex-json-layer-policy.md) の「境界ノード」（`sourceKeys` を持ち、`convertValue` を通り、エラー時に `ErrorJson` に置き換わるノード）をどれにするか決めるための資料です。現在 `JsonType` / `StructureJson` になっている型をすべて挙げ、それぞれの `make` 関数がどこから呼ばれているかをまとめました。

- 調べ方: `src/` と `test/` のすべての `.ts` から呼び出し箇所を機械的に抽出した（`import` 行は除外）。行番号は 2026-10-29 時点のもの。
- **unit は境界ノードにしない（決定済み）**。unit ごとに JSON ファイルを保存するため。
- **決定（2026-10-29）**: この一覧にあるものを境界ノードとし、それ以外は非境界ノードとした。境界ノードの検査範囲は部分木全体（5 章の入れ子では、親の境界ノードごとエラーになる）。詳細は [apex-json-layer-policy.md](apex-json-layer-policy.md) の 0 章。
- **その後の変更（2026-10-29、評価結果を受けて）**: 宣言（field / method / constructor / class / interface / interfaceMethod / enum / property）、enum の定数、trigger の条件、SOQL / サブクエリ / SOSL 全体、複合文を境界ノードに追加し、内側の型を境界ノードから外した。kind 名も一部変えた（`ifConditionJson` → `ifCondition` など）。**この文書の 1〜5 章は変更前の一覧**で、現在の分類は [apex-json-layer-policy.md](apex-json-layer-policy.md) の 4 章を参照。
- 6 章の論点は、D1（宣言・複合文は境界ノードに追加）、D2（内側の型は非境界）、D3（入れ子は親ごとエラー。本体を持つノードは本体を検査対象外）、D4（SOQL / SOSL 全体は境界ノード）で解消済み。D5〜D7 は未対応。

## 0. 前提: 呼び出し元の分類

以下の表の「呼び出し元」は、次の 2 つに分けて書いています。

- **境界**: 呼び出し元自身が `JsonType` / `StructureJson` を作る `make` 関数。つまり、境界ノードの中にさらに境界ノードがある（入れ子）。
- **非境界**: 呼び出し元がキーを持たない関数（振り分け、グループ化、宣言、unit など）。

入れ子になる箇所は、エラー検査の範囲（どこで検査を止めるか）に直接関わるので、4 章にまとめて挙げています。

---

## 1. 文（statement.ts）

| kind | 型 | make 関数 | 入力型 | 呼び出し元 | 判断 |
| --- | --- | --- | --- | --- | --- |
| `break` | `BreakStatementJson` | `makeBreakStatementJson` | `ConvertType` | 非境界: `makeStatementJson` | |
| `continue` | `ContinueStatementJson` | `makeContinueStatementJson` | `ConvertType` | 非境界: `makeStatementJson` | |
| `delete` | `DeleteStatementJson` | `makeDeleteStatementJson` | `ConvertType` | 非境界: `makeStatementJson` | |
| `insert` | `InsertStatementJson` | `makeInsertStatementJson` | `ConvertType` | 非境界: `makeStatementJson` | |
| `update` | `UpdateStatementJson` | `makeUpdateStatementJson` | `ConvertType` | 非境界: `makeStatementJson` | |
| `upsert` | `UpsertStatementJson` | `makeUpsertStatementJson` | `ConvertType` | 非境界: `makeStatementJson` | |
| `undelete` | `UndeleteStatementJson` | `makeUndeleteStatementJson` | `ConvertType` | 非境界: `makeStatementJson` | |
| `merge` | `MergeStatementJson` | `makeMergeStatementJson` | `ConvertType` | 非境界: `makeStatementJson` | |
| `return` | `ReturnStatementJson` | `makeReturnStatementJson` | `ConvertType` | 非境界: `makeStatementJson` | |
| `throw` | `ThrowStatementJson` | `makeThrowStatementJson` | `ConvertType` | 非境界: `makeStatementJson` | |
| `expression` | `ExpressionStatementJson` | `makeExpressionStatementJson` | `ConvertType` | 非境界: `makeStatementJson` | |
| `localVariable` | `LocalVariableStatementJson` | `makeLocalVariableStatementJson` | `ConvertType` | 非境界: `makeStatementJson` | |

**論点**

- すべて、1 か所（`makeStatementJson`）から呼ばれている。
- `makeStatementJson` は `ConvertExcludeError` を受け取るため、ここに届く時点でエラーはすでに取り除かれている。各関数の `convertValue` のエラー経路は、今は実行されない。
- `makeStatementJson` の呼び出し元は、次の関数。
  - 宣言: `makeMethodDeclarationJson`、`makeClassDeclarationJson`（初期化ブロック）、`makePropertyDeclarationJson`（getter / setter）、`makeConstructorDeclarationJson`
  - 複合文: doWhile / for / if / runAs / switch / try（×3） / while
  - unit: anonymous / trigger
  - `makeStatementJson` 自身（ブロック `{ }` の再帰）
- `localVariable` は内部で `makeLocalVariableDeclarationJson`（非境界）を呼ぶ。この関数は `makeForConditionJson` からも呼ばれる。

## 2. 条件（statement.ts）

| kind | 型 | make 関数 | 入力型 | 呼び出し元 | 判断 |
| --- | --- | --- | --- | --- | --- |
| `ifConditionJson` | `IfConditionJson` | `makeIfConditionJson` | `ConvertType` | 非境界: `makeIfStatementJson` | |
| `whileConditionJson` | `WhileConditionJson` | `makeWhileConditionJson` | `ConvertType` | 非境界: `makeWhileStatementJson` | |
| `doWhileConditionJson` | `DoWhileConditionJson` | `makeDoWhileConditionJson` | `ConvertType` | 非境界: `makeDoWhileStatementJson` | |
| `forCondition` | `ForConditionJson` | `makeForConditionJson` | `ConvertType` | 非境界: `makeForStatementJson` | |
| `runAsCondition` | `RunAsConditionJson` | `makeRunAsConditionJson` | `ConvertType` | 非境界: `makeRunAsStatementJson` | |
| `whenVariant` | `WhenVariantJson` | `makeWhenVariantJson` | `ConvertType` | 非境界: `makeSwitchStatementJson` | |
| `switchCondition` | `WhenConditionJson` | `makeWhenConditionJson` | `ConvertType` | 非境界: `makeSwitchStatementJson` | |
| `catchCondition` | `CatchConditionJson`（**StructureJson**） | `makeCatchConditionJson` | `Convert`（エラー込み） | 非境界: `makeTryStatementJson` | |

**論点**

- 複合文（if / for / while / doWhile / switch / try / runAs）そのものは `type: 'xxxStatement'` で、キーを持たない。キーを持つのは条件部分だけ。
  - 複合文にエラーがあるとき、置き換わるのは条件だけになる。
  - 「if 文全体」へのジャンプはできない。
  - 複合文を境界ノードにするか（policy 4 章の案では `StructureJson`）を、ここで決める必要がある。
- `catchCondition` はエラー込みの `Convert` を受け取る唯一の関数で、`StructureJson` を使っている唯一の箇所。中で `makeModifierJson`（境界）を呼び、結果から `kind` / `sourceKeys` を剥がしている（4 章 N5）。
- `whenVariant` は式（通常は値ノード）を、この位置でだけ境界ノードにしている。「境界かどうかは型ではなく位置で決まる」例。

## 3. 宣言・型・修飾子

| kind | 型 | make 関数 | 入力型 | 呼び出し元 | 判断 |
| --- | --- | --- | --- | --- | --- |
| `type` | `PrimitiveTypeJson` / `CustomTypeJson` / `ArrayTypeJson` / `ListTypeJson` / `SetTypeJson` / `MapTypeJson` | `makeTypeJson` | `ConvertType` | 下表を参照（21 か所） | |
| `parameter` | `ParameterJson` | `makeParameterJson` | `ConvertType` | 非境界: `makeMethodDeclarationJson`、`makeInterfaceDeclarationJson`、`makeConstructorDeclarationJson` | |
| `modifier` | `ModifierJson` | `makeModifierJson` | `ConvertType` | 非境界: `makeModifiersJson` / 境界: `makeCatchConditionJson` | |
| `annotation` | `AnnotationJson` | `makeAnnotationJson` | `ConvertExcludeError` | 境界: `makeModifierJson`（同じ `convertValue` の中で作る） | |

`makeTypeJson` の呼び出し元:

| 区分 | 呼び出し元 |
| --- | --- |
| 宣言（非境界） | method の戻り値型、interface の戻り値型と extends、class の extends と implements、property、field、ローカル変数（`makeLocalVariableDeclarationJson`） |
| 引数（境界） | `makeParameterJson` |
| 式（非境界） | `makeInstanceNameJson`（`new` のジェネリクス）、`makeCastJson`、`makeInstanceofJson` |
| primary（非境界） | `makePrimaryJson`（`typeRefPrimary`） |
| 文の条件（境界） | `makeForConditionJson`（拡張 for の型）、`makeWhenConditionJson`（`when Type var`） |
| 型自身（境界） | `makeTypeJson` の再帰 6 か所（配列の要素型、List / Set の要素型、Map のキー型と値型、カスタム型のジェネリクス ×2） |

**論点**

- `makeTypeJson` は、境界ノードからも値ノード（式・primary）からも呼ばれる。式の中の型だけが位置を持つ形になっている。
- 再帰（policy U2）で、`Map<String, List<Foo>>` のような型では、内側の型もすべて境界ノードになる。ただし配列・List・Set・Map の場合は、内側の `kind` / `sourceKeys` を親が剥がしている（4 章 N6）。結果として、キーを作ってから捨てていることになる。
- `annotation` は独立した境界ではなく、`modifier` の `convertValue` の中で作られる。`kind` が 2 通りある 1 つの境界ノードと見なせる。
- `makeModifiersJson`（非境界）はグループ化するだけの関数。呼び出し元は、宣言（interface / class ×8 / property ×2 / ローカル変数）、`makeParameterJson`、unit ×3。
- `parameter` の呼び出し元はすべて宣言（非境界）。宣言を境界ノードにしない場合、メソッド内でキーを持つ最上位のノードは引数になる。

## 4. SOQL / SOSL（query/）

| kind | 型 | make 関数 | 入力型 | 呼び出し元 | 判断 |
| --- | --- | --- | --- | --- | --- |
| `selectEntry` | `SelectEntryJson` | `makeSelectEntryJson` | `ConvertType` | 非境界: `makeSelectJson` | |
| `fromField` | `FromFieldJson` | `makeFromFieldJson` | `ConvertType` | 非境界: `makeFromJson` | |
| `singleCondition` | `SingleConditionJson` | `makeSingleConditionJson` | `ConvertType` | 非境界: `makeLogicalConditionJson` / 境界: `makeWhereSingleConditionJson` | |
| `singleCondition` | `WhereSingleConditionJson` | `makeWhereSingleConditionJson` | `ConvertType` | 非境界: `makeWhereLogicalExpressionJson` | |
| `groupBy` | `GroupByJson` | `makeGroupByJson` | `ConvertType` | 非境界: `makeSoqlJson` | |
| `orderField` | `FieldOrderJson` | `makeFieldOrderJson` | `ConvertType` | 非境界: `makeOrderByJson`、`makeFieldSpecJson`（SOSL） | |
| `limitClause` | `LimitJson` | `makeLimitJson` | `ConvertType` | 非境界: `makeSoqlJson`、`makeSubQueryJson`、`makeSoslJson`、`makeFieldSpecJson` | |
| `offsetClause` | `OffsetJson` | `makeOffsetJson` | `ConvertType` | 非境界: `makeSoqlJson`、`makeFieldSpecJson` | |
| `forClause` | `ForJson` | `makeForJson` | `ConvertType` | 非境界: `makeSoqlJson`、`makeSubQueryJson` | |
| `usingScopeClause` | `UsingScopeJson` | `makeUsingScopeJson` | `ConvertType` | 非境界: `makeSoqlJson` | |
| `allRowsClause` | `AllRowsJson` | `makeAllRowsJson` | `ConvertType` | 非境界: `makeSoqlJson` | |
| `updateClause` | `UpdateListJson` | `makeUpdateListJson` | `ConvertType` | 非境界: `makeSoqlJson`、`makeSubQueryJson`、`makeSoslJson` | |
| `categoryCondition` | `DataCategorySelectionJson` | `makeDataCategorySelectionJson` | `ConvertType` | 非境界: `makeWithJson`、`makeSoslWithJson` | |
| `soslField` | `SoslFieldJson` | `makeSoslFieldJson` | `ConvertType` | 非境界: `makeFieldSpecJson` | |
| `queryOperator` | `QueryOperatorJson` | なし | - | **未使用**（型と `isQueryOperatorJson` だけがある） | |

**論点**

- SOQL / SOSL 全体（`SoqlJson` / `SubQueryJson` / `SoslJson`）と、select / from / where / orderBy / with の入れ物はキーを持たない。キーを持つのは個々の句と要素だけ。
- クエリの入口は `makePrimaryJson`（式の値ノード）。つまり **SOQL の句の境界ノードは、文の境界ノードの中の式（値ノード）の中** にある（例: `return [SELECT ... LIMIT 1]` の `return` の中に `limitClause` がある）。
- `makeLogicalConditionJson`（非境界）の呼び出し元は、`makeGroupByJson`（having、境界）、`makeFieldSpecJson`（SOSL の where）、`makeWithJson`、自身の再帰。テスト `test/converter/query-commons.test.ts` からも直接呼ばれている。
- `makeSubQueryJson`（非境界）は `makeSelectEntryJson`（境界）と `makeValueJson`（値ノード。`IN (SELECT ...)`）から呼ばれる。サブクエリの select 要素は `makeSubQueryJson` の結果をそのまま返しており、`kind: 'selectEntry'` も `sourceKeys` も付かない。

## 5. 境界ノードの入れ子（エラー検査の範囲に関わる箇所）

境界ノードの中に別の境界ノードがある箇所です。policy 3.4 の方針（検査は子の境界ノードの手前で止める）では、ここが委譲プロパティ（`delegate`）の候補になります。

| # | 親（境界） | 経路 | 子（境界） | 備考 |
| --- | --- | --- | --- | --- |
| N1 | 単文・条件（`return`、`ifConditionJson` など） | 式 → primary → SOQL / SOSL | SOQL の句の各境界 | 値ノード（式）を挟む。プロパティ名で委譲を指定しにくい（6 章 D3） |
| N2 | 単文・条件 | 式（`new` / cast / instanceof） | `type` | 同上 |
| N3 | `localVariable`、`forCondition`、`switchCondition`、`parameter` | 直接、またはローカル変数の宣言 | `type` | プロパティ名で委譲できる（`valueType` など） |
| N4 | `groupBy` | having → 論理条件（非境界） | `singleCondition` | |
| N5 | `catchCondition` | `modifier` 配列 | `modifier` | 子の `kind` / `sourceKeys` を剥がしている |
| N6 | `type` | ジェネリクス・要素型 | `type` | 配列・List・Set・Map では子のキーを剥がしている |
| N7 | `selectEntry` | サブクエリ（非境界） | サブクエリ内の句の各境界 | |
| N8 | `singleCondition`（where 用） | `left` が条件のとき | `singleCondition`（共通） | 同じ kind の境界が 2 重になる。外側の `base` は捨てられる |
| N9 | `modifier` | 同じ `convertValue` の中 | `annotation` | 実質 1 つの境界ノード |
| N10 | `limitClause` / `offsetClause` の bind、`singleCondition` の値 | 式 / サブクエリ | （N1 / N7 と同じ） | |

---

## 6. 決めるときの論点

| # | 論点 | 関係する節 |
| --- | --- | --- |
| D1 | **複合文と宣言を境界ノードにするか**。しない場合、単文 / 条件 / 引数が最上位の境界ノードになる。unit を境界にしないことは決定済みなので、宣言・複合文も境界にしないなら、それらの直下でエラーノードが見つかったときに `ErrorJson` を作る役は振り分け関数（`makeStatementJson` など）が担う（policy 3.7） | 1、2、3 |
| D2 | **`type` の再帰をどこまで境界にするか**（policy U2）。今は境界にしたうえで、配列・List・Set・Map ではキーを剥がしており、一貫していない | 3、N6 |
| D3 | **値ノード（式）をはさむ入れ子をどう委譲するか**（N1、N2）。プロパティ名ではなく「子孫にある境界ノードの型」で止める必要がある。案は 2 つ。(a) 検査の走査で、境界ノードになる型に当たったら止める（式の中の SOQL / 型は常に境界ノードなので、型で判定できる）。(b) 式の中の境界ノードは置き換え先にせず、親の文ごとエラーにする | 5 |
| D4 | **SOQL / SOSL 全体と、その入れ物（select / from / where / orderBy）を境界にするか**（policy U4）。サブクエリの select 要素がキーを持たない問題（N7）もここで扱う | 4 |
| D5 | **修飾子の扱い**。`modifier` / `annotation` は境界のまま、`makeModifiersJson` のグループ化と catch 句の剥がし（N5）をどうするか | 3、N5、N9 |
| D6 | **where 用の `singleCondition` の 2 重化**（N8）と、`LogicalConditionJson` / `WhereLogicalExpressionJson` の統合 | 4 |
| D7 | 未使用の `QueryOperatorJson` を削除するか | 4 |
