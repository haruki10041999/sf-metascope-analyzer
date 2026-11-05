# Apex JSON 型リファレンス（JsonType / StructureJsonType / ErrorJson）

この文書は [src/analyzer/types/apex/](../src/analyzer/types/apex/) で定義される、`kind` と `sourceKeys` を持つ JSON 型（`JsonType` / `StructureJsonType`）と、変換エラーを表す `ErrorJson` の全種類をまとめたものです。

- 解析の単位（クラス・トリガー・匿名 Apex。ソースと -meta.xml をまとめた `ApexUnitParseResult`）は [apex-implementation.md](./apex-implementation.md) を参照してください。
- 表中の `Expr` は `BaseExpressionJson`、`Stmt` は `StatementJson`、`Err` は `ErrorJson`、`Keys` は `ConvertKeys` の略です。`?` は省略可能なプロパティです。
- 各ノードには、表に記載したフィールドのほかに `kind` と `sourceKeys` があります。

## 1. 共通基底型

定義: [commons/json.ts](../src/analyzer/types/commons/json.ts)

```ts
type ConvertKeys = { objectKey: string; sourceKey: string };

// ひとつのソース範囲に対応するノード
type JsonType<TKind extends string> = {
    kind: TKind;
    sourceKeys: ConvertKeys;
};

// ノード全体（base）に加え、特定の子要素のソース位置も保持するノード
type StructureJsonType<
    TKind extends string,
    TRecord extends Record<string, ConvertKeys | ConvertKeys[]>,
> = {
    kind: TKind;
    sourceKeys: { base: ConvertKeys } & TRecord;
};

// 変換できなかったノード
type ErrorJson = JsonType<'error'> & {
    kind: 'error';
    kindType: string;
};
```

| 生成関数                                          | 生成される型              | 用途                                                                                |
| ------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------- |
| `makeJsonType(kind, keys, properties)`            | `JsonType`                | 通常ノードの生成。`sourceKeys` は `ConvertKeys` そのもの。                          |
| `makeStructureJson(kind, sourceKeys, properties)` | `StructureJsonType`       | `sourceKeys` に `base` と子要素のキーを持つノードの生成。                           |
| `makeErrorJson(target, kindType)`                 | `ErrorJson`               | 境界ノードの検査範囲外に残ったエラーノードを、そのノード自身のキーで変換。          |
| `convertValue(target, kind, process, options)`    | 結果型 または `ErrorJson` | 境界ノードの変換。検査範囲にエラーがあれば `kindType: kind` の `ErrorJson` を返す。 |

### 境界ノードと検査範囲

`convertValue`（[commons/convertValue.ts](../src/analyzer/types/apex/commons/convertValue.ts)）で変換するノードを「境界ノード」と呼びます。境界ノードは、変換前に検査範囲内のエラーノードを探し、見つかった場合は変換せずに `ErrorJson` を返します。

| `options.exclude`      | 検査範囲                                           | 使用例                                               |
| ---------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| 指定なし               | 部分木全体                                         | 単純な文、条件ノード、field 宣言、SOQL の句など      |
| `'children'`           | ノード自身のプリミティブ値のみ（子はすべて対象外） | 本体を持つ宣言、複合文、`soql` / `subQuery` / `sosl` |
| `['block']` などの配列 | 指定したプロパティ以外                             | `catchCondition`（catch 本体を除外）                 |

`options.record` を指定すると、StructureJsonType の `sourceKeys` に子要素のキーが集められます（例: `{ name: 'value' }` は変換元の `value` プロパティの位置を `sourceKeys.name` に入れる）。

## 2. StructureJsonType 一覧

StructureJsonType は全8種です。宣言系の7種は `record: { name: 'value' }`、`exclude: 'children'` で変換されます。

| kind              | 型                           | `sourceKeys`（`base` 以外）              | 追加フィールド                                                                                                                                                                                 | 定義                                                        |
| ----------------- | ---------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `method`          | `MethodDeclarationJson`      | `name: Keys`                             | `name: string \| Err`; `returnType: 'void' \| TypeJson \| Err`; `param?: (ParameterJson \| Err)[] \| Err`; `block?: (Stmt \| Err)[]`                                                           | [declaration.ts](../src/analyzer/types/apex/declaration.ts) |
| `interfaceMethod` | `InterfaceMethodJson`        | `name: Keys`                             | `name: string \| Err`; `returnType: 'void' \| TypeJson \| Err`; `param?: (ParameterJson \| Err)[] \| Err`; `modifier: ModifiersJson`                                                           | [declaration.ts](../src/analyzer/types/apex/declaration.ts) |
| `interface`       | `InterfaceDeclarationJson`   | `name: Keys`                             | `name: string \| Err`; `block?: (InterfaceMethodJson \| Err)[] \| Err`; `extend?: (TypeJson \| Err)[] \| Err`                                                                                  | [declaration.ts](../src/analyzer/types/apex/declaration.ts) |
| `class`           | `ClassDeclarationJson`       | `name: Keys`                             | `name: string \| Err`; `block: ClassBlock[]`; `extend?: TypeJson \| Err`; `implement?: (TypeJson \| Err)[] \| Err`                                                                             | [declaration.ts](../src/analyzer/types/apex/declaration.ts) |
| `enum`            | `EnumDeclarationJson`        | `name: Keys`                             | `name: string \| Err`; `members?: (EnumConstantJson \| Err)[] \| Err`                                                                                                                          | [declaration.ts](../src/analyzer/types/apex/declaration.ts) |
| `property`        | `PropertyDeclarationJson`    | `name: Keys`                             | `name: string \| Err`; `variantType: TypeJson \| Err`; `isGetter: boolean`; `getterContent?: AccessorContentJson`; `isSetter: boolean`; `setterContent?: AccessorContentJson`; `error?: Err[]` | [declaration.ts](../src/analyzer/types/apex/declaration.ts) |
| `constructor`     | `ConstructorDeclarationJson` | `name: Keys`                             | `name: (string \| Err)[] \| Err`; `param?: (ParameterJson \| Err)[] \| Err`; `block: (Stmt \| Err)[]`                                                                                          | [declaration.ts](../src/analyzer/types/apex/declaration.ts) |
| `catchCondition`  | `CatchConditionJson`         | `exception: Keys`; `exceptionType: Keys` | `exception: string`; `exceptionType: string[]`; `modifier: (ModifierJson \| AnnotationJson \| Err)[]`                                                                                          | [statement.ts](../src/analyzer/types/apex/statement.ts)     |

