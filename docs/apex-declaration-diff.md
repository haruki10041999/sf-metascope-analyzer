# 宣言の Diff 実装方針（class / method / constructor / property / field）

[apex-json-diff-policy.md](./apex-json-diff-policy.md) の 6.1 / 6.2 を実装に落とした内容。宣言 Diff の実装は [declaration.ts](../src/analyzer/processor/Apex/diff/declaration.ts) に集約している。

- 分類（A〜D）、status、`match`、出力の型は apex-json-diff-policy.md に従う。
- 実装は [src/analyzer/processor/Apex/diff/declaration.ts](../src/analyzer/processor/Apex/diff/declaration.ts) に集約する。

## 1. 対象

| kind                    | JSON の型                                 | 親の中での分類                         | 状態 |
| ----------------------- | ----------------------------------------- | -------------------------------------- | ---- |
| `interface`             | `InterfaceDeclarationJson`（Structure）   | D（キー: 名前）                        | 済   |
| `interfaceMethod`       | `InterfaceMethodJson`（Structure）        | D（キー: 名前 + パラメータ型）         | 済   |
| `enum` / `enumConstant` | `EnumDeclarationJson`（Structure）        | D（キー: 名前）                        | 済   |
| `method`                | `MethodDeclarationJson`（Structure）      | D（キー: 名前 + パラメータ型）         | 済   |
| `constructor`           | `ConstructorDeclarationJson`（Structure） | D（キー: パラメータ型）                | 済   |
| `property`              | `PropertyDeclarationJson`（Structure）    | D（キー: 名前）                        | 済   |
| `field`                 | `FieldDeclarationJson`（JsonType）        | D（キー: 変数名の並び）                | 済   |
| `initializer`           | `InitializerBlockJson`（sourceKeys なし） | C（初期化ブロックだけの並び）          | 済   |
| `notSet`                | `NotSetBlockJson`（JsonType）             | B                                      | 済   |
| `class`                 | `ClassDeclarationJson`（Structure）       | A（ユニット直下）/ D（入れ子のクラス） | 済   |

## 2. 先に決めておく課題

型定義（[declaration.ts](../src/analyzer/types/apex/declaration.ts)）を確認して分かった、方針表だけでは決まらない点。

### 2.1 クラスメンバーの修飾子は `objectKey` に入っていない

`ClassDeclarationJson.block` の要素は `{ ...declaration, modifier }` の形で、`modifier` はメンバーの宣言ノードの外（`classBodyDeclaration`）から付け足されている。`objectKey` はメンバーの宣言ノードのものなので、**修飾子だけが変わったメンバーは `objectKey` が一致し、今の `makeNodeDiff` では `unchanged` になってしまう**（`public` → `private` を見逃す）。

対応:

- 一致の判定キー（identity）を差し替えられるようにする。クラスメンバーでは次の値を使う。
    - `memberIdentity = objectKey + '|' + 修飾子の objectKey をソートして連結したもの`
- [processor/commons/diff/commons.ts](../src/analyzer/processor/commons/diff/commons.ts) の `makeNodeDiff` / `makeKeyedDiff` / `makeSetDiff` に、省略可能な `identity`（既定は `getObjectKey`）を追加する。
- 修飾子の差分は、メンバーの差分の `fields` には入れず、外側に `modifier: ModifiersJsonDiff` として持たせる（3.2）。こうすると、既存の `InterfaceDeclarationJsonDiff` / `EnumDeclarationJsonDiff` をクラスメンバーとしてそのまま使える。

なお `interfaceMethod` の `modifier` はノード自身の子なので `objectKey` に含まれており、この問題はない。

### 2.2 `initializer` は `kind` はあるが `sourceKeys` がない

`InitializerBlockJson` は `JsonNode` ではないので、`getObjectKey` も `makeDistance` も使えない。

対応:

- 判定キーは `isStatic` + 修飾子の `objectKey` + 文の `objectKey` の並びから作る（apex-statement-diff.md 4.1 の、ブロックのキーの作り方と同じ）。
- 対応付けは `pairAsSequence` を直接使う（C）。gap 内の組は距離なしで位置順（`match: 'slot'`）にする。
- 出力は `sourceKeys` を持たない専用の型 `InitializerBlockJsonDiff` にする。index は「クラス本文の中の index」で持つ（初期化ブロックだけを数えた index ではない）。

### 2.3 文の Diff（`makeStatementDiff`）

method / constructor / property のアクセサ / initializer はどれも文の並び `(StatementJson | ErrorJson)[]` を持つ。文の Diff を待つと宣言の Diff が進まない。

対応:

