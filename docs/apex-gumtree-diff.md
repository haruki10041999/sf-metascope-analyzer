# 文・ブロックの Diff 実装方針（GumTree）

メソッド本体などの文の並び（`(StatementJson | ErrorJson)[]`）について、GumTree で要素を対応付け、順序変更や移動を抽出する方針。GumTree 自体のノード差分は内部情報であり、公開 API は JSON プロパティに対応した型付き Diff を返す。対象は [src/analyzer/types/apex/](../src/analyzer/types/apex/) の JsonType / StructureJsonType（[apex-json-reference.md](./apex-json-reference.md)）。

- 宣言（class / method など）の対応付けは今までどおり [apex-declaration-diff.md](./apex-declaration-diff.md) の D（キー対応）で行う。GumTree を使うのは、対応付いた宣言の**本体の中**だけ。
- [apex-statement-diff.md](./apex-statement-diff.md) の LCS + gap の方針は、この文書で置き換える。`objectKey` の性質（同じなら子孫まで同じ）は、そのまま前提として使う。
- status / `match` の語彙は [apex-json-diff-policy.md](./apex-json-diff-policy.md) に合わせ、足りないものだけ追加する（5 章）。

## 1. GumTree を使う理由

今の LCS + gap の方針には、次の限界がある。

| 今の方針の限界                                                                         | GumTree での扱い                                                          |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 対応付けは同じ配列（同じ親）の中だけ。`if` の中に移した文は `removed` + `added` になる | 木全体で対応付けるので、親をまたいだ移動を `moved` として拾える           |
| gap の中は「同じ kind を順に」組にするだけで、似ているかどうかを見ない                 | 子孫の一致の割合（dice 係数）で、似ているもの同士を組にする               |
| 変わった文の中で、どこが変わったか（条件式など）までは出ない                           | 子のノードまで対応付けるので、変わった部分木だけを `changed` として示せる |

## 2. GumTree の概要

GumTree（Falleri et al., 2014）は、2 つの木のノードの対応（mapping）を、次の 3 段階で作る。

| 段階                  | やること                                                                                                                                         | このプロジェクトでの対応                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| 1. Top-down（greedy） | 高さの大きい部分木から順に、**同形（内容が同じ）の部分木**を対応付ける。候補が複数あるときは、親同士の dice 係数が大きいものを選ぶ               | 同形の判定は `objectKey`（ハッシュを新たに作らない）  |
| 2. Bottom-up          | 対応が付かなかった内側のノード（子を持つノード）を後順で見て、ラベルが同じで、対応済みの子孫を多く共有する（dice ≥ `minDice`）ノードと対応付ける | ラベルは 3.2                                          |
| 3. Recovery           | 2 で対応付いた組の中で、まだ対応のない子孫同士を対応付ける                                                                                       | GumTree の simple recovery（LCS ベース）を使う（2.1） |

`dice(t1, t2) = 2 × |t1 の子孫のうち t2 の子孫と対応しているもの| / (|t1 の子孫| + |t2 の子孫|)`

パラメータの初期値は論文の既定値にし、実データで調整する（8 章）。論文の `maxSize`（Recovery を行う部分木の上限）は、最適な木編集距離を使う場合のためのものなので使わない（simple recovery は子の LCS だけなので軽い）。

| パラメータ  | 既定値 | 意味                                                              |
| ----------- | ------ | ----------------------------------------------------------------- |
| `minHeight` | 2      | Top-down で対応付ける部分木の最小の高さ（葉だけの一致は採らない） |
| `minDice`   | 0.5    | Bottom-up で対応付ける dice 係数の下限                            |

### 2.1 Recovery の手順

対応付いた組 (s, d) の、まだ対応のない子同士を次の順で対応付け、最後に「対応付いた子の組で中身が違うもの」に再帰する。

