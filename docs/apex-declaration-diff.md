# 宣言の Diff 実装方針（class / method / constructor / property / field）

[apex-json-diff-policy.md](./apex-json-diff-policy.md) の 6.1 / 6.2 を実装に落とすための方針。interface / enum は実装済みなので、残りの宣言と、それらをクラス本文としてまとめる部分を扱う。

- 分類（A〜D）、status、`match`、出力の型は apex-json-diff-policy.md に従う。
- 実装は [src/analyzer/processor/Apex/diff/declaration/](../src/analyzer/processor/Apex/diff/declaration/) に置く。

## 1. 対象

| kind                    | JSON の型                                 | 親の中での分類                         | 状態   |
| ----------------------- | ----------------------------------------- | -------------------------------------- | ------ |
| `interface`             | `InterfaceDeclarationJson`（Structure）   | D（キー: 名前）                        | 済     |
| `interfaceMethod`       | `InterfaceMethodJson`（Structure）        | D（キー: 名前 + パラメータ型）         | 済     |
| `enum` / `enumConstant` | `EnumDeclarationJson`（Structure）        | D（キー: 名前）                        | 済     |
| `method`                | `MethodDeclarationJson`（Structure）      | D（キー: 名前 + パラメータ型）         | 未着手 |
| `constructor`           | `ConstructorDeclarationJson`（Structure） | D（キー: パラメータ型）                | 未着手 |
| `property`              | `PropertyDeclarationJson`（Structure）    | D（キー: 名前）                        | 未着手 |
| `field`                 | `FieldDeclarationJson`（JsonType）        | D（キー: 変数名の並び）                | 未着手 |
| `initializer`           | `InitializerBlockJson`（sourceKeys なし） | C（初期化ブロックだけの並び）          | 未着手 |
| `notSet`                | `NotSetBlockJson`（JsonType）             | B                                      | 未着手 |
| `class`                 | `ClassDeclarationJson`（Structure）       | A（ユニット直下）/ D（入れ子のクラス） | 未着手 |

## 2. 先に決めておく課題

型定義（[declaration.ts](../src/analyzer/types/apex/declaration.ts)）を確認して分かった、方針表だけでは決まらない点。

### 2.1 クラスメンバーの修飾子は `objectKey` に入っていない

`ClassDeclarationJson.block` の要素は `{ ...declaration, modifier }` の形で、`modifier` はメンバーの宣言ノードの外（`classBodyDeclaration`）から付け足されている。`objectKey` はメンバーの宣言ノードのものなので、**修飾子だけが変わったメンバーは `objectKey` が一致し、今の `makeNodeDiff` では `unchanged` になってしまう**（`public` → `private` を見逃す）。

対応:

- 一致の判定キー（identity）を差し替えられるようにする。クラスメンバーでは次の値を使う。
    - `memberIdentity = objectKey + '|' + 修飾子の objectKey をソートして連結したもの`
- [diff/commons.ts](../src/analyzer/processor/Apex/diff/commons.ts) の `makeNodeDiff` / `makeKeyedDiff` / `makeSetDiff` に、省略可能な `identity`（既定は `getObjectKey`）を追加する。
- 修飾子の差分は、メンバーの差分の `fields` には入れず、外側に `modifier: ModifierDiff[]` として持たせる（3.2）。こうすると、既存の `InterfaceDiff` / `EnumDiff` をクラスメンバーとしてそのまま使える。

なお `interfaceMethod` の `modifier` はノード自身の子なので `objectKey` に含まれており、この問題はない。

### 2.2 `initializer` は `kind` はあるが `sourceKeys` がない

`InitializerBlockJson` は `JsonNode` ではないので、`getObjectKey` も `makeDistance` も使えない。

対応:

- 判定キーは `isStatic` + 修飾子の `objectKey` + 文の `objectKey` の並びから作る（apex-statement-diff.md 4.1 の、ブロックのキーの作り方と同じ）。
- 対応付けは `pairAsSequence` を直接使う（C）。gap 内の組は距離なしで位置順（`match: 'slot'`）にする。
- 出力は `sourceKeys` を持たない専用の型 `InitializerDiff` にする。index は「クラス本文の中の index」で持つ（初期化ブロックだけを数えた index ではない）。