- `sourceKeys.name` は宣言名（constructor では修飾名リスト）のノード位置です。`catchCondition` の `exception` は例外変数名、`exceptionType` は例外型名の位置です。
- `PropertyDeclarationJson.error` には、取り出せなかった getter / setter の `ErrorJson` が入ります。
- `AccessorContentJson` は `{ block?: (Stmt | Err)[]; modifier: ModifiersJson }` です。

`ClassBlock`（`ClassDeclarationJson.block` の要素）は次の union です。

```ts
type ClassBlock =
    | InitializerBlockJson // { kind: 'initializer'; block; modifier; isStatic } ※ sourceKeys なし
    | (FieldDeclarationJson & { modifier: ModifiersJson })
    | (PropertyDeclarationJson & { modifier: ModifiersJson })
    | (EnumDeclarationJson & { modifier: ModifiersJson })
    | (MethodDeclarationJson & { modifier: ModifiersJson })
    | (InterfaceDeclarationJson & { modifier: ModifiersJson })
    | (ConstructorDeclarationJson & { modifier: ModifiersJson })
    | (ClassDeclarationJson & { modifier: ModifiersJson })
    | NotSetBlockJson // JsonType<'notSet'>
    | ErrorJson;
```

## 3. JsonType 一覧

### 3.1 宣言

定義: [declaration.ts](../src/analyzer/types/apex/declaration.ts)

| kind           | 型                     | 追加フィールド                                                            | 説明                                                                           |
| -------------- | ---------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `field`        | `FieldDeclarationJson` | `variants: (VariantJson \| Err)[] \| Err`; `variantType: TypeJson \| Err` | フィールド宣言。初期値まで含めた部分木全体が検査範囲。                         |
| `enumConstant` | `EnumConstantJson`     | `name: string`                                                            | enum の定数。                                                                  |
| `notSet`       | `NotSetBlockJson`      | なし                                                                      | クラス本文の要素のうち、メンバー（宣言・初期化ブロック）を持たない位置を表す。 |

`VariantJson` は `{ sourceKeys; name: string | Err; init?: Expr | Err }` です。`kind` を持たない値ですが、使われていない変数などの位置を指せるよう `sourceKeys`（宣言子の位置）を持ちます。

### 3.2 ユニット・修飾子・パラメーター・型

| kind          | 型                | 追加フィールド                                                                              | 定義                                                  |
| ------------- | ----------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `triggerCase` | `TriggerCaseJson` | `actionType: 'INSERT' \| 'UPDATE' \| 'DELETE' \| 'UNDELETE'`; `timing: 'BEFORE' \| 'AFTER'` | [unit.ts](../src/analyzer/types/apex/unit.ts)         |
| `modifier`    | `ModifierJson`    | `name: 'GLOBAL' \| 'PUBLIC' \| ... \| 'INHERITED_SHARING'`                                  | [modifier.ts](../src/analyzer/types/apex/modifier.ts) |
| `annotation`  | `AnnotationJson`  | `name: string`; `arg?: AnnotationArgJson \| AnnotationArgJson[]`                            | [modifier.ts](../src/analyzer/types/apex/modifier.ts) |
| `parameter`   | `ParameterJson`   | `variant: string`; `variantType: TypeJson \| Err`; `modifier: ModifiersJson`                | [param.ts](../src/analyzer/types/apex/param.ts)       |
| `type`        | `TypeJson`        | 下表の6形式                                                                                 | [type.ts](../src/analyzer/types/apex/type.ts)         |

- `ModifierJson.name` の候補: `GLOBAL`, `PUBLIC`, `PROTECTED`, `PRIVATE`, `TRANSIENT`, `STATIC`, `ABSTRACT`, `FINAL`, `WEBSERVICE`, `OVERRIDE`, `VIRTUAL`, `TESTMETHOD`, `WITH_SHARING`, `WITHOUT_SHARING`, `INHERITED_SHARING`
- `AnnotationArgJson` は `{ key?: string; value: string; valueType: string }` です。
- 修飾子・アノテーションは `ModifiersJson`（kind なし）に分類されて格納されます。分類キーは `access`, `declaration`, `webService`, `test`, `sharing`, `other`, `lwcAnnotation`, `flowAnnotation`, `asyncAnnotation`, `testAnnotation`, `restAnnotation`, `visualforceAnnotation`, `accessAnnotation`, `serializeAnnotation`, `executionAnnotation`, `compatibilityAnnotation`, `otherAnnotation`, `error` です。