1. hash（同形）の LCS → 部分木ごと対応付ける（`identical`）
2. 形だけの hash（値を見ない `structureHash`）の LCS → その子だけを対応付ける（`recovery`）。中は位置では対応付けず、最後の再帰で 1 から行う（`SELECT Id, Name` → `SELECT Name, Id` を `Id → Name`・`Name → Id` の changed にしないため）
3. 両側で 1 つずつしかないラベルの子 → 対応付ける（`recovery`）
4. 順序のある親なら、残りをラベルの LCS で対応付ける（`recovery`）。GumTree の simple recovery にはない手順で、以前の「gap の中で同じ kind を順に組にする」方針の代わり

順序のない親（6.2）では、1・2 の LCS の代わりに、位置を見ずにキーが同じものを組にする。4 は行わない。

Recovery の後に、もう 1 段階行う。

5. まだ対応のない実ノード（JsonType / StructureJsonType）のうち、同じ hash が両方の木に 1 つずつしかないもの → 部分木ごと対応付ける（`identical`）。`minHeight` 未満の小さな部分木が、別の式の中へ移動したもの（`if (Trigger.isBefore)` → `if (Trigger.isBefore && Trigger.isInsert)`）を `moved` として拾うため。仮想ノードは `'a'` のようなありふれた値が多いので対象にしない

根（メソッド本体の block）同士は宣言の対応で決まっているので最初に対応付け（`slot`）、Top-down は根の子から始める。Recovery は Bottom-up の後に根にも行うので、高さ 1 の文（`break;`、`return x;` など、`minHeight` 未満で Top-down では対応付かないもの）もここで対応付く。

## 3. 木の作り方

GumTree は「ラベル・値・順序付きの子」を持つ木を前提にする。JSON をこの木（`GumTreeNode`）に変換する層を作り、アルゴリズムは JSON の型を知らないようにする。

```ts
type GumTreeNode = {
    id: number; // 木の中での前順の番号
    label: string; // 対応付けてよいかの判定 (3.2)
    values: Record<string, unknown>; // ノード自身のプリミティブ値 (3.3)。違えば「更新」
    hash: string; // 同形の判定 (3.4)
    structureHash: string; // 値を見ない形だけの hash (Recovery で使う)
    role: string; // 親のどのプロパティにあるか (if の condition / block など)。出力用
    ordered: boolean; // 子の順序が意味を持つか (6.2)
    children: GumTreeNode[];
    parent: GumTreeNode | undefined;
    raw: unknown; // 元の値
    source: JsonNode | undefined; // 元の JsonType / StructureJsonType (仮想ノードは undefined)
    height: number;
    size: number;
};
```

### 3.1 ノードの種類

| 元の値                                                                                                                                                | 木の上での扱い                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **JsonType / StructureJsonType**（文・補助ノード・`memberAccess`・SOQL など）                                                                         | **実ノード**。`source` に元の JSON を持つ                                                                                                     |
| `ErrorJson`                                                                                                                                           | 実ノード（葉）。ラベルは `error:${kindType}`                                                                                                  |
| 文の配列（ブロック）`(StatementJson \| ErrorJson)[]`                                                                                                  | 仮想ノード。ラベル `block`                                                                                                                    |
| `kind` を持たない入れ物（`if` の `conditionBlock` の要素、`try` の節、`switch` の `when` の要素、`LocalVariableDeclarationJson`、`VariantJson` など） | 仮想ノード。ラベルは `if.branch` / `try.try` / `try.catch` / `try.finally` / `switch.when`、式の形（3.5）、それ以外は `${親のラベル}.${role}` |
| `kind` を持たない式（`FormulaJson`、`CastJson` など）                                                                                                 | 仮想ノード。ラベルは形から決める式の種類（3.5）                                                                                               |
| `TypeJson`                                                                                                                                            | 実ノードだが**葉**として扱う（ジェネリクスなどの中身は `TypeContentJson` で `kind` を持たないため）。値は `getTypeKey`                        |
| それ以外の配列                                                                                                                                        | 仮想ノード。ラベルは `${親のラベル}.${role}`（例: `if.conditionBlock`、`memberAccess:method.memberArg`）                                      |
| 修飾子（`ModifierJson` / `AnnotationJson`）                                                                                                           | 実ノード（葉）                                                                                                                                |

