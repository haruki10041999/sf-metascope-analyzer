# argumentsVisitor

括弧で囲まれた引数列を扱う。コンストラクタ呼び出し等の実引数 `( ... )` と、ジェネリクスの型引数 `< ... >` の 2 種類。

## Visitor

`ArgumentsVisitor` が扱う Context と生成する TypeClass:

| visit メソッド       | Context                | 生成する TypeClass         |
| -------------------- | ---------------------- | -------------------------- |
| `visitArguments`     | `ArgumentsContext`     | `NormalArgumentsTypeClass` |
| `visitTypeArguments` | `TypeArgumentsContext` | `TypeArgumentsTypeClass`   |

## 基底クラス（base.ts）

### `ArgumentsTypeClass<T>`

引数系ノードの共通基底。中身が空のとき `value` が `null` になりうる。

| 変数    | 型                            | 内容                                                         |
| ------- | ----------------------------- | ------------------------------------------------------------ |
| `type`  | `string`                      | ノード種別（CommonTypeClass から継承）                       |
| `value` | `T \| ErrorTypeClass \| null` | 括弧内のリスト。空なら `null`、変換失敗時は `ErrorTypeClass` |

ゲッター: `getValue()`, `getType()`（継承）

### `isArugumentsTypeAll`

`target instanceof ArgumentsTypeClass` を判定するガード（`ArgumentsTypeClass<unknown>` に絞り込む）。※関数名は綴りが `Arug...` のまま。

## TypeClass

### `NormalArgumentsTypeClass`（normal.ts）

- **type**: `'arguments'`
- **継承**: `ArgumentsTypeClass<ExpressionListTypeClass>`
- **元 Context**: `ArgumentsContext`（文法: `LPAREN expressionList? RPAREN`）
- **役割**: `new Xxx(...)` などの実引数リスト。

| 変数    | 型                                                  | 内容                                                              |
| ------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| `type`  | `'arguments'`                                       | 継承                                                              |
| `value` | `ExpressionListTypeClass \| ErrorTypeClass \| null` | 実引数の式リスト（`expressionList` ノード）。`()` の場合は `null` |

ゲッター: `getValue()`

例:

```apex
Account account = new Account(Name = 'Test', Industry = 'Technology');
```

```json
{
    "type": "arguments",
    "value": {
        "type": "expressionList",
        "value": [
            {
                "type": "assignExpression",
                "left": { "type": "primaryExpression", "value": "..." },
                "right": { "type": "primaryExpression", "value": "..." },
                "operator": "="
            },
            { "type": "assignExpression", "left": "...", "right": "...", "operator": "=" }
        ]
    }
}
```

```json
{ "type": "arguments", "value": null }
```

### `TypeArgumentsTypeClass`（typeArguments.ts）

- **type**: `'typeArguments'`
- **継承**: `ArgumentsTypeClass<TypeListTypeClass>`
- **元 Context**: `TypeArgumentsContext`（文法: `LT typeList GT`）
- **役割**: ジェネリクスの型引数 `<...>`。`typeName` の `generic` に入る。

| 変数    | 型                                            | 内容                                                                |
| ------- | --------------------------------------------- | ------------------------------------------------------------------- |
| `type`  | `'typeArguments'`                             | 継承                                                                |
| `value` | `TypeListTypeClass \| ErrorTypeClass \| null` | 型引数のリスト（`typeList` ノード）。`typeList` が無い場合は `null` |

ゲッター: `getValue()`

例:

```apex
List<String> stringList = new List<String>();
```

```json
{
    "type": "typeArguments",
    "value": {
        "type": "typeList",
        "value": [
            {
                "type": "typeRef",
                "value": [
                    {
                        "type": "typeName",
                        "value": { "type": "id", "value": "String" },
                        "generic": null
                    }
                ],
                "dimension": { "type": "arraySubscripts", "value": 0 }
            }
        ]
    }
}
```
