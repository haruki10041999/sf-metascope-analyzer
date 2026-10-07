# controlVisitor

制御構文の「括弧内」や分岐節を扱う。`for` 文の制御部（従来型 `init; cond; update` と拡張 for `Type x : expr`）と、`switch` 文の `when` 節。

## Visitor

`ControlVisitor` が扱う Context と生成する TypeClass:

| visit メソッド            | Context                     | 生成する TypeClass            |
| ------------------------- | --------------------------- | ----------------------------- |
| `visitForControl`         | `ForControlContext`         | `ForControlTypeClass`         |
| `visitForInit`            | `ForInitContext`            | `ForInitTypeClass`            |
| `visitForUpdate`          | `ForUpdateContext`          | `ForUpdateTypeClass`          |
| `visitEnhancedForControl` | `EnhancedForControlContext` | `EnhancedForControlTypeClass` |
| `visitWhenControl`        | `WhenControlContext`        | `WhenControlTypeClass`        |

## 基底クラス（base.ts）

### `ControlTypeClass<T>`

制御系ノードの共通基底。値を 1 つだけ持つ。

| 変数    | 型                    | 内容                                   |
| ------- | --------------------- | -------------------------------------- |
| `type`  | `string`              | ノード種別（CommonTypeClass から継承） |
| `value` | `T \| ErrorTypeClass` | 主値。変換失敗時は `ErrorTypeClass`    |

ゲッター: `getValue()`, `getType()`（継承）

### `isControlTypeAll`

`target instanceof ControlTypeClass` を判定するガード（`ControlTypeClass<unknown>` に絞り込む）。

## TypeClass

### `ForControlTypeClass`（forControl.ts）

- **type**: `'forControl'`
- **継承**: `ControlTypeClass<EnhancedForControlTypeClass | ExpressionAllTypeClass | null>`
- **元 Context**: `ForControlContext`（文法: `enhancedForControl | forInit? SEMI expression? SEMI forUpdate?`）
- **役割**: `for (...)` の括弧内全体。拡張 for ならその制御部、従来型なら条件式・初期化・更新を持つ。

| 変数     | 型                                                                                | 内容                                                                                                         |
| -------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `type`   | `'forControl'`                                                                    | 継承                                                                                                         |
| `value`  | `EnhancedForControlTypeClass \| ExpressionAllTypeClass \| null \| ErrorTypeClass` | 拡張 for なら `enhancedForControl` ノード、従来型なら条件式。従来型で条件式が無い場合（`for (;;)`）は `null` |
| `init`   | `ForInitTypeClass \| ErrorTypeClass \| null`                                      | 初期化部。省略時・拡張 for の場合は `null`                                                                   |
| `update` | `ForUpdateTypeClass \| ErrorTypeClass \| null`                                    | 更新部。省略時・拡張 for の場合は `null`                                                                     |

ゲッター: `getValue()`（独自ゲッターなし）

例:

```apex
for (Integer i = 0, j = 10; i < j; i++, j--) { ... }
for (;;) { ... }
```

```json
{
    "type": "forControl",
    "value": { "type": "cmpExpression", "left": "...", "right": "...", "operator": "<" },
    "init": { "type": "forInit", "value": { "type": "localVariableDeclaration", "...": "..." } },
    "update": {
        "type": "forUpdate",
        "value": { "type": "expressionList", "value": ["...", "..."] }
    }
}
```

```json
{ "type": "forControl", "value": null, "init": null, "update": null }
```

### `ForInitTypeClass`（forInit.ts）

- **type**: `'forInit'`
- **継承**: `ControlTypeClass<LocalVariableDeclarationTypeClass | ExpressionListTypeClass>`
- **元 Context**: `ForInitContext`（文法: `localVariableDeclaration | expressionList`）
- **役割**: 従来型 for の初期化部。変数宣言か、既存変数への式リストのどちらか。

| 変数    | 型                                                                               | 内容                                                                                              |
| ------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `type`  | `'forInit'`                                                                      | 継承                                                                                              |
| `value` | `LocalVariableDeclarationTypeClass \| ExpressionListTypeClass \| ErrorTypeClass` | `Integer i = 0` なら `localVariableDeclaration`、`k = 0` なら `expressionList`。null にはならない |

ゲッター: `getValue()`

例:

```apex
for (Integer i = 0, j = 10; i < j; i++, j--) { ... }
```