- 木の根は、比べるブロック 1 つ（メソッド本体など）を表す `block` の仮想ノード。
- 文の配列の仮想ノードは `block` / `body` のプロパティから作る。`try` / `switch` の `block` は節の並びなので除く。
- `ModifiersJson`（`{ access: [...], ... }`）は、分類キーをまたいで 1 つの `modifiers` の仮想ノード（順序なし）にまとめる。
- 文字列・数値・真偽値などのプリミティブは親の `values`（3.3）に入れる。配列は要素を個別の子ノードとして比較し、空配列も配列ノードとして表す。識別子の要素はラベル `name` の葉にする（`foo(a)` → `foo(a, b.c())` でも配列要素の差分形を保つ）。

### 3.2 ラベル

- 実ノードは `kind`。ただし、同じ `kind` で形が大きく違うものは形も含める。
    - `forCondition`: 拡張 for と通常 for で `forCondition:enhanced` / `forCondition:basic`
    - `limitClause` / `offsetClause`: `type`（`literal` / `bind`）を付ける
    - `memberAccess`: `type`（`object` / `method`）を付ける
- 仮想ノードは 3.1 の表のとおり。
- ラベルが違うノード同士は、どの段階でも対応付けない。

### 3.3 値

ノード自身が持つプリミティブのプロパティ（子ノードにならないもの）を `values` に持つ（下の表は `key=value` で書いた例）。対応付いた組の `values` はプロパティごとに型付き `ValueDiff` にして `fields` に出す。配列は `values` にまとめず、要素ごとの子 Diff にする。
例外として `catchCondition.exceptionType` は修飾名を表す配列なので、方針書どおり配列全体を値として比較する。

| ノード                         | 値                                               |
| ------------------------------ | ------------------------------------------------ |
| `break` / `continue`           | `value=break`（ラベル付き break ならそのラベル） |
| `insert` / `update` などの DML | `accessLevel=USER`                               |
| `upsert`                       | `accessLevel=…`（`key` は順序付きの子ノード列）  |
| `memberAccess`                 | `member=foo;operator=.`                          |
| 式 `FormulaJson`               | `operator=+`                                     |
| `catchCondition`               | `exception=e;exceptionType=DmlException`         |

対応付いた組で値だけが違うものは、GumTree の「更新（update）」にあたる。出力では `changed`（`fields` に `ValueDiff`）にする。

### 3.4 ハッシュ（同形の判定）

| ノード     | hash                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------ |
| 実ノード   | `objectKey`（StructureJsonType は `sourceKeys.base.objectKey`）                            |
| 仮想ノード | `${label}(${value})[${子の hash をつないだもの}]` のハッシュ（子から計算する Merkle 方式） |

- `objectKey` は子孫まで含めた内容のハッシュなので、GumTree の「同形」の判定にそのまま使える。
- 仮想ノードの hash も子の hash だけから作るので、「hash が同じなら子孫まで同じ」は保たれる。
- `sourceKey` は hash に使わない（位置がずれただけで変わるため）。

### 3.5 kind を持たない式のラベル

`BaseExpressionJson` のうち `kind` を持たないものは、プロパティの形で種類を決める。

| 形（持っているプロパティ）                  | ラベル                     | 値                              | 子                                     |
| ------------------------------------------- | -------------------------- | ------------------------------- | -------------------------------------- |
| `string`                                    | `name`                     | 文字列そのもの                  | なし                                   |
| `value` + `valueType`（リテラル）           | `literal`                  | `valueType=…;value=…`           | なし                                   |
| `left` + `operator` + `right`               | `formula`                  | `operator=…`                    | `left`, `right`                        |
| `variant` + `operator` + `operatorLocation` | `unary`                    | `operator=…;operatorLocation=…` | `variant`                              |
| `condition` + `trueValue` + `falseValue`    | `ternary`                  | なし                            | `condition`, `trueValue`, `falseValue` |
| `target` + `convertType`                    | `cast`                     | なし                            | `target`, `convertType`                |
| `target` + `operator: 'instanceof'`         | `instanceof`               | なし                            | `target`, `type`                       |
| `value` + `parentheses`                     | `paren`                    | なし                            | `value`                                |
| `variant` + `index`                         | `arrayAccess`              | なし                            | `variant`, `index`                     |
| `collection` + 初期化部分（`new`）          | `new:${初期化部分の kind}` | `collection=…`                  | `generic`, 初期化部分の各要素          |