- 文 1 件の差分は [diff/statement.ts](../src/analyzer/processor/Apex/diff/statement.ts) の `makeStatementDiff`、文の並びは同ファイルの `makeBlockDiff`（型は `BlockDiffer`）を使う。method / constructor / property / initializer は文の並びをこの入口経由で比較する。

    ```ts
    type BlockDiffer = (
        before: (StatementJson | ErrorJson)[],
        after: (StatementJson | ErrorJson)[],
        sources?: Sources,
    ) => BlockDiff;
    ```

- `makeBlockDiff` は GumTree で配列要素を対応付け、型付きリスト Diff を返す（[apex-gumtree-diff.md](./apex-gumtree-diff.md)）。GumTree の内部ノード差分は公開しない。`makeOpaqueBlockDiff` は比較用に残す。

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
- `init` は [diff/expression.ts](../src/analyzer/processor/Apex/diff/expression.ts) の `makeExpressionDiff` で構造比較する。変数の対応付けには式を木にした hash を使う（JSON 内のソース位置に影響されない）。

## 3. 共通部品

### 3.1 [processor/commons/diff/commons.ts](../src/analyzer/processor/commons/diff/commons.ts) に足すもの

| 追加                                | 用途                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| `identity` オプション               | `makeNodeDiff` / `makeKeyedDiff` / `makeSetDiff` の一致判定キーを差し替える（2.1） |
| `makeOptionalDiff` / `OptionalDiff` | 任意項目の有無の変化（2.4）                                                        |

### 3.2 `diff/declaration.ts`

| 関数・型                       | 内容                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `getSignatureKey(name, param)` | `名前(型キー,型キー,...)`。interfaceMethod と method / constructor の識別に使う     |
| `getMemberKey(member)`         | クラスメンバーの識別キー（4.6）                                                     |
| `getMemberIdentity(member)`    | 2.1 の判定キー                                                                      |
| `BlockDiffer` / `BlockDiff`    | 文の並びの差分の型（2.3、実装は diff/statement.ts）                                 |
| `makeOpaqueBlockDiff`          | GumTree を使わない簡易版（比較用）                                                  |
| `MemberDeclarationJsonDiff<D>` | `D & { modifier: ModifiersJsonDiff }`。クラスメンバーの差分に修飾子の差分を足した形 |

## 4. 型ごとの設計

`fields` の中身を示す。どれも `NodeDiff<kind, Json, Fields>` で、判定順は apex-json-diff-policy.md 3.2 に従う。

### 4.1 method（`diff/declaration.ts`）

| プロパティ   | 差分                                                                     |
| ------------ | ------------------------------------------------------------------------ |
| `name`       | `ValueDiff<string \| ErrorJson>`                                         |
| `returnType` | `TypeWithVoidDiff`（interfaceMethod と同じ）                             |
| `param`      | `ListOrErrorDiff<ParametersDiff, …>`（C）                                |
| `block`      | `OptionalDiff<…, BlockDiff>`（本体の有無が変わると `added` / `removed`） |

- 識別キー: `method:` + `getSignatureKey`。
- 名前かパラメータ型が変われば別のメソッド（`removed` + `added`）。戻り値の型・パラメータ名・本体の変化は `changed`。

### 4.2 constructor（`diff/declaration.ts`）

| プロパティ | 差分                                                        |
| ---------- | ----------------------------------------------------------- |
| `name`     | `ValueDiff<(string \| ErrorJson)[] \| ErrorJson>`（丸ごと） |
| `param`    | `ListOrErrorDiff<ParametersDiff, …>`（C）                   |
| `block`    | `BlockDiff`（必須）                                         |

- 識別キー: `constructor:(パラメータ型の並び)`。名前はクラス名と同じはずなのでキーに入れない。

### 4.3 property（`diff/declaration.ts`）

| プロパティ                        | 差分                                                         |
| --------------------------------- | ------------------------------------------------------------ |
| `name`                            | `ValueDiff<string \| ErrorJson>`                             |
| `variantType`                     | `TypeJsonDiff`（A）                                          |
| `getterContent` / `setterContent` | `OptionalDiff<AccessorContentJson, AccessorContentJsonDiff>` |
| `error`                           | `ErrorJson` の集合（B）                                      |

`AccessorContentJsonDiff` は `{ block: OptionalDiff<…, BlockDiff>; modifier: ModifiersJsonDiff }`（`get;` ↔ `get { … }` は `block` の `added` / `removed`）。

- `isGetter` / `isSetter` は `getterContent` / `setterContent` の有無と同じ情報なので、差分には持たせない。
- 識別キー: `property:` + 名前。