`TypeJson`（kind はすべて `type`）は `type` プロパティで形式を区別します。

| `type`      | 型                  | 追加フィールド                                                  | 説明                                     |
| ----------- | ------------------- | --------------------------------------------------------------- | ---------------------------------------- |
| `primitive` | `PrimitiveTypeJson` | `primitiveType: string`                                         | `Integer`, `String`, `Id` などの基本型。 |
| `custom`    | `CustomTypeJson`    | `customType: string \| string[]`; `generic?: TypeContentJson[]` | ユーザー定義型・修飾名付きの型。         |
| `array`     | `ArrayTypeJson`     | `elementType: TypeContentJson`; `dimension: number`             | 配列型（`Integer[]` など）。             |
| `list`      | `ListTypeJson`      | `elementType: TypeContentJson`                                  | `List<T>`。                              |
| `set`       | `SetTypeJson`       | `elementType: TypeContentJson`                                  | `Set<T>`。                               |
| `map`       | `MapTypeJson`       | `keyType: TypeContentJson`; `valueType: TypeContentJson`        | `Map<K, V>`。                            |

境界ノードになるのは最上位の型だけです。ジェネリクスや要素型は `kind` / `sourceKeys` を持たない `TypeContentJson`（上表から `kind` / `sourceKeys` を除いた形）で保持します。

### 3.3 式

定義: [expression.ts](../src/analyzer/types/apex/expression.ts)

| kind           | 型                  | 追加フィールド                                                                                                                       | 説明                                                             |
| -------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `memberAccess` | `DotMethodCallJson` | `type: 'object' \| 'method'`; `object: Expr \| Err`; `operator: '.' \| '?.'`; `member: string`; `memberArg?: (Expr \| Err)[] \| Err` | `a.b` / `a.b(...)` / `a?.b`。                                    |
| `memberAccess` | `MethodCallJson`    | `type: 'method'`; `member: string`; `memberArg?: (Expr \| Err)[] \| Err`; `ref?: 'this' \| 'super'`                                  | レシーバーなしの呼び出し `foo(...)`、`this(...)`、`super(...)`。 |