判定は [expression.ts](../src/analyzer/types/apex/expression.ts) の型に合わせて 1 つの関数（`getExpressionLabel`）にまとめ、型が増えたらここを直す。判定できない形は、ラベル `unknown`・値は `getValueKey` による葉にする（取りこぼしても落ちないようにする）。

## 4. 文ごとの木の形

子の並びは、ソース上の順（下表の左から）にする。

| kind（ラベル）                                                          | 値                            | 子（role）                                                                                                                                                                    |
| ----------------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `if`                                                                    | なし                          | `if.conditionBlock`（仮想の並び）。その子は `if.branch`（仮想）で、branch の子は `ifCondition` と `block`（`else` の branch は値 `condition=else` を持ち、子は `block` だけ） |
| `ifCondition` / `whileCondition` / `doWhileCondition` / `switchVariant` | なし                          | `condition` / `variant`（式）                                                                                                                                                 |
| `for`                                                                   | なし                          | `condition`（`forCondition`）、`block`                                                                                                                                        |
| `forCondition:enhanced`                                                 | `initializer=…`               | `initializeType`、`baseObject`                                                                                                                                                |
| `forCondition:basic`                                                    | なし                          | `initializer`、`condition`、`update`（式の並び。仮想ノード `forCondition.update`）                                                                                            |
| `while` / `doWhile`                                                     | なし                          | `condition`、`body`                                                                                                                                                           |
| `runAs`                                                                 | なし                          | `condition`（`runAsCondition`）、`block`                                                                                                                                      |
| `runAsCondition`                                                        | なし                          | `field`（式の並び）                                                                                                                                                           |
| `switch`                                                                | なし                          | `variant`（`switchVariant`）、`switch.when`（仮想）の並び。各 when の子は `condition`、`block`                                                                                |
| `switchCondition`                                                       | `else` なら `else`            | リテラルの並び（`ordered: false`）または `valueType`                                                                                                                          |
| `try`                                                                   | なし                          | `try.try` / `try.catch` / `try.finally`（仮想）の並び。catch の子は `catchCondition`、`block`                                                                                 |
| `catchCondition`                                                        | `exception` / `exceptionType` | `modifier`                                                                                                                                                                    |
| `localVariable`                                                         | なし                          | `localVariableDeclaration`（仮想）。子は `variant` の並び（variant の値は変数名、子は `init`）、`type`、`modifiers`                                                           |
| `expression` / `throw`                                                  | なし                          | `value`（式）                                                                                                                                                                 |
| `return`                                                                | なし                          | `field`（式。省略時は子なし）                                                                                                                                                 |
| `insert` / `update` / `delete` / `undelete` / `upsert`                  | 3.3                           | `field`（式）                                                                                                                                                                 |
| `merge`                                                                 | `accessLevel`                 | `field`（式の並び。[0] がマスター）                                                                                                                                           |
| `break` / `continue`                                                    | `value`                       | なし                                                                                                                                                                          |
| 入れ子のブロック（配列）                                                | なし                          | 文の並び                                                                                                                                                                      |

`{ }` のない 1 文だけの `for` / `while` / `if` の本体も、要素 1 つの `block` として扱う（`{ }` を付けただけの変更を差分にしないため）。

SOQL / SOSL のノード（`soql`、`selectEntry`、`singleCondition` など）は式の位置に現れるので、同じ規則で実ノードにする。子の並びの順序の扱いは apex-json-diff-policy.md 6.6 の分類に従う（B のものは `ordered: false`）。

## 5. 出力

### 5.1 対応から status へ