### 2.3 文の Diff（`makeStatementDiff`）がまだない

method / constructor / property のアクセサ / initializer はどれも文の並び `(StatementJson | ErrorJson)[]` を持つ。文の Diff を待つと宣言の Diff が進まない。

対応:

- 宣言側は、文の並びの差分を declaration/commons.ts の `makeBlockDiff`（型は `BlockDiffer`）経由でだけ呼ぶ。差し替える場所はここ 1 か所にする。

    ```ts
    type BlockDiffer = (
        before: (StatementJson | ErrorJson)[],
        after: (StatementJson | ErrorJson)[],
        sources?: Sources,
    ) => BlockDiff;
    ```

- 当初は暫定版 `makeOpaqueBlockDiff` を使っていた（今は GumTree 版 `makeGumTreeBlockDiff`。apex-gumtree-diff.md）。暫定版は、文のキー（入れ子のブロックは子のキーの並び）で C を取り、`changed` の組は中に入らずに `before` / `after` を丸ごと持つ。
- `makeStatementDiff` ができたら、`makeBlockDiff` と出力の型 `BlockDiff` をそちらに差し替える。宣言側の呼び出しは変えない。

### 2.4 任意項目（`?`）が「無い」ことに意味がある

| プロパティ                                 | 無いときの意味                                      |
| ------------------------------------------ | --------------------------------------------------- |
| `method.block`                             | abstract / インターフェース実装用の宣言（本体なし） |
| `property.getterContent` / `setterContent` | アクセサがない                                      |
| `AccessorContentJson.block`                | `get;` の自動実装（`{ }` の空本体とは別物）         |
| `class.extend`                             | 継承なし                                            |

`makeListOrErrorDiff` は `undefined` を `[]` として扱うので、「本体なし」と「空の本体」を区別できない。そこで commons.ts に `makeOptionalDiff` を追加する。

```ts
type OptionalDiff<T, D> =
    | D // 両方ある: 中の差分
    | { status: 'added'; value: T }
    | { status: 'removed'; value: T }
    | { status: 'unchanged'; value: undefined }; // 両方ない
```

### 2.5 `VariantJson`（field の変数）は `JsonNode` ではない

`{ name, init? }` だけで `kind` / `sourceKeys` がないので、`makeKeyedDiff` は使えない。また `init` の式（`BaseExpressionJson`）も、文字列など `kind` を持たないものを含む。

対応:

- 変数は `pairByKey` を直接使い、変数名で対応付ける（名前が `ErrorJson` のものは集合として比べる）。
- `init` は `isSameValue` で比べる（`kind` を持つ式は `objectKey`、それ以外は `JSON.stringify`）。式の中までは比べない（apex-json-diff-policy.md 6.4）。

## 3. 共通部品

### 3.1 [diff/commons.ts](../src/analyzer/processor/Apex/diff/commons.ts) に足すもの

| 追加                                | 用途                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| `identity` オプション               | `makeNodeDiff` / `makeKeyedDiff` / `makeSetDiff` の一致判定キーを差し替える（2.1） |
| `makeOptionalDiff` / `OptionalDiff` | 任意項目の有無の変化（2.4）                                                        |

### 3.2 新規 `diff/declaration/commons.ts`

| 関数・型                       | 内容                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `getSignatureKey(name, param)` | `名前(型キー,型キー,...)`。interface.ts の `getInterfaceMethodKey` から移し、method / constructor でも使う |
| `getMemberKey(member)`         | クラスメンバーの識別キー（4.6）                                                                            |
| `getMemberIdentity(member)`    | 2.1 の判定キー                                                                                             |
| `BlockDiffer` / `BlockDiff`    | 文の並びの差分の差し替え口（2.3）                                                                          |
| `makeOpaqueBlockDiff`          | GumTree を使わない簡易版（比較用）                                                                         |
| `ClassMemberDiff<D>`           | `D & { modifier: ModifierDiff[] }`。クラスメンバーの差分に修飾子の差分を足した形                           |

## 4. 型ごとの設計

`fields` の中身を示す。どれも `NodeDiff<kind, Json, Fields>` で、判定順は apex-json-diff-policy.md 3.2 に従う。