`memberAccess` は `convertValue` を使わず、`dotExpression` / `methodCallExpression` ノード自身のキーで直接生成されます。その他の式（キャスト・演算・三項演算子など）は `kind` を持たない型です（[4章](#4-kind-を持つが-jsontype-ではない型)参照）。

### 3.4 文（statement）

定義: [statement.ts](../src/analyzer/types/apex/statement.ts)。

#### トップレベル文（`StatementJson` の要素、19種）

| kind            | 型                           | 追加フィールド                                                                                                         |
| --------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `break`         | `BreakStatementJson`         | `value: string`                                                                                                        |
| `continue`      | `ContinueStatementJson`      | `value: string`                                                                                                        |
| `delete`        | `DeleteStatementJson`        | `field: Expr \| Err`; `accessLevel?: 'SYSTEM' \| 'USER'`                                                               |
| `doWhile`       | `DoWhileStatementJson`       | `condition: DoWhileConditionJson \| Err`; `body: (Stmt \| Err)[]`                                                      |
| `expression`    | `ExpressionStatementJson`    | `value: Expr \| Err`                                                                                                   |
| `for`           | `ForStatementJson`           | `condition: ForConditionJson \| Err`; `block: Stmt \| Err`                                                             |
| `if`            | `IfStatementJson`            | `conditionBlock: { condition: 'else' \| IfConditionJson \| Err; block: Stmt \| Err }[] \| Err`                         |
| `insert`        | `InsertStatementJson`        | `field: Expr \| Err`; `accessLevel?: 'SYSTEM' \| 'USER'`                                                               |
| `localVariable` | `LocalVariableStatementJson` | `variable: LocalVariableDeclarationJson`                                                                               |
| `merge`         | `MergeStatementJson`         | `field: (Expr \| Err)[]`; `accessLevel?: 'SYSTEM' \| 'USER'`                                                           |
| `return`        | `ReturnStatementJson`        | `field?: Expr \| Err`                                                                                                  |
| `runAs`         | `RunAsStatementJson`         | `condition: RunAsConditionJson \| Err`; `block: (Stmt \| Err)[]`                                                       |
| `switch`        | `SwitchStatementJson`        | `variant: WhenVariantJson \| Err`; `block: ({ condition: WhenConditionJson \| Err; block: (Stmt \| Err)[] } \| Err)[]` |
| `throw`         | `ThrowStatementJson`         | `value: Expr \| Err`                                                                                                   |
| `try`           | `TryStatementJson`           | `block: (try節 \| catch節 \| finally節 \| Err)[]`（catch 節は `catchCondition: CatchConditionJson \| Err` を持つ）     |
| `undelete`      | `UndeleteStatementJson`      | `field: Expr \| Err`; `accessLevel?: 'SYSTEM' \| 'USER'`                                                               |
| `update`        | `UpdateStatementJson`        | `field: Expr \| Err`; `accessLevel?: 'SYSTEM' \| 'USER'`                                                               |
| `upsert`        | `UpsertStatementJson`        | `field: Expr \| Err`; `accessLevel?: 'SYSTEM' \| 'USER'`; `key?: string[]`                                             |
| `while`         | `WhileStatementJson`         | `condition: WhileConditionJson \| Err`; `body: Stmt \| Err`                                                            |

`StatementJson` はこれら19種に加え、ブロックを表す再帰配列 `(StatementJson | ErrorJson)[]` も含みます。

#### 文の補助ノード（7種）

| kind               | 型                     | 追加フィールド                                                                                                                                                                                                                   |
| ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `doWhileCondition` | `DoWhileConditionJson` | `condition: Expr \| Err`                                                                                                                                                                                                         |
| `forCondition`     | `ForConditionJson`     | 拡張 for: `initializer: string`; `initializeType: TypeJson \| Err`; `baseObject: Expr \| Err` / 通常 for: `initializer?: LocalVariableDeclarationJson \| (Expr \| Err)[]`; `condition?: Expr \| Err`; `update?: (Expr \| Err)[]` |
| `ifCondition`      | `IfConditionJson`      | `condition: Expr \| Err`                                                                                                                                                                                                         |
| `runAsCondition`   | `RunAsConditionJson`   | `field: (Expr \| Err)[]`                                                                                                                                                                                                         |
| `switchVariant`    | `WhenVariantJson`      | `variant: Expr \| Err`                                                                                                                                                                                                           |
| `switchCondition`  | `WhenConditionJson`    | `condition: 'else' \| リテラル配列 \| { value: string; valueType: TypeJson \| Err }`                                                                                                                                             |
| `whileCondition`   | `WhileConditionJson`   | `condition: Expr \| Err`                                                                                                                                                                                                         |

`WhenConditionJson` のリテラル配列の要素は `{ value: string; valueType: 'string' | 'longText' | 'null' }`、`{ value: string; valueType: 'integer' | 'long'; operator?: string }`、`{ value: string[]; valueType: 'id' }` のいずれかです。

### 3.5 SOQL / SOSL

定義: [query/](../src/analyzer/types/apex/query/)

| kind                | 型                          | 追加フィールド                                                                                                                                                                                                                             | 定義                                                            |
| ------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `soql`              | `SoqlJson`                  | `select: SelectJson \| Err`; `from: FromJson \| Err`; `where?`; `for?`; `usingScope?`; `with?`; `groupBy?`; `orderBy?`; `limit?`; `offset?`; `allRows?`; `updateList?`（いずれも各句の型 `\| Err`）                                        | [soql.ts](../src/analyzer/types/apex/query/soql.ts)             |
| `subQuery`          | `SubQueryJson`              | `select: SelectJson \| Err`; `from: FromJson \| Err`; `where?`; `for?`; `orderBy?`; `limit?`; `updateList?`（いずれも各句の型 `\| Err`）                                                                                                   | [subQuery.ts](../src/analyzer/types/apex/query/subQuery.ts)     |
| `selectEntry`       | `SelectEntryJson`           | `FieldJson \| SoqlFunctionJson \| TypeOfJson` のフィールド; `alias?: string`。サブクエリの場合は `SubQueryJson & { alias?: string }`（kind は `subQuery`）                                                                                 | [select.ts](../src/analyzer/types/apex/query/select.ts)         |
| `fromField`         | `FromFieldJson`             | `field: string[]`; `alias?: string`                                                                                                                                                                                                        | [from.ts](../src/analyzer/types/apex/query/from.ts)             |
| `singleCondition`   | `SingleConditionJson`       | `field: FieldJson \| SoqlFunctionJson`; `operator: ComparisonOperator`; `value: ValueJson`                                                                                                                                                 | [commons.ts](../src/analyzer/types/apex/query/commons.ts)       |
| `singleCondition`   | `WhereSingleConditionJson`  | `field: string`; `operator: ComparisonOperator`; `value: ValueJson`（WHERE 句で左辺が文字列の場合）。それ以外は `SingleConditionJson`                                                                                                      | [where.ts](../src/analyzer/types/apex/query/where.ts)           |
| `groupBy`           | `GroupByJson`               | `field: (FieldJson \| SoqlFunctionJson)[]`; `mode?: 'ROLLUP' \| 'CUBE'`; `having?: LogicalConditionJson \| Err`                                                                                                                            | [groupby.ts](../src/analyzer/types/apex/query/groupby.ts)       |
| `orderField`        | `FieldOrderJson`            | `FieldJson \| SoqlFunctionJson` のフィールド; `direction?: 'ASC' \| 'DESC'`; `nulls?: 'FIRST' \| 'LAST'`                                                                                                                                   | [orderBy.ts](../src/analyzer/types/apex/query/orderBy.ts)       |
| `limitClause`       | `LimitJson`                 | `{ type: 'literal'; value: string }` または `{ type: 'bind'; value: Expr \| Err }`                                                                                                                                                         | [limit.ts](../src/analyzer/types/apex/query/limit.ts)           |
| `offsetClause`      | `OffsetJson`                | `{ type: 'literal'; value: string }` または `{ type: 'bind'; value: Expr \| Err }`                                                                                                                                                         | [offset.ts](../src/analyzer/types/apex/query/offset.ts)         |
| `forClause`         | `ForJson`                   | `value: string[]`                                                                                                                                                                                                                          | [for.ts](../src/analyzer/types/apex/query/for.ts)               |
| `updateClause`      | `UpdateListJson`            | `value: ('TRACKING' \| 'VIEWSTAT')[]`                                                                                                                                                                                                      | [updateList.ts](../src/analyzer/types/apex/query/updateList.ts) |
| `allRowsClause`     | `AllRowsJson`               | `value: string`                                                                                                                                                                                                                            | [allRows.ts](../src/analyzer/types/apex/query/allRows.ts)       |
| `usingScopeClause`  | `UsingScopeJson`            | `value: string`                                                                                                                                                                                                                            | [usingScope.ts](../src/analyzer/types/apex/query/usingScope.ts) |
| `categoryCondition` | `DataCategorySelectionJson` | `group: string`; `selector: 'AT' \| 'ABOVE' \| 'BELOW' \| 'ABOVE_OR_BELOW'`; `category: string[]`                                                                                                                                          | [with.ts](../src/analyzer/types/apex/query/with.ts)             |
| `soslField`         | `SoslFieldJson`             | `field: string[] \| SoqlFunctionJson`; `func?: 'TOLABEL' \| 'CONVERT_CURRENCY' \| 'FORMAT'`                                                                                                                                                | [sosl.ts](../src/analyzer/types/apex/query/sosl.ts)             |
| `sosl`              | `SoslJson`                  | `find: string \| Expr \| Err`; `group?: 'ALL' \| 'EMAIL' \| 'NAME' \| 'PHONE' \| 'SIDEBAR'`; `fieldSpec?: (FieldSpecJson \| Err)[] \| Err`; `with?: (SoslWithJson \| Err)[]`; `limit?: LimitJson \| Err`; `update?: UpdateListJson \| Err` | [sosl.ts](../src/analyzer/types/apex/query/sosl.ts)             |

`ComparisonOperator` は `'=' | '!=' | '<' | '>' | '<=' | '>=' | '<>' | 'LIKE' | 'IN' | 'NOT IN' | 'INCLUDES' | 'EXCLUDES'` です。

## 4. kind を持つが JsonType ではない型

以下は `kind` を持ちますが `sourceKeys` を持たないため、JsonType ではありません。

| kind          | 型                     | 定義                                                        | 説明                                                                     |
| ------------- | ---------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| `initializer` | `InitializerBlockJson` | [declaration.ts](../src/analyzer/types/apex/declaration.ts) | クラスの初期化ブロック。`block`, `modifier`, `isStatic` を持つ。         |
| `statement`   | `MemberStatementJson`  | [unit.ts](../src/analyzer/types/apex/unit.ts)               | anonymous / trigger のブロック直下の文。`statement`, `modifier` を持つ。 |

`new` 式の初期化部分の形式（`array` / `class` / `map` / `no` / `list || set`）は、`kind` ではなく `initType` に持ちます（`kind` は JSON ノードの印なので使いません）。

`kind` を持たない式（リテラル `LiteralPrimaryJson`・`new` の `NewInstanceJson`・`CastJson`・`SubJson`・`ArrayJson`・`FormulaJson`・`InstanceofJson`・`UnaryJson`・`TernaryJson`）と `VariantJson` は、findings の位置（ハードコードされた ID など）を式の単位で指せるよう `sourceKeys` を持ちます。`kind` を持たないので JSON ノード（Diff の対象のノード）ではなく、Diff の値の比較では `sourceKeys` を無視します（位置だけの変更は差分にならない）。名前（識別子）の式は文字列のままで、位置を持ちません。sourceObject の `context` は元のソースの切り出し（空白・改行を残す）です。

SOSL の `WITH SNIPPET (target_length = n)` は `{ mode: 'SNIPPET', targetLength?: string }` です（`SPELL_CORRECTION` は `value`）。

ユニット（`AnonymousUnitJson` / `TriggerUnitJson` / `CompilationUnitJson`）は `kind` ではなく `fileType`（`anonymous` / `trigger` / `cls`）で区別します。`CompilationUnitJson` は `class` / `interface` / `enum` の StructureJsonType に `fileType` と `modifier` を加えた形です。

## 5. ErrorJson の全種類

`ErrorJson.kind` は常に `'error'` です。`kindType` は任意の `string` で、エラーを作った変換箇所を示します。ErrorJson の種類は `kindType` の値で区別します。

### 5.1 生成経路と sourceKeys

| 経路                            | `kindType`                      | `sourceKeys`                                               | 発生条件                                                                                               |
| ------------------------------- | ------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| A. 境界ノード（`convertValue`） | `convertValue` の第2引数 `kind` | 境界ノード自身のキー（StructureJsonType の `base` に相当） | ノード自身がエラーノード、または検査範囲内にエラーノードがある。                                       |
| B. `makeErrorJson`              | 各モジュールが指定する値        | エラーノード自身のキー（一部は親ノードのキー）             | 境界ノードの検査範囲外（`exclude` された子や、境界ノードを持たない入れ物）にエラーノードが残っている。 |

StructureJsonType の境界ノードがエラーになった場合でも、`ErrorJson.sourceKeys` は `{ base, name }` ではなく `ConvertKeys` そのものです。

### 5.2 経路 A: 境界ノード由来の kindType（56種）

`kindType` は対応する JSON の `kind` と基本的に一致します。一致しないものは「備考」に記載しています。

#### 宣言・ユニット・修飾子・パラメーター・型

| kindType          | 変換関数                         | 置き換わる型                      | 検査範囲   | 備考                                                                                                     |
| ----------------- | -------------------------------- | --------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `method`          | `makeMethodDeclarationJson`      | `MethodDeclarationJson`           | `children` |                                                                                                          |
| `interfaceMethod` | `makeInterfaceMethodJson`        | `InterfaceMethodJson`             | `children` |                                                                                                          |
| `interface`       | `makeInterfaceDeclarationJson`   | `InterfaceDeclarationJson`        | `children` |                                                                                                          |
| `class`           | `makeClassDeclarationJson`       | `ClassDeclarationJson`            | `children` |                                                                                                          |
| `enum`            | `makeEnumDeclarationJson`        | `EnumDeclarationJson`             | `children` |                                                                                                          |
| `enumConstant`    | `makeEnumConstantJson`           | `EnumConstantJson`                | 部分木全体 |                                                                                                          |
| `property`        | `makePropertyDeclarationJson`    | `PropertyDeclarationJson`         | `children` |                                                                                                          |
| `field`           | `makeFieldDeclarationJson`       | `FieldDeclarationJson`            | 部分木全体 | 初期値の式のエラーもフィールド宣言全体のエラーになる。                                                   |
| `constructor`     | `makeConstructorDeclarationJson` | `ConstructorDeclarationJson`      | `children` |                                                                                                          |
| `triggerCase`     | `makeTriggerCaseJson`            | `TriggerCaseJson`                 | 部分木全体 |                                                                                                          |
| `modifier`        | `makeModifierJson`               | `ModifierJson` / `AnnotationJson` | 部分木全体 | アノテーションのエラーも `modifier`。`ModifiersJson.error[]` と `CatchConditionJson.modifier[]` に入る。 |
| `parameter`       | `makeParameterJson`              | `ParameterJson`                   | 部分木全体 |                                                                                                          |
| `type`            | `makeTypeJson`                   | `TypeJson`                        | 部分木全体 |                                                                                                          |

#### 文

| kindType           | 変換関数                         | 置き換わる型                 | 検査範囲     | 備考                              |
| ------------------ | -------------------------------- | ---------------------------- | ------------ | --------------------------------- |
| `break`            | `makeBreakStatementJson`         | `BreakStatementJson`         | 部分木全体   |                                   |
| `continue`         | `makeContinueStatementJson`      | `ContinueStatementJson`      | 部分木全体   |                                   |
| `delete`           | `makeDeleteStatementJson`        | `DeleteStatementJson`        | 部分木全体   |                                   |
| `doWhileCondition` | `makeDoWhileConditionJson`       | `DoWhileConditionJson`       | 部分木全体   |                                   |
| `doWhile`          | `makeDoWhileStatementJson`       | `DoWhileStatementJson`       | `children`   |                                   |
| `expression`       | `makeExpressionStatementJson`    | `ExpressionStatementJson`    | 部分木全体   | 経路 B の `expression` と同じ値。 |
| `forCondition`     | `makeForConditionJson`           | `ForConditionJson`           | 部分木全体   |                                   |
| `for`              | `makeForStatementJson`           | `ForStatementJson`           | `children`   |                                   |
| `ifCondition`      | `makeIfConditionJson`            | `IfConditionJson`            | 部分木全体   |                                   |
| `if`               | `makeIfStatementJson`            | `IfStatementJson`            | `children`   |                                   |
| `insert`           | `makeInsertStatementJson`        | `InsertStatementJson`        | 部分木全体   |                                   |
| `localVariable`    | `makeLocalVariableStatementJson` | `LocalVariableStatementJson` | 部分木全体   |                                   |
| `merge`            | `makeMergeStatementJson`         | `MergeStatementJson`         | 部分木全体   |                                   |
| `return`           | `makeReturnStatementJson`        | `ReturnStatementJson`        | 部分木全体   |                                   |
| `runAsCondition`   | `makeRunAsConditionJson`         | `RunAsConditionJson`         | 部分木全体   |                                   |
| `runAs`            | `makeRunAsStatementJson`         | `RunAsStatementJson`         | `children`   |                                   |
| `whenVariant`      | `makeWhenVariantJson`            | `WhenVariantJson`            | 部分木全体   | JSON の kind は `switchVariant`。 |
| `switchCondition`  | `makeWhenConditionJson`          | `WhenConditionJson`          | 部分木全体   |                                   |
| `switch`           | `makeSwitchStatementJson`        | `SwitchStatementJson`        | `children`   |                                   |
| `throw`            | `makeThrowStatementJson`         | `ThrowStatementJson`         | 部分木全体   |                                   |
| `catchCondition`   | `makeCatchConditionJson`         | `CatchConditionJson`         | `block` 以外 |                                   |
| `try`              | `makeTryStatementJson`           | `TryStatementJson`           | `children`   |                                   |
| `undelete`         | `makeUndeleteStatementJson`      | `UndeleteStatementJson`      | 部分木全体   |                                   |
| `update`           | `makeUpdateStatementJson`        | `UpdateStatementJson`        | 部分木全体   |                                   |
| `upsert`           | `makeUpsertStatementJson`        | `UpsertStatementJson`        | 部分木全体   |                                   |
| `whileCondition`   | `makeWhileConditionJson`         | `WhileConditionJson`         | 部分木全体   |                                   |
| `while`            | `makeWhileStatementJson`         | `WhileStatementJson`         | `children`   |                                   |

#### SOQL / SOSL

| kindType            | 変換関数                                                   | 置き換わる型                                       | 検査範囲   | 備考                                                            |
| ------------------- | ---------------------------------------------------------- | -------------------------------------------------- | ---------- | --------------------------------------------------------------- |
| `soql`              | `makeSoqlJson`                                             | `SoqlJson`                                         | `children` |                                                                 |
| `subQuery`          | `makeSubQueryJson`                                         | `SubQueryJson`                                     | `children` |                                                                 |
| `selectEntry`       | `makeSelectEntryJson`                                      | `SelectEntryJson`                                  | 部分木全体 | サブクエリ項目のエラーも、検査範囲内なら `selectEntry` になる。 |
| `fromField`         | `makeFromFieldJson`                                        | `FromFieldJson`                                    | 部分木全体 |                                                                 |
| `singleCondition`   | `makeSingleConditionJson` / `makeWhereSingleConditionJson` | `SingleConditionJson` / `WhereSingleConditionJson` | 部分木全体 | 2つの変換関数で同じ値を使う。                                   |
| `groupBy`           | `makeGroupByJson`                                          | `GroupByJson`                                      | 部分木全体 |                                                                 |
| `orderField`        | `makeFieldOrderJson`                                       | `FieldOrderJson`                                   | 部分木全体 |                                                                 |
| `limitClause`       | `makeLimitJson`                                            | `LimitJson`                                        | 部分木全体 |                                                                 |
| `offsetClause`      | `makeOffsetJson`                                           | `OffsetJson`                                       | 部分木全体 |                                                                 |
| `forClause`         | `makeForJson`                                              | `ForJson`                                          | 部分木全体 |                                                                 |
| `updateClause`      | `makeUpdateListJson`                                       | `UpdateListJson`                                   | 部分木全体 |                                                                 |
| `allRowsClause`     | `makeAllRowsJson`                                          | `AllRowsJson`                                      | 部分木全体 |                                                                 |
| `usingScopeClause`  | `makeUsingScopeJson`                                       | `UsingScopeJson`                                   | 部分木全体 |                                                                 |
| `categoryCondition` | `makeDataCategorySelectionJson`                            | `DataCategorySelectionJson`                        | 部分木全体 | 経路 B の `categoryCondition` と同じ値。                        |
| `soslField`         | `makeSoslFieldJson`                                        | `SoslFieldJson`                                    | 部分木全体 |                                                                 |
| `sosl`              | `makeSoslJson`                                             | `SoslJson`                                         | `children` | 経路 B の `sosl` と同じ値。                                     |

### 5.3 経路 B: makeErrorJson 由来の kindType（16種）

#### 宣言・式・文・ユニット

| kindType      | 定義                                                        | 発生箇所（エラーノードの位置 → ErrorJson が置かれる位置）                                                                                                                                                                                                                                                                                                                                                                |
| ------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `declaration` | [declaration.ts](../src/analyzer/types/apex/declaration.ts) | 宣言名 → `name`; 仮引数リスト・その中身 → `param`; 型リスト → `interface.extend` / `class.implement`; 変数宣言子リスト・各宣言子 → `variants` / `variants[]`; interface 本文 → `interface.block`; class 本文・本文要素・メンバー → `class.block[]`; enum 定数リスト → `enum.members`; getter / setter → `property.error[]`; constructor 名 → `constructor.name`; メンバー宣言 → `class.block[]` / ユニットのブロック要素 |
| `expression`  | [expression.ts](../src/analyzer/types/apex/expression.ts)   | 式ノード → 式の位置すべて; 引数リスト → `memberArg` / `new` の引数; ドット右辺・メソッド呼び出し → 式全体; `new` の型名・ジェネリクス・初期化部 → 式全体; map 初期化子の要素 → `init[]`                                                                                                                                                                                                                                  |
| `primary`     | [primary.ts](../src/analyzer/types/apex/primary.ts)         | primary ノード、識別子・`this` / `super` / `void` の値、リテラル値、SOQL リテラル → 式の位置                                                                                                                                                                                                                                                                                                                             |
| `statement`   | [statement.ts](../src/analyzer/types/apex/statement.ts)     | 文ノード → 文の位置; ブロック → `[Err]`（1件の配列）; if の節リスト → `conditionBlock`; switch の when 節 → `block[]`; catch 節・finally 節 → `try.block[]`                                                                                                                                                                                                                                                              |
| `unit`        | [unit.ts](../src/analyzer/types/apex/unit.ts)               | ユニット・型宣言ノード → ユニット全体; ブロック → `block`; ブロック要素・メンバー → `block[]`; trigger 名・対象オブジェクト → `name` / `object`（欠落時は trigger ユニット自身のキー）                                                                                                                                                                                                                                   |

#### SOQL / SOSL

| kindType            | 定義                                                                | 発生箇所（エラーノードの位置 → ErrorJson が置かれる位置）                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `select`            | [select.ts](../src/analyzer/types/apex/query/select.ts)             | SELECT リスト → `soql.select` / `subQuery.select`                                                                                                                                                                                   |
| `from`              | [from.ts](../src/analyzer/types/apex/query/from.ts)                 | FROM リスト → `soql.from` / `subQuery.from`                                                                                                                                                                                         |
| `where`             | [where.ts](../src/analyzer/types/apex/query/where.ts)               | WHERE 句 → `soql.where` / `subQuery.where`                                                                                                                                                                                          |
| `whereCondition`    | [where.ts](../src/analyzer/types/apex/query/where.ts)               | WHERE の論理式・その要素 → `WhereJson.condition` / `condition[]`                                                                                                                                                                    |
| `logicalCondition`  | [commons.ts](../src/analyzer/types/apex/query/commons.ts)           | 論理式・その要素 → `WITH` の条件 (`with.mode`)、`groupBy.having`、SOSL の `fieldSpec.where` とその `condition[]`                                                                                                                    |
| `orderBy`           | [orderBy.ts](../src/analyzer/types/apex/query/orderBy.ts)           | ORDER BY 句・フィールドリスト → `soql.orderBy` / `subQuery.orderBy`                                                                                                                                                                 |
| `with`              | [with.ts](../src/analyzer/types/apex/query/with.ts)                 | SOQL の WITH 句 → `soql.with`                                                                                                                                                                                                       |
| `categoryCondition` | [with.ts](../src/analyzer/types/apex/query/with.ts)                 | データカテゴリのフィルター式 → `WithJson.selection` / SOSL `WITH DATA CATEGORY` の `value`                                                                                                                                          |
| `soslWith`          | [with.ts](../src/analyzer/types/apex/query/with.ts)                 | SOSL の WITH 句 → `sosl.with[]`; `DIVISION` / `PRICEBOOKID` のバインド値・`NETWORK` のリスト → `sosl.with[]`; `NETWORK` の各要素 → `value[]`                                                                                        |
| `soqlFunction`      | [soqlFunction.ts](../src/analyzer/types/apex/query/soqlFunction.ts) | `DISTANCE` の引数が 3 個（場所・場所・単位）でない → `arg`（SOQL 関数ノード自身のキー）; 座標が 2 要素でない → 場所の `field`（場所ノード自身のキー）。エラーノードではなく形の不一致で生成される。                                 |
| `sosl`              | [sosl.ts](../src/analyzer/types/apex/query/sosl.ts)                 | SOSL 句全体 → `SoslJson` 全体; 検索語 → `find`; fieldSpec リスト → `fieldSpec`; fieldSpec → `fieldSpec[]`; オブジェクト名・リストビュー名（リスト・要素） → `object` / `listView`; フィールドリスト → `field`; ORDER BY → `orderBy` |

### 5.4 kindType 全一覧（69種）

経路 A と経路 B で同じ値を使うもの（`expression`、`categoryCondition`、`sosl`）は1件として数えています。

| 分類                 | kindType                                                                                                                                                                                                                                                                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 宣言                 | `class`, `constructor`, `declaration`, `enum`, `enumConstant`, `field`, `interface`, `interfaceMethod`, `method`, `property`                                                                                                                                                                                                                          |
| ユニット・修飾子・型 | `modifier`, `parameter`, `triggerCase`, `type`, `unit`                                                                                                                                                                                                                                                                                                |
| 式                   | `expression`, `primary`                                                                                                                                                                                                                                                                                                                               |
| 文                   | `break`, `catchCondition`, `continue`, `delete`, `doWhile`, `doWhileCondition`, `for`, `forCondition`, `if`, `ifCondition`, `insert`, `localVariable`, `merge`, `return`, `runAs`, `runAsCondition`, `statement`, `switch`, `switchCondition`, `throw`, `try`, `undelete`, `update`, `upsert`, `whenVariant`, `while`, `whileCondition`               |
| SOQL / SOSL          | `allRowsClause`, `categoryCondition`, `forClause`, `from`, `fromField`, `groupBy`, `limitClause`, `logicalCondition`, `offsetClause`, `orderBy`, `orderField`, `select`, `selectEntry`, `singleCondition`, `soql`, `soqlFunction`, `sosl`, `soslField`, `soslWith`, `subQuery`, `updateClause`, `usingScopeClause`, `where`, `whereCondition`, `with` |

### 5.5 注意点

- `expression` は、式文の境界ノード（経路 A）と式変換モジュール（経路 B）の両方で使われます。`kindType` だけでは区別できないため、必要に応じて `sourceKeys` や親ノードで判別してください。`sosl` と `categoryCondition` も同様です。
- `whenVariant` は、JSON の kind（`switchVariant`）と `kindType` の名前が異なります。また、`modifier` の境界ノードは `annotation` も生成し、`selectEntry` の境界ノードはサブクエリ項目では `subQuery` を生成します。
- `modifier` の `ErrorJson` は、`ModifiersJson` では `error` プロパティにまとめられます（分類キーには入りません）。
- 検査範囲が部分木全体の境界ノードでは、内部のどこかにエラーノードがあると境界ノード全体が `ErrorJson` になります。そのため、経路 B の `ErrorJson` は主に `exclude: 'children'` の境界ノード配下や、境界ノードを持たない入れ物（`SelectJson`、`WhereJson`、ユニットなど）で現れます。