GumTree の結果（mapping）から、各ノードの status を次のように決める。編集スクリプト（Chawathe のアルゴリズムによる insert / delete / update / move の列）は、当面は作らない（8 章）。

| 条件                                                                                      | status      | match             |
| ----------------------------------------------------------------------------------------- | ----------- | ----------------- |
| 対応あり・hash が同じ・親同士も対応していて、兄弟の中での順序も保たれている               | `unchanged` | `identical`       |
| 対応あり・hash が同じだが、親同士が対応していない（親をまたいで移動）                     | `moved`     | `identical`       |
| 対応あり・hash が同じで親も対応しているが、兄弟の順序が入れ替わった（`ordered` の親のみ） | `moved`     | `identical`       |
| 対応あり・hash が違う                                                                     | `changed`   | 段階による（5.2） |
| before にだけある                                                                         | `removed`   | -                 |
| after にだけある                                                                          | `added`     | -                 |

- 兄弟の順序は、対応付いた子の並びの LCS で判定する（GumTree の alignChildren と同じ考え方。今の `lcs` を使う）。
- `changed` は値の変化（3.3）と子の変化のどちらか、または両方。値の変化は `fields` に、子の変化は `children` に入れる。
- `moved` で中身も変わったもの（移動し、かつ hash が違う）は、`changed` にして `moved` に移動元（`MovedFrom`）を付ける。
- hash が同じでも、部分木の中が同じ位置どうしで対応していない（中の一部だけが別の場所と対応した）ものは、`changed` として中に入る。

### 5.2 match の追加

| match       | 根拠                             | 確からしさ |
| ----------- | -------------------------------- | ---------- |
| `identical` | Top-down（hash が同じ）          | 確定       |
| `similar`   | Bottom-up（dice ≥ `minDice`）    | 推定       |
| `recovery`  | Recovery（LCS で対応付けた子孫） | 推定       |

`similar` / `recovery` は apex-json-diff-policy.md 4 章の `match` に追加する（`nearest` と同じく推定として扱う）。根本のブロック同士は、宣言の対応で決まっているので `slot`。

### 5.3 型の案

```ts
type GumTreeDiff = {
    label: string;
    role: string;
    sourceKeys: { before?: ConvertKeys; after?: ConvertKeys }; // 仮想ノードは持たない
    index: { before?: number; after?: number }; // 親の中での位置
} & (
    | { status: 'unchanged'; match: Match; value: unknown }
    | { status: 'moved'; match: Match; value: unknown; from: MovedFrom }
    | {
          status: 'changed';
          match: Match;
          moved?: MovedFrom;
          fields: Record<string, OptionalDiff<unknown, ValueDiff<unknown>>>; // 値の変化
          children: GumTreeDiff[]; // 子の差分
      }
    | { status: 'removed'; value: unknown }
    // 移動してきた子孫を含む追加は、children に子の差分を持つ
    | { status: 'added'; value: unknown; children?: GumTreeDiff[] }
);

type MovedFrom = { parent: string; index: number; parentSourceKeys?: JsonNode['sourceKeys'] };

type BlockDiff = GumTreeDiff[]; // 根の block の子 (= 文の並び) の差分
```

- `children` は after の順に並べ、`removed` は before での直前の兄弟の後ろに置く（apex-json-diff-policy.md 5 章と同じ考え方）。
- 移動したノードは、移動先（after の位置）に 1 回だけ出し、`from` に移動元の親（ラベルと位置）を持たせる。移動元には出さない。
- 追加されたノードの中に移動してきた子孫がある（`a();` を新しい `if` で囲んだなど）ときは、`added` に `children` を付けて、その子孫を `moved` として出す。削除されたノードの `value` には、別の場所へ移動した子孫も含まれる。
- `value` は元の JSON から `kind` / `sourceKeys` を除いたもの（`Body`）。仮想ノードは元の値そのもの。

### 5.4 宣言の Diff との接続

