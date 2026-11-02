# Apex JSON の Diff 実装方針（JsonType / StructureJsonType）

[src/analyzer/types/apex/](../src/analyzer/types/apex/) の `kind` / `sourceKeys` を持つ JSON（[apex-json-reference.md](./apex-json-reference.md) の全種類）について、変更前（`before`）と変更後（`after`）の差分をどう取るかの方針をまとめる。

- 文の並び `(StatementJson | ErrorJson)[]` の差分は [apex-statement-diff.md](./apex-statement-diff.md) に従う。この文書はそれ以外の型と、全体で揃えるルールを扱う。
- 実装は [src/analyzer/processor/Apex/diff/](../src/analyzer/processor/Apex/diff/) に置く。

## 1. 前提

| キー        | 性質                                                                                          | Diff での使い方                                  |
| ----------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `objectKey` | 子孫を含む内容のハッシュ。位置・空白・コメントでは変わらない。同じ内容なら重複しうる          | **一致の判定**に使う                             |
| `sourceKey` | ソース位置を含むハッシュ。位置がずれると変わる                                                | 判定には使わない。`findSourceInfo` で位置を引く  |
| ソース位置  | `findSourceInfo` で引いた `start` / `end`。`getSourceDistance` で before / after の距離を測る | 対応付けの**推定**（同じ kind の組を選ぶ）に使う |

- `objectKey` が一致すれば子孫まで同じなので、中に入って比べない（`unchanged` で打ち切る）。
- before と after は別ファイルなので、距離は近似。距離で決めた対応付けは「推定」として扱う（4章）。

## 2. 比較の分類

各ノード（およびノードが持つ配列・プロパティ）を、次の 4 つのどれで比べるかを決める。

| 分類              | 対応付けの方法                                                                         | 順序の変化                           | 使う status                                               |
| ----------------- | -------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| **A. 単体**       | 親が対応付けを決めて 1 対 1 で渡す（固定のプロパティ、固定位置のスロット）             | 対象外                               | `unchanged` / `changed`（任意項目は `added` / `removed`） |
| **B. 集合**       | `objectKey` の一致だけで対応付ける（重複は個数で数える）                               | **見ない**（index は情報として持つ） | `unchanged` / `added` / `removed`                         |
| **C. 順序付き列** | `objectKey` の並びの LCS で対応付け、LCS の間（gap）で同じ kind のものを距離で組にする | **見る**                             | `unchanged` / `moved` / `changed` / `added` / `removed`   |
| **D. キー対応**   | 識別キー（名前・シグネチャなど）で対応付ける                                           | 見ない（必要なものだけ C を併用）    | `unchanged` / `changed` / `added` / `removed`             |

判断の基準:

- **順序が意味を持つか**で B と C を分ける。入れ替えで動作やシグネチャが変わるもの（パラメータ、catch 節、ORDER BY など）は C。変わらないもの（修飾子、implements、AND / OR の項など）は B。
- **要素に名前があって同一性が名前で決まるか**で D を選ぶ（クラスのメンバー、enum 定数など）。名前が変われば別物（`removed` + `added`）とする。
- B では `changed` を作らない。順序にも名前にも同一性の手がかりがないので、組にする根拠がないため。

## 3. status

### 3.1 語彙

| status      | 意味                                                           | 使う分類  |
| ----------- | -------------------------------------------------------------- | --------- |
| `unchanged` | `objectKey` が一致（内容が同じ）。位置がずれただけのものを含む | 全分類    |
| `changed`   | 対応付いたが内容が違う。子の差分を持つ                         | A / C / D |
| `added`     | after にだけある                                               | 全分類    |
| `removed`   | before にだけある                                              | 全分類    |
| `moved`     | 順序付き列で、内容は同じだが前後関係が変わった                 | C のみ    |

- 削除は `removed`、追加は `added` に揃える（[unit.ts](../src/analyzer/processor/Apex/diff/unit.ts) の `'add'`、interface.ts の `stats` は直す）。
- 順序付き列で LCS に入らなかった `objectKey` 一致の組は、`unchanged` ではなく `moved` にする。パラメータの入れ替えなど、順序の変化そのものが意味の変更になるため。

### 3.2 ノードの判定順

1 組のノード（`before`, `after`）は次の順で判定する。