### 4.1 method（`diff/declaration/method.ts`）

| プロパティ   | 差分                                                                     |
| ------------ | ------------------------------------------------------------------------ |
| `name`       | `ValueDiff<string \| ErrorJson>`                                         |
| `returnType` | `TypeWithVoidDiff`（interfaceMethod と同じ）                             |
| `param`      | `ListOrErrorDiff<ParametersDiff, …>`（C）                                |
| `block`      | `OptionalDiff<…, BlockDiff>`（本体の有無が変わると `added` / `removed`） |

- 識別キー: `method:` + `getSignatureKey`。
- 名前かパラメータ型が変われば別のメソッド（`removed` + `added`）。戻り値の型・パラメータ名・本体の変化は `changed`。

### 4.2 constructor（`diff/declaration/method.ts`）

| プロパティ | 差分                                                        |
| ---------- | ----------------------------------------------------------- |
| `name`     | `ValueDiff<(string \| ErrorJson)[] \| ErrorJson>`（丸ごと） |
| `param`    | `ListOrErrorDiff<ParametersDiff, …>`（C）                   |
| `block`    | `BlockDiff`（必須）                                         |

- 識別キー: `constructor:(パラメータ型の並び)`。名前はクラス名と同じはずなのでキーに入れない。

### 4.3 property（`diff/declaration/property.ts`）

| プロパティ                        | 差分                                                     |
| --------------------------------- | -------------------------------------------------------- |
| `name`                            | `ValueDiff<string \| ErrorJson>`                         |
| `variantType`                     | `TypeDiff`（A）                                          |
| `getterContent` / `setterContent` | `OptionalDiff<AccessorContentJson, AccessorContentDiff>` |
| `error`                           | `ErrorJson` の集合（B）                                  |

`AccessorContentDiff` は `{ block: OptionalDiff<…, BlockDiff>; modifier: ModifierDiff[] }`（`get;` ↔ `get { … }` は `block` の `added` / `removed`）。

- `isGetter` / `isSetter` は `getterContent` / `setterContent` の有無と同じ情報なので、差分には持たせない。
- 識別キー: `property:` + 名前。

### 4.4 field（`diff/declaration/field.ts`）

| プロパティ    | 差分                                                 |
| ------------- | ---------------------------------------------------- |
| `variantType` | `TypeDiff`（A）                                      |
| `variants`    | `ListOrErrorDiff<VariantDiff, …>`（変数名で D。2.5） |

`VariantDiff` は `{ name, status, init: OptionalDiff<式, BlockDiff> }`。初期値の式は GumTree で比べる（apex-gumtree-diff.md 7.3）。

- 識別キー: `field:` + 変数名をカンマで連結（`Integer a, b;` → `field:a,b`）。名前がエラーの変数を含む場合はキーなし。
- field は JsonType なので、`objectKey` は初期値まで含めた全体のハッシュ。初期値だけの変更も `changed` で拾える。

### 4.5 initializer（クラス本文の中だけ）

| プロパティ | 差分                  |
| ---------- | --------------------- |
| `isStatic` | `ValueDiff<boolean>`  |
| `modifier` | `ModifierDiff[]`（B） |
| `block`    | `BlockDiff`           |

2.2 のとおり `sourceKeys` を持たない専用の型にする。

### 4.6 class（`diff/declaration/class.ts`）

| プロパティ  | 差分                                            |
| ----------- | ----------------------------------------------- |
| `name`      | `ValueDiff<string \| ErrorJson>`                |
| `extend`    | `OptionalDiff<TypeJson \| ErrorJson, TypeDiff>` |
| `implement` | `ListOrErrorDiff<TypesDiff, …>`（B）            |
| `block`     | `ClassBodyDiff[]`（下記）                       |

クラス本文（`block`）は、要素を 3 つのグループに分けて比べ、結果を 1 つの配列にまとめる。

| グループ                                                                                 | 分類 | キー                                                                         |
| ---------------------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------- |
| 名前のあるメンバー（method / constructor / property / field / class / interface / enum） | D    | `getMemberKey`（`kind:` + 4.1〜4.4 のキー、class / interface / enum は名前） |
| `initializer`                                                                            | C    | 2.2 の判定キー                                                               |
| `notSet` / `ErrorJson`                                                                   | B    | `objectKey`                                                                  |