```json
{
    "type": "forInit",
    "value": {
        "type": "localVariableDeclaration",
        "value": {
            "type": "variableDeclarators",
            "value": [
                {
                    "type": "variableDeclarator",
                    "value": { "type": "id", "value": "i" },
                    "content": "..."
                },
                {
                    "type": "variableDeclarator",
                    "value": { "type": "id", "value": "j" },
                    "content": "..."
                }
            ]
        },
        "valueType": {
            "type": "typeRef",
            "value": ["..."],
            "dimension": { "type": "arraySubscripts", "value": 0 }
        },
        "modifier": []
    }
}
```

### `ForUpdateTypeClass`（forUpdate.ts）

- **type**: `'forUpdate'`
- **継承**: `ControlTypeClass<ExpressionListTypeClass>`
- **元 Context**: `ForUpdateContext`（文法: `expressionList`）
- **役割**: 従来型 for の更新部（`i++, j--` 等）。

| 変数    | 型                                          | 内容                                                         |
| ------- | ------------------------------------------- | ------------------------------------------------------------ |
| `type`  | `'forUpdate'`                               | 継承                                                         |
| `value` | `ExpressionListTypeClass \| ErrorTypeClass` | 更新式のリスト（`expressionList` ノード）。null にはならない |

ゲッター: `getValue()`

例:

```apex
for (Integer i = 0, j = 10; i < j; i++, j--) { ... }
```

```json
{
    "type": "forUpdate",
    "value": {
        "type": "expressionList",
        "value": [
            { "type": "postOpExpression", "operator": "...", "value": "..." },
            { "type": "postOpExpression", "operator": "...", "value": "..." }
        ]
    }
}
```

### `EnhancedForControlTypeClass`（enhancedForControl.ts）

- **type**: `'enhancedForControl'`
- **継承**: `ControlTypeClass<NormalIdTypeClass>`
- **元 Context**: `EnhancedForControlContext`（文法: `typeRef id COLON expression`）
- **役割**: 拡張 for（`for (Type x : collection)`）の制御部。ループ変数名・型・反復対象を持つ。

| 変数          | 型                                         | 内容                                         |
| ------------- | ------------------------------------------ | -------------------------------------------- |
| `type`        | `'enhancedForControl'`                     | 継承                                         |
| `value`       | `NormalIdTypeClass \| ErrorTypeClass`      | ループ変数名（`id` ノード）                  |
| `valueType`   | `TypeRefTypeClass \| ErrorTypeClass`       | ループ変数の型（`typeRef` ノード）           |
| `fromVariant` | `ExpressionAllTypeClass \| ErrorTypeClass` | 反復対象の式（変数、SOQL、`Trigger.new` 等） |

ゲッター: `getValue()`, `getValueType()`, `getFromVariant()`

例:

```apex
for (Account account : accounts) { ... }
```

```json
{
    "type": "enhancedForControl",
    "value": { "type": "id", "value": "account" },
    "valueType": {
        "type": "typeRef",
        "value": [{ "type": "typeName", "value": "...", "generic": null }],
        "dimension": { "type": "arraySubscripts", "value": 0 }
    },
    "fromVariant": { "type": "primaryExpression", "value": { "type": "idPrimary", "value": "..." } }
}
```

### `WhenControlTypeClass`（whenControl.ts）

- **type**: `'whenControl'`
- **継承**: `ControlTypeClass<WhenValueTypeClass>`
- **元 Context**: `WhenControlContext`（文法: `WHEN whenValue block`）
- **役割**: `switch on` 文の `when` 節 1 個。マッチ条件と実行ブロックを持つ。

| 変数    | 型                                       | 内容                                                                |
| ------- | ---------------------------------------- | ------------------------------------------------------------------- |
| `type`  | `'whenControl'`                          | 継承                                                                |
| `value` | `WhenValueTypeClass \| ErrorTypeClass`   | マッチ条件（`whenValue` ノード。リテラル列・型パターン・`else` 等） |
| `block` | `NormalBlockTypeClass \| ErrorTypeClass` | 節の本体ブロック（`block` ノード）                                  |

ゲッター: `getValue()`, `getBlock()`

例:

```apex
switch on value {
    when 'B', 'C' { ... }
}
switch on obj {
    when Account a { return a.Name; }
}
```

```json
{
    "type": "whenControl",
    "value": { "type": "whenValue", "value": ["...", "..."], "valueType": null },
    "block": { "type": "block", "value": ["..."] }
}
```

```json
{
    "type": "whenControl",
    "value": {
        "type": "whenValue",
        "value": { "type": "id", "value": "a" },
        "valueType": {
            "type": "typeRef",
            "value": [
                {
                    "type": "typeName",
                    "value": { "type": "id", "value": "Account" },
                    "generic": null
                }
            ],
            "dimension": "..."
        }
    },
    "block": {
        "type": "block",
        "value": [{ "type": "statement", "value": { "type": "returnStatement", "value": "..." } }]
    }
}
```