- 宣言側は [declaration.ts](../src/analyzer/processor/Apex/diff/declaration.ts) の `makeBlockDiff` を呼び出す。
- `BlockDiff` の型が変わるので、`MethodDeclarationJsonDiff` などの `block` の型は自動で追従する。暫定版 `makeOpaqueBlockDiff` はテスト用に残す。
- 初期化ブロックの判定キー（`getInitializerKey`）は文のキーから作っているので、変更は要らない。

## 6. 補足

### 6.1 計算量

Top-down は O(n²)（n はノード数）、Bottom-up は候補の絞り込み次第で O(n²)。対象をメソッド本体 1 つ分の木に限るので、n は大きくても数千程度と見込む。`objectKey` が同じ根のブロック（本体が変わっていない）は、木を作らずに `unchanged` で打ち切る。

### 6.2 順序を見ない子

`ordered: false` の親（SOQL の SELECT 項目、AND / OR の項、修飾子、`switch` の when のリテラルなど）では、兄弟の順序の入れ替えを `moved` にしない。対応付け自体は GumTree のまま行う。

### 6.3 Top-down で候補が複数あるとき

同形の候補が複数ある（同じ `i++;` が何度も出てくるなど）ときは、次の順で選ぶ。

1. 親同士の dice 係数が大きいもの（GumTree の既定）
2. ソース位置が近いもの（`compareSourceDistance`。`sources` があるとき）
3. 出現順

## 7. 実装状況

### 7.1 GumTree 本体

| 項目                                                                                                               | 場所                                                                                   |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| JSON → `GumTreeNode` の変換（3 章・4 章）。`getExpressionLabel` を含む                                             | [diff/gumtree/tree.ts](../src/analyzer/processor/Apex/diff/gumtree/tree.ts)            |
| Top-down / Bottom-up / Recovery（2 章）                                                                            | [diff/gumtree/matcher.ts](../src/analyzer/processor/Apex/diff/gumtree/matcher.ts)      |
| mapping → `GumTreeDiff` の変換（5 章）                                                                             | [diff/gumtree/diff.ts](../src/analyzer/processor/Apex/diff/gumtree/diff.ts)            |
| 内部配列対応付け `makeGumTreeBlockDiff`。公開文 API `makeStatementDiff` / `makeBlockDiff` は型付き構造 Diff を返す | [diff/statement.ts](../src/analyzer/processor/Apex/diff/statement.ts)                  |
| 単一式の公開 API `makeExpressionDiff`（型付き構造 Diff）                                                           | [diff/expression.ts](../src/analyzer/processor/Apex/diff/expression.ts)                |
| GumTree の内部対応付け結果型                                                                                       | [diff/gumtree/diff.ts](../src/analyzer/processor/Apex/diff/gumtree/diff.ts)            |
| `Match` への `similar` / `recovery` の追加                                                                         | [processor/commons/diff/commons.ts](../src/analyzer/processor/commons/diff/commons.ts) |
| テスト                                                                                                             | test/processor/gumtree-diff.test.ts                                                    |

テストは実際の Apex のソースを変換した JSON で行う（test/converter/helpers.ts の `toJson`）。観点:

- 位置だけが変わったものは `unchanged`（docs/examples/apex-ir/ParserTest.cls 全体でも確認）
- 追加・削除・並べ替え（`moved`）・別のブロックへの移動（`moved` と `from`。移動元に `removed` を出さない）
- 値の変化（`fields`）、Bottom-up による対応（`similar`）、SELECT 項目の並べ替えを `moved` にしない
- ParserTest.cls の全メソッドで、文を逆順にしても `added` / `removed` が出ない

動作検証: [examples/apex-diff/](./examples/apex-diff/README.md) の before / after のサンプルを本番と同じ流れで変換して比べる（`run-diff.ts`）。すべての kind が差分のノードとして現れることを、テスト test/processor/diff-samples.test.ts で確かめる。

### 7.2 JsonType / StructureJsonType ごとの対応状況