| 条件                                                            | 結果                                                              |
| --------------------------------------------------------------- | ----------------------------------------------------------------- |
| `objectKey` が一致                                              | `unchanged`（中には入らない）                                     |
| 両方 `ErrorJson`                                                | `objectKey` が違えば `changed`（`before` / `after` に値を丸ごと） |
| 片方だけ `ErrorJson`、または `kind` / 形式（`type` など）が違う | `changed`（`before` / `after` に値を丸ごと）                      |
| 同じ `kind` / 形式                                              | `changed`（プロパティごとの差分を持つ）                           |

- 今の `makeTypeDiff` / `makeParameterDiff` は「両方 `ErrorJson` なら常に `unchanged`」としているが、`objectKey` で判定するように揃える。
- `X[] | ErrorJson` のような「配列かエラー」のプロパティは、片方がエラーなら配列の差分を取らずに値を丸ごと `changed` にする。

### 3.3 プロパティの差分

| プロパティの種類                                             | 差分の形                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| プリミティブ値（`string` / `number` / `boolean` / リテラル） | `{ status: 'unchanged'; value }` / `{ status: 'changed'; before; after }` |
| 任意項目（`?`）の有無が変わる                                | `{ status: 'added'; value }` / `{ status: 'removed'; value }`             |
| 子ノード                                                     | 子ノードの Diff（3.2 で判定）                                             |
| 配列                                                         | 2 章の分類に従った要素ごとの Diff の配列                                  |

- `changed` は `before` / `after` を直接持つ形に揃える（今の `PrimitiveTypeContentDiff` は `value: { before, after }`）。

## 4. 対応付けの根拠（match）

対応付いた組（`changed` / `moved`）には、組にした根拠を持たせる。利用側が「確定した対応」と「推定」を区別できるようにするため。

| match       | 根拠                                   | 確からしさ |
| ----------- | -------------------------------------- | ---------- |
| `identical` | `objectKey` が一致                     | 確定       |
| `key`       | 識別キー（名前・シグネチャ）が一致     | 確定       |
| `slot`      | 固定のプロパティ・固定位置（A の単体） | 確定       |
| `nearest`   | 同じ kind のうちソース位置が最も近い   | 推定       |

距離（`getSourceDistance` / `findNearestIndex`）を使うのは次の場面に限る。

- C の gap の中で、同じ kind の要素を組にするとき。
- B / C で `objectKey` が同じ候補が複数あり、どれと組にするかを選ぶとき。

距離にはしきい値を設けることを検討する（離れすぎていれば組にせず `removed` + `added`）。値は実データで決める（未決事項）。

## 5. 出力の型

```ts
type Match = 'identical' | 'key' | 'slot' | 'nearest';
type Body<T> = Omit<T, 'kind' | 'sourceKeys'>;

/** プリミティブ値の差分 */
type ValueDiff<T> = { status: 'unchanged'; value: T } | { status: 'changed'; before: T; after: T };

/** 1 組のノードの差分。Fields はプロパティごとの差分 */
type NodeDiff<K extends string, T, Fields> = {
    kind: K;
    sourceKeys: { before: ConvertKeys; after: ConvertKeys };
} & (
    | { status: 'unchanged'; value: Body<T> }
    | { status: 'changed'; match: Match; fields: Fields }
    | { status: 'changed'; match: Match; before: Body<T | ErrorJson>; after: Body<T | ErrorJson> }
);

/** 配列の要素の差分（B / C / D） */
type ListItemDiff<K extends string, T, D> =
    | (D & { index: { before: number; after: number } })
    | {
          kind: K;
          status: 'moved';
          match: Match;
          index: { before: number; after: number };
          sourceKeys: { before: ConvertKeys; after: ConvertKeys };
          value: Body<T>;
      }
    | {
          kind: K;
          status: 'added' | 'removed';
          index: number;
          sourceKeys: ConvertKeys;
          value: Body<T | ErrorJson>;
      };
```

- status ごとに union のメンバーを分ける（`'changed' | 'unchanged'` を 1 つにまとめると `Extract` が `never` になる）。
- 値からは `kind` / `sourceKeys` を除き、`sourceKeys` は `{ before, after }` にまとめる。
- StructureJsonType の `sourceKeys`（`{ base, name, ... }`）もそのまま `before` / `after` に入れる。
- 配列の差分は before の index 順に並べ、`added` は直前の対応付いた要素の後ろに置く（after の index と before の index を混ぜて並べ替えない）。