### 4.4 field（`diff/declaration.ts`）

| プロパティ    | 差分                                                      |
| ------------- | --------------------------------------------------------- |
| `variantType` | `TypeJsonDiff`（A）                                       |
| `variants`    | `ListOrErrorDiff<FieldVariantDiff, …>`（変数名で D。2.5） |

`FieldVariantDiff` は配列の要素の差分（`{ status, name, init: OptionalDiff<式, BaseExpressionJsonDiff>, match, index }`）。初期値の式は `makeExpressionDiff` で比べる（apex-json-diff-policy.md 6.4）。field 宣言全体の型は `FieldDeclarationJsonDiff`。

- 識別キー: `field:` + 変数名をカンマで連結（`Integer a, b;` → `field:a,b`）。名前がエラーの変数を含む場合はキーなし。
- field は JsonType なので、`objectKey` は初期値まで含めた全体のハッシュ。初期値だけの変更も `changed` で拾える。

### 4.5 initializer（クラス本文の中だけ）

| プロパティ | 差分                     |
| ---------- | ------------------------ |
| `isStatic` | `ValueDiff<boolean>`     |
| `modifier` | `ModifiersJsonDiff`（B） |
| `block`    | `BlockDiff`              |

2.2 のとおり `sourceKeys` を持たない専用の型にする。

### 4.6 class（`diff/declaration.ts`）

| プロパティ  | 差分                                                |
| ----------- | --------------------------------------------------- |
| `name`      | `ValueDiff<string \| ErrorJson>`                    |
| `extend`    | `OptionalDiff<TypeJson \| ErrorJson, TypeJsonDiff>` |
| `implement` | `ListOrErrorDiff<TypesDiff, …>`（B）                |
| `block`     | `ClassBodyDiff[]`（下記）                           |

クラス本文（`block`）は、要素を 3 つのグループに分けて比べ、結果を 1 つの配列にまとめる。

| グループ                                                                                 | 分類 | キー                                                                         |
| ---------------------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------- |
| 名前のあるメンバー（method / constructor / property / field / class / interface / enum） | D    | `getMemberKey`（`kind:` + 4.1〜4.4 のキー、class / interface / enum は名前） |
| `initializer`                                                                            | C    | 2.2 の判定キー                                                               |
| `notSet` / `ErrorJson`                                                                   | B    | `objectKey`                                                                  |

- キーに `kind` を入れるので、対応付いた組は必ず同じ kind。メンバーの差分は kind で振り分けて、各 `make〇〇Diff` を呼ぶ（`makeClassMemberDiff`）。入れ子のクラスは `makeClassDiff` を再帰で呼ぶ。
- 名前のあるメンバーは、判定キーに `getMemberIdentity` を使う（2.1）。修飾子の差分は `MemberDeclarationJsonDiff` の `modifier` に入れる。
- 並べ方は B / D と同じ（before の index 順のあとに `added`）。index はクラス本文全体での位置。メンバーの並び順の変化は報告しない。

## 5. 実装と確認

宣言の Diff は [declaration.ts](../src/analyzer/processor/Apex/diff/declaration.ts) に集約済みで、unit 本文にも接続している。回帰テストは `test/processor/class-diff.test.ts`、`test/processor/declaration-diff.test.ts`、`test/processor/gumtree-diff.test.ts` にある。

## 6. 決定事項

- 修飾子の差分は `fields` の外に `modifier` として置く（3.2）。
- `Integer a, b;` → `Integer a; Integer b;` のように宣言を分けた場合や、field ↔ property（`Integer x;` → `Integer x { get; set; }`）の変更は、`removed` + `added` で許容する。
- 匿名 Apex / トリガーの本文（`BlockMemberJson[]`）は、宣言を D、`kind: 'statement'` の要素を文の Diff（C）に分けて比較する。

## 7. 実装状況

| ファイル                                                                               | 内容                                                                                                                                 |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [processor/commons/diff/commons.ts](../src/analyzer/processor/commons/diff/commons.ts) | `Identity`（`makeNodeDiff` / `makeSetDiff` / `makeKeyedDiff` の判定キー）、`makeOptionalDiff`、`remapPairings`、`getValueKey` を追加 |
| [declaration.ts](../src/analyzer/processor/Apex/diff/declaration.ts)                   | 識別キー、interface / enum / field / property / method / constructor / class とクラス本文の Diff                                     |
| [unit.ts](../src/analyzer/processor/Apex/diff/unit.ts)                                 | `makeClsFileDiff` の結果に `content`（`makeTypeDeclarationDiff`）を追加                                                              |

テストは test/processor/class-diff.test.ts。