| 分類                   | kind                                                                                                                                                                                                                          | 状態                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 宣言                   | `class` / `interface` / `interfaceMethod` / `enum` / `enumConstant` / `method` / `constructor` / `property` / `field` / `notSet`                                                                                              | 済（D / C / B。apex-declaration-diff.md）。本体は GumTree |
| ユニット               | `triggerCase`                                                                                                                                                                                                                 | 済（B）                                                   |
| 修飾子・パラメータ・型 | `modifier` / `annotation` / `parameter` / `type`                                                                                                                                                                              | 済。宣言の中は専用の Diff、文の中は GumTree のノード      |
| 文（19 種）            | `break` / `continue` / `delete` / `doWhile` / `expression` / `for` / `if` / `insert` / `localVariable` / `merge` / `return` / `runAs` / `switch` / `throw` / `try` / `undelete` / `update` / `upsert` / `while`               | 済（専用構造 Diff。GumTree は配列対応付けのみ）           |
| 文の補助ノード（8 種） | `doWhileCondition` / `forCondition` / `ifCondition` / `runAsCondition` / `switchVariant` / `switchCondition` / `catchCondition` / `whileCondition`                                                                            | 済（専用構造 Diff）                                       |
| 式                     | `BaseExpressionJson`（`memberAccess` と kind を持たない formula / literal / cast / call 等の式）                                                                                                                              | 済（`makeExpressionDiff`。式の中の配列は C で位置対応）   |
| SOQL                   | `soql` / `subQuery` / `selectEntry` / `fromField` / `singleCondition` / `groupBy` / `orderField` / `limitClause` / `offsetClause` / `forClause` / `updateClause` / `allRowsClause` / `usingScopeClause` / `categoryCondition` | 済（GumTree。順序なしの並びは 6.2）                       |
| SOSL                   | `sosl` / `soslField`                                                                                                                                                                                                          | 済（同上）                                                |
| エラー                 | `error`                                                                                                                                                                                                                       | 済                                                        |

### 7.3 JsonType ではないもの・接続

| 項目                                                                      | 状態                                                                                                                                                                                             |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initializer`（sourceKeys なし）                                          | 済（クラス本文の C）。本体は GumTree                                                                                                                                                             |
| 匿名 Apex / トリガーの本文（`BlockMemberJson[]`）                         | 済（[diff/unitBody.ts](../src/analyzer/processor/Apex/diff/unitBody.ts) の `makeBlockMembersDiff`）。宣言と ErrorJson は `makeClassBodyDiff`、`kind: 'statement'` の要素（修飾子ごと）は GumTree |
| 匿名 Apex / トリガーのユニット                                            | 済（`makeAnonymousUnitDiff` / `makeTriggerUnitDiff`）。`makeUnitDiffs` から呼ぶ                                                                                                                  |
| field の初期値                                                            | 済。`makeExpressionDiff` で構造比較し、変数の判定キーには木の hash を使う（式の JSON は中に位置を含むため）                                                                                      |
| [unit.ts](../src/analyzer/processor/Apex/diff/unit.ts) の `makeUnitDiffs` | 済。dataType が同じでエラーでないファイルに `content`（`makeUnitContentDiff`）を付ける。中身に変化があれば、ファイルの status も `changed` にする                                                |
| `CompilationUnitJson`（`class` / `interface` / `enum` + `modifier`）      | 済（`makeTypeDeclarationDiff`）。[unit.ts](../src/analyzer/processor/Apex/diff/unit.ts) の `makeClsFileDiff` の結果に `content` として入れる                                                     |

## 8. 未決事項

- パラメータ（`minHeight` / `minDice`）の値。実際の Apex の変更履歴で調整する。
- Recovery を simple（LCS ベース）にするか、最適な木編集距離（RTED / Zhang-Shasha）にするか。まずは simple で始める。
- 編集スクリプト（insert / delete / update / move の列）を出すか。今は status への変換だけで足りる想定。
- メソッドをまたいだ移動（メソッド A の文をメソッド B へ移した）を拾うか。拾うなら、GumTree の根をメソッド単位からクラス単位に広げる必要がある。
- 式の位置の識別子（`name` の葉）の細かさ。`a.b.c` のような連鎖を 1 つの葉にするか、`memberAccess` の入れ子のまま比べるか。