## 6. 型ごとの方針

表の「分類」はノード自身が親の中でどう比べられるか、「子の比較」は各プロパティの比べ方。

### 6.1 宣言

| kind / 型                        | 分類（親の中で）                                | 子の比較                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `class`（Structure）             | A（ユニット直下）/ D（メンバー、キー: 名前）    | `name`: 値 / `extend`: A / `implement`: **B** / `block`: **D**（6.2） / `modifier`: **B**                                                                                    |
| `interface`（Structure）         | A / D（キー: 名前）                             | `name`: 値 / `extend`: **B** / `block`: **D**（キー: 名前 + パラメータ型の並び） / `modifier`: B                                                                             |
| `interfaceMethod`（Structure）   | D（キー: 名前 + パラメータ型の並び）            | `name`: 値 / `returnType`: A（`'void'` を含む） / `param`: **C** / `modifier`: B                                                                                             |
| `method`（Structure）            | D（キー: 名前 + パラメータ型の並び）            | `name`: 値 / `returnType`: A / `param`: **C** / `block`: 文の Diff（apex-statement-diff.md） / `modifier`: B                                                                 |
| `constructor`（Structure）       | D（キー: パラメータ型の並び）                   | `name`: 値（修飾名の配列を丸ごと） / `param`: **C** / `block`: 文の Diff / `modifier`: B                                                                                     |
| `property`（Structure）          | D（キー: 名前）                                 | `name`: 値 / `variantType`: A / `isGetter` / `isSetter`: 値 / `getterContent` / `setterContent`: A（中の `block` は文の Diff、`modifier` は B） / `error`: B / `modifier`: B |
| `enum`（Structure）              | D（キー: 名前）                                 | `name`: 値 / `members`: **C**（`ordinal()` が並び順で決まるため） / `modifier`: B                                                                                            |
| `enumConstant`                   | C の要素                                        | `name`: 値                                                                                                                                                                   |
| `field`                          | D（キー: 変数名の並び）                         | `variantType`: A / `variants`: D（キー: 変数名。`init` は A） / `modifier`: B                                                                                                |
| `notSet`                         | `objectKey` のみ                                | なし                                                                                                                                                                         |
| `initializer`（sourceKeys なし） | C（クラス本文の中の初期化ブロックだけを並べる） | `isStatic`: 値 / `block`: 文の Diff / `modifier`: B。キーは子の `objectKey` の並びから作る（apex-statement-diff.md 4.1 と同じ）                                              |

- メソッド・コンストラクタのキーに使うパラメータ型は、`TypeContentJson` を文字列化したもの（`variant` の名前は含めない）。オーバーロードを区別するため。
- 名前やシグネチャが変わったものは `removed` + `added` にする（リネームの推定は未決事項）。

### 6.2 クラス本文（`ClassDeclarationJson.block`）

- D で比べる。キーは `kind` + 6.1 のキー（例: `method:foo(Integer,String)`、`field:count`、`class:Inner`）。
- `initializer` だけは名前がないので、初期化ブロック同士を C で比べる（実行順が意味を持つため）。
- `ErrorJson` / `notSet` は B で比べる。
- メンバーの並び順の変化は報告しない（index は情報として持つ）。

### 6.3 ユニット・修飾子・パラメータ・型