- キーに `kind` を入れるので、対応付いた組は必ず同じ kind。メンバーの差分は kind で振り分けて、各 `make〇〇Diff` を呼ぶ（`makeClassMemberDiff`）。入れ子のクラスは `makeClassDiff` を再帰で呼ぶ。
- 名前のあるメンバーは、判定キーに `getMemberIdentity` を使う（2.1）。修飾子の差分は `ClassMemberDiff` の `modifier` に入れる。
- 並べ方は B / D と同じ（before の index 順のあとに `added`）。index はクラス本文全体での位置。メンバーの並び順の変化は報告しない。

## 5. 実装の順序

1. commons.ts の拡張（`identity`、`makeOptionalDiff`）と declaration/commons.ts（`getSignatureKey`、`BlockDiffer`、`makeOpaqueBlockDiff`）。interface.ts の `getInterfaceMethodKey` を `getSignatureKey` に置き換える。
2. field / property（文の Diff への依存が小さい）。
3. method / constructor。
4. class（クラス本文の 3 グループ、修飾子、入れ子）。
5. [unit.ts](../src/analyzer/processor/Apex/diff/unit.ts) の `makeClsFileDiff` から `makeClassDiff` を呼ぶ。
6. テスト（test/processor/declaration-diff.test.ts に追加）。観点:
    - 修飾子だけの変更が `unchanged` にならない（2.1）
    - オーバーロードが別メンバーとして対応付く。シグネチャが変わると `removed` + `added`
    - 本体なし ↔ 空の本体、`get;` ↔ `get { }` が区別される
    - 初期化ブロックの入れ替えが `moved` になる
    - `ErrorJson` / `notSet` は集合として比べられる

## 6. 決定事項

- 修飾子の差分は `fields` の外に `modifier` として置く（3.2）。
- `Integer a, b;` → `Integer a; Integer b;` のように宣言を分けた場合や、field ↔ property（`Integer x;` → `Integer x { get; set; }`）の変更は、`removed` + `added` で許容する。
- 匿名 Apex / トリガーの本文（`BlockMemberJson[]`）は、宣言を 4.6 と同じく D、`kind: 'statement'` の要素を文の Diff（C）に分けて比べる。ユニットの Diff に手を入れるときに実装する。

## 7. 実装状況

| ファイル                                                                               | 内容                                                                                                                                 |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [diff/commons.ts](../src/analyzer/processor/Apex/diff/commons.ts)                      | `Identity`（`makeNodeDiff` / `makeSetDiff` / `makeKeyedDiff` の判定キー）、`makeOptionalDiff`、`remapPairings`、`getValueKey` を追加 |
| [declaration/commons.ts](../src/analyzer/processor/Apex/diff/declaration/commons.ts)   | `getSignatureKey` / `getMemberKey` / `getMemberIdentity` / `getInitializerKey`、`makeBlockDiff`（GumTree 版 `makeGumTreeBlockDiff`） |
| [declaration/field.ts](../src/analyzer/processor/Apex/diff/declaration/field.ts)       | field と変数（`makeVariantsDiff`）                                                                                                   |
| [declaration/property.ts](../src/analyzer/processor/Apex/diff/declaration/property.ts) | property とアクセサ                                                                                                                  |
| [declaration/method.ts](../src/analyzer/processor/Apex/diff/declaration/method.ts)     | method / constructor                                                                                                                 |
| [declaration/class.ts](../src/analyzer/processor/Apex/diff/declaration/class.ts)       | class、クラス本文（`makeClassBodyDiff`）、クラスメンバー（`makeClassMemberDiff`）、initializer                                       |
| interface.ts / enum.ts                                                                 | `getSignatureKey` を使うように変更。クラスメンバーとして使うため `identity` 引数を追加                                               |
| [unit.ts](../src/analyzer/processor/Apex/diff/unit.ts)                                 | `makeClsFileDiff` の結果に `content`（`makeTypeDeclarationDiff`）を追加                                                              |

テストは test/processor/class-diff.test.ts。
