# variableVisitor

変数宣言の宣言子（`a = 1, b`）と配列初期化子（`{ 1, 2, 3 }`）を扱う。フィールド宣言・ローカル変数宣言の中身として使われる。

## Visitor

`VariableVisitor` が扱う Context と生成する TypeClass:

| visit メソッド             | Context                      | 生成する TypeClass             |
| -------------------------- | ---------------------------- | ------------------------------ |
| `visitArrayInitializer`    | `ArrayInitializerContext`    | `ArrayInitializerTypeClass`    |
| `visitVariableDeclarator`  | `VariableDeclaratorContext`  | `VariableDeclaratorTypeClass`  |
| `visitVariableDeclarators` | `VariableDeclaratorsContext` | `VariableDeclaratorsTypeClass` |

## 基底クラス（base.ts）

### `VariableTypeClass<T>`

値を 1 つ持つ変数系ノードの基底。

| 変数    | 型                    | 内容                                   |
| ------- | --------------------- | -------------------------------------- |
| `type`  | `string`              | ノード種別（CommonTypeClass から継承） |
| `value` | `T \| ErrorTypeClass` | 主値。変換失敗時は `ErrorTypeClass`    |

ゲッター: `getValue()`, `getType()`（継承）

### `VariableListTypeClass<T>`

値の配列を持つ変数系ノードの基底。

| 変数    | 型                        | 内容                                              |
| ------- | ------------------------- | ------------------------------------------------- |
| `type`  | `string`                  | ノード種別（CommonTypeClass から継承）            |
| `value` | `(T \| ErrorTypeClass)[]` | 要素の配列。各要素は変換失敗時に `ErrorTypeClass` |

ゲッター: `getValue()`, `getType()`（継承）

### `VariableAllTypeClass`

`VariableTypeClass<unknown> | VariableListTypeClass<unknown>` の union 型。`VariableVisitor` の戻り値型。

### `isVariableTypeAll`

`VariableTypeClass` または `VariableListTypeClass` のインスタンスかを判定するガード（`VariableAllTypeClass` に絞り込む）。

## TypeClass

### `VariableDeclaratorsTypeClass`（variableDeclarators.ts）

- **type**: `'variableDeclarators'`
- **継承**: `VariableListTypeClass<VariableDeclaratorTypeClass>`
- **元 Context**: `VariableDeclaratorsContext`（文法: `variableDeclarator (COMMA variableDeclarator)*`）
- **役割**: 1 つの宣言文内でカンマ区切りに並ぶ宣言子の列。

| 変数    | 型                                                  | 内容                     |
| ------- | --------------------------------------------------- | ------------------------ |
| `type`  | `'variableDeclarators'`                             | 継承                     |
| `value` | `(VariableDeclaratorTypeClass \| ErrorTypeClass)[]` | 宣言子の配列（1 個以上） |

ゲッター: `getValue()`

例:

```apex
private Integer first = 1, second, third = 3;
```

```json
{
    "type": "variableDeclarators",
    "value": [
        {
            "type": "variableDeclarator",
            "value": { "type": "id", "value": "first" },
            "content": { "type": "primaryExpression", "value": "..." }
        },
        {
            "type": "variableDeclarator",
            "value": { "type": "id", "value": "second" },
            "content": null
        },
        {
            "type": "variableDeclarator",
            "value": { "type": "id", "value": "third" },
            "content": { "type": "primaryExpression", "value": "..." }
        }
    ]
}
```

### `VariableDeclaratorTypeClass`（variableDeclarator.ts）

- **type**: `'variableDeclarator'`
- **継承**: `VariableTypeClass<NormalIdTypeClass>`
- **元 Context**: `VariableDeclaratorContext`（文法: `id (ASSIGN expression)?`）
- **役割**: 変数 1 個の宣言子。変数名と任意の初期化式を持つ。

| 変数      | 型                                                 | 内容                                                     |
| --------- | -------------------------------------------------- | -------------------------------------------------------- |
| `type`    | `'variableDeclarator'`                             | 継承                                                     |
| `value`   | `NormalIdTypeClass \| ErrorTypeClass`              | 変数名（`id` ノード）                                    |
| `content` | `ExpressionAllTypeClass \| ErrorTypeClass \| null` | 初期化式。`= expr` が無い場合（`String name;`）は `null` |

ゲッター: `getValue()`, `getContent()`

例:

```apex
public static final Integer MAX_SIZE = 100;
```

```json
{
    "type": "variableDeclarator",
    "value": { "type": "id", "value": "MAX_SIZE" },
    "content": {
        "type": "primaryExpression",
        "value": {
            "type": "literalPrimary",
            "value": { "type": "literal", "valueType": "integer", "value": "100" }
        }
    }
}
```

### `ArrayInitializerTypeClass`（arrayInitializer.ts）

- **type**: `'arrayInitializer'`
- **継承**: `VariableListTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `ArrayInitializerContext`（文法: `LBRACE (expression (COMMA expression)* COMMA?)? RBRACE`）
- **役割**: 配列生成時の `{ ... }` 初期化子。

| 変数    | 型                                             | 内容                                                   |
| ------- | ---------------------------------------------- | ------------------------------------------------------ |
| `type`  | `'arrayInitializer'`                           | 継承                                                   |
| `value` | `(ExpressionAllTypeClass \| ErrorTypeClass)[]` | 要素式の配列。`{}` の場合は空配列（null にはならない） |

ゲッター: `getValue()`

例:

```apex
Integer[] numbers = new Integer[] { 1, 2, 3 };
Integer[] emptyNumbers = new Integer[] {};
```

```json
{
    "type": "arrayInitializer",
    "value": [
        {
            "type": "primaryExpression",
            "value": {
                "type": "literalPrimary",
                "value": { "type": "literal", "valueType": "integer", "value": "1" }
            }
        },
        { "type": "primaryExpression", "value": "..." },
        { "type": "primaryExpression", "value": "..." }
    ]
}
```

```json
{ "type": "arrayInitializer", "value": [] }
```