| kind / 型                                        | 分類（親の中で）                                                                                                  | 子の比較                                                                                                                                                                                                                     |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CompilationUnitJson` など                       | ファイル単位（unit.ts の `filePath` で対応）                                                                      | `fileType`: 値 / 本体: A                                                                                                                                                                                                     |
| `triggerCase`                                    | **B**                                                                                                             | `actionType` / `timing`: 値（`objectKey` で十分）                                                                                                                                                                            |
| `modifier` / `annotation`                        | **B**（`ModifiersJson` の分類キーをまたいで 1 つの集合にする）。annotation は名前（大文字小文字を区別しない）で D | `name`: 値 / annotation の `arg`: すべて `key` があれば D（キー: `key`。大文字小文字を区別しない）、なければ値。引数だけが変わった annotation は `changed`（[modifier.ts](../src/analyzer/processor/Apex/diff/modifier.ts)） |
| `parameter`                                      | **C**                                                                                                             | `variant`: 値 / `variantType`: A / `modifier`: B                                                                                                                                                                             |
| `type`                                           | A                                                                                                                 | `type` が違えば丸ごと `changed`。同じなら下の行                                                                                                                                                                              |
| └ `primitive`                                    | -                                                                                                                 | `primitiveType`: 値                                                                                                                                                                                                          |
| └ `custom`                                       | -                                                                                                                 | `customType`: 修飾名の要素を**後ろ揃え**で位置対応（今の実装どおり） / `generic`: **C**（位置が意味を持つ）                                                                                                                  |
| └ `array`                                        | -                                                                                                                 | `elementType`: A / `dimension`: 値                                                                                                                                                                                           |
| └ `list` / `set`                                 | -                                                                                                                 | `elementType`: A                                                                                                                                                                                                             |
| └ `map`                                          | -                                                                                                                 | `keyType` / `valueType`: A                                                                                                                                                                                                   |
| `TypeJson[]`（`implement` / `interface.extend`） | **B**                                                                                                             | 要素は `type`                                                                                                                                                                                                                |

- `makeModifierDiff` は今の実装（`objectKey` で対応、`added` / `removed` / `unchanged`）が B の方針どおり。
- `makeParmatersDiff` / `makeTypesDiff` は今は「`objectKey` 一致 → 距離」で対応付けているが、パラメータは C（LCS + gap 内で距離）に、`implement` / `extend` は B（距離で `changed` を作らない）に寄せる。

### 6.4 式

| kind / 型                             | 分類 | 子の比較                                                              |
| ------------------------------------- | ---- | --------------------------------------------------------------------- |
| `memberAccess`（`DotMethodCallJson`） | A    | `type` / `operator` / `member`: 値 / `object`: A / `memberArg`: **C** |
| `memberAccess`（`MethodCallJson`）    | A    | `member` / `ref`: 値 / `memberArg`: **C**                             |
| kind を持たない式                     | A    | 当面は `objectKey` の一致だけを見る（中までは比べない）               |

- 式の中まで比べるかは、文の Diff の未決事項（条件式のどこが変わったか）と合わせて決める。

### 6.5 文

文の並びと文の中は GumTree で比べる（[apex-gumtree-diff.md](./apex-gumtree-diff.md)）。下の表は、GumTree の木を作るときの子の順序（C は `ordered`、B は `ordered: false`）の参考として残す。

| kind                                                                    | 子の比較                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `ifCondition` / `whileCondition` / `doWhileCondition` / `switchVariant` | A（条件の式）                                                                                                  |
| `forCondition`                                                          | A。拡張 for と通常 for で形が違えば丸ごと `changed`。通常 for の `update` は **C**                             |
| `runAsCondition`                                                        | `field`: C                                                                                                     |
| `switchCondition`                                                       | `'else'` / リテラル / 型で形が違えば丸ごと `changed`。リテラル配列は **B**（`when 1, 2` の順は意味を持たない） |
| `if` の `conditionBlock`                                                | **C**（上から順に評価されるため）                                                                              |
| `switch` の `block`                                                     | C（`when else` は最後に置く必要がある）                                                                        |
| `try` の `block`                                                        | **C**（catch は上から順に照合されるため）                                                                      |
| `catchCondition`（Structure）                                           | `exception`: 値 / `exceptionType`: 値（修飾名の配列を丸ごと） / `modifier`: B                                  |
| `merge`                                                                 | `field`: 位置のスロット（[0] がマスター、[1] が重複）として A                                                  |
| `insert` / `update` / `upsert` / `delete` / `undelete`                  | `field`: A / `accessLevel`: 値（任意項目） / `upsert.key`: 値                                                  |
| `localVariable`                                                         | `variable` の `variants`: D（キー: 変数名） / 型: A                                                            |
| `return` / `throw` / `expression` / `break` / `continue`                | 値・式: A                                                                                                      |

### 6.6 SOQL / SOSL

| kind / 型                            | 分類（親の中で）    | 子の比較                                                                                                                                 |
| ------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `soql` / `subQuery`                  | A                   | 各句: A（句の有無の変化は `added` / `removed`）                                                                                          |
| `selectEntry`（SELECT の項目）       | **B**               | 項目の並び順は結果に影響しない。`alias`: 値。サブクエリは `subQuery` として A                                                            |
| `fromField`                          | **C**               | 先頭が主オブジェクトなので順序を見る。`field`: 値 / `alias`: 値                                                                          |
| WHERE / HAVING の論理式              | A                   | AND / OR の項は **B**、NOT の項は A                                                                                                      |
| `singleCondition`                    | A / B（論理式の項） | `field` / `operator` / `value`: A                                                                                                        |
| `groupBy`                            | A                   | `field`: **C**（ROLLUP / CUBE で集計の順が変わる） / `mode`: 値 / `having`: A                                                            |
| `orderField`（ORDER BY の項目）      | **C**               | `direction` / `nulls`: 値                                                                                                                |
| `limitClause` / `offsetClause`       | A                   | `type` が違えば丸ごと `changed`。`value`: 値または式                                                                                     |
| `forClause` / `updateClause`         | A                   | `value`: **B**                                                                                                                           |
| `allRowsClause` / `usingScopeClause` | A                   | `value`: 値                                                                                                                              |
| `categoryCondition`                  | **B**               | `group` / `selector`: 値 / `category`: B                                                                                                 |
| `sosl`                               | A                   | `find` / `group`: 値 / `fieldSpec`: **C**（RETURNING の順が結果の `List<List<SObject>>` の順になる） / `with`: B / `limit` / `update`: A |
| `soslField`                          | **B**               | `field` / `func`: 値                                                                                                                     |

## 7. 実装状況

共通部品は [diff/commons.ts](../src/analyzer/processor/Apex/diff/commons.ts) にある。

| 関数                                  | 役割                                              |
| ------------------------------------- | ------------------------------------------------- |
| `makeValueDiff`                       | プリミティブ値の差分（3.3）                       |
| `makeNodeDiff`                        | 1 組のノードの差分（3.2 の判定順）                |
| `pairAsSet` / `makeSetDiff`           | B. 集合                                           |
| `pairAsSequence` / `makeSequenceDiff` | C. 順序付き列（LCS → `moved` → gap 内で組にする） |
| `pairByKey` / `makeKeyedDiff`         | D. キー対応（キーを持たない要素は B）             |
| `makeListOrErrorDiff`                 | `T[] \| ErrorJson`（と省略）のプロパティ          |
| `makeDistance`                        | `sources` があれば要素間のソース位置の距離を返す  |

並べ方: C は before の index 順で、`added` は gap の中の `changed` / `removed` の後ろに置く。B / D は before の index 順のあとに `added` を置く。

| 対象                                                                         | 状態                                                                         |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [type.ts](../src/analyzer/processor/Apex/diff/type.ts)                       | 済。`makeTypesDiff` は B、`generic` は C、`dimention` → `dimension`          |
| [modifier.ts](../src/analyzer/processor/Apex/diff/modifier.ts)               | 済（B）                                                                      |
| [parameter.ts](../src/analyzer/processor/Apex/diff/parameter.ts)             | 済（C）                                                                      |
| [interface.ts](../src/analyzer/processor/Apex/diff/declaration/interface.ts) | 済。interface（`extend`: B、`block`: D）と interfaceMethod                   |
| [enum.ts](../src/analyzer/processor/Apex/diff/declaration/enum.ts)           | 済（`members`: C）                                                           |
| [unit.ts](../src/analyzer/processor/Apex/diff/unit.ts)                       | `'add'` → `'added'`、`makeResolvedErrorDiff` の条件の逆転を修正              |
| class / method / constructor / property / field                              | 済。[apex-declaration-diff.md](./apex-declaration-diff.md)（本体は GumTree） |
| 文・式・SOQL / SOSL                                                          | 済（GumTree。[apex-gumtree-diff.md](./apex-gumtree-diff.md) 7 章）           |

## 8. 未決事項

- `moved` を独立した status にするか（C のみ）。apex-statement-diff.md の未決事項と同時に決める。
- 距離のしきい値と、使う指標（`range` → `center` → `start` → `end` の順で比べる今の `compareSourceDistance` でよいか）。
- D でリネームを推定するか（同じ kind の `removed` / `added` を、本体の `objectKey` の一致や距離で組にし `match: 'nearest'` にする）。
- 式の中まで構造の差分を出すか（6.4）。
- 2 章の分類のうち、意味上どちらとも取れるもの（SELECT の項目、クラスのメンバーの並び順）で、順序の変化を情報として出すか。
