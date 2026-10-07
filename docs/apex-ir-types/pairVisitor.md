# pairVisitor

左右 2 要素の組（アノテーション引数 `name=value`、`new` の型名と型引数、Map 初期化子の `key => value`）と、その一覧を IR に変換する。
子要素の変換に失敗した場合、そのフィールドには `ErrorTypeClass`（`type: 'AnalyzerError'`、`contextType` / `context` / `errorMessage`）が入る。

## Visitor

| visit メソッド            | Context                     | 生成する TypeClass            |
| ------------------------- | --------------------------- | ----------------------------- |
| `visitIdCreatedNamePair`  | `IdCreatedNamePairContext`  | `IdCreatedNamePairTypeClass`  |
| `visitElementValuePair`   | `ElementValuePairContext`   | `ElementValuePairTypeClass`   |
| `visitMapCreatorRestPair` | `MapCreatorRestPairContext` | `MapCreatorRestPairTypeClass` |
| `visitElementValuePairs`  | `ElementValuePairsContext`  | `ElementValuePairsTypeClass`  |

## 基底クラス（base.ts）

### `PairTypeClass<Tleft, Tright>`

左右 2 要素を持つペアの基底。`value` は持たない。

| 変数    | 型                         | 内容                                   |
| ------- | -------------------------- | -------------------------------------- |
| `type`  | `string`                   | ノード種別（CommonTypeClass から継承） |
| `left`  | `Tleft \| ErrorTypeClass`  | 左要素                                 |
| `right` | `Tright \| ErrorTypeClass` | 右要素                                 |

ゲッター: `getLeft()`, `getRight()`, `getType()`

### `PairListTypeClass<T>`

ペアの配列を持つ基底。

| 変数    | 型                        | 内容                                   |
| ------- | ------------------------- | -------------------------------------- |
| `type`  | `string`                  | ノード種別（CommonTypeClass から継承） |
| `value` | `(T \| ErrorTypeClass)[]` | ペアの配列                             |

ゲッター: `getValue()`, `getType()`

### `PairAllTypeClass`（型エイリアス）

`PairTypeClass<unknown, unknown> | PairListTypeClass<unknown>`。`PairVisitor` の戻り値型。

### `isPairTypeAll(target)`（ガード関数）

`PairTypeClass` または `PairListTypeClass` のインスタンスなら `true`。

## TypeClass

### `ElementValuePairTypeClass`（elementValuePair.ts）

- **type**: `'elementValuePair'`
- **継承**: `PairTypeClass<NormalIdTypeClass, ElementValueTypeClass>`
- **元 Context**: `ElementValuePairContext`（文法: `id ASSIGN elementValue`）
- **役割**: アノテーション引数の `名前=値` 1 組。

| 変数    | 型                                        | 内容                       |
| ------- | ----------------------------------------- | -------------------------- |
| `type`  | `'elementValuePair'`                      | 継承                       |
| `left`  | `NormalIdTypeClass \| ErrorTypeClass`     | 引数名（`'id'`）           |
| `right` | `ElementValueTypeClass \| ErrorTypeClass` | 引数値（`'elementValue'`） |

ゲッター: `getLeft()`, `getRight()`

例:

```apex
@AuraEnabled(cacheable=true)
```

```json
{
    "type": "elementValuePair",
    "left": { "type": "id", "value": "cacheable" },
    "right": {
        "type": "elementValue",
        "value": { "type": "literal", "valueType": "boolean", "value": "true" }
    }
}
```

### `ElementValuePairsTypeClass`（elementValuePairs.ts）

- **type**: `'elementValuePairs'`
- **継承**: `PairListTypeClass<ElementValuePairTypeClass>`
- **元 Context**: `ElementValuePairsContext`（文法: `elementValuePair` の並び）
- **役割**: アノテーション引数 `名前=値` の一覧。`annotation` の引数部に入る。

| 変数    | 型                                                | 内容                                                              |
| ------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| `type`  | `'elementValuePairs'`                             | 継承                                                              |
| `value` | `(ElementValuePairTypeClass \| ErrorTypeClass)[]` | `'elementValuePair'` の配列。1 件以上（0 件なら `create` が例外） |

ゲッター: `getValue()`

例:

```apex
@AuraEnabled(cacheable=true)
```

```json
{
    "type": "elementValuePairs",
    "value": [{ "type": "elementValuePair", "left": "...", "right": "..." }]
}
```

### `IdCreatedNamePairTypeClass`（idCreatedNamePair.ts）

- **type**: `'idCreatedNamePair'`
- **継承**: `PairTypeClass<AnyIdTypeClass, TypeListTypeClass | null>`
- **元 Context**: `IdCreatedNamePairContext`（文法: `anyId (LT typeList GT)?`）
- **役割**: `new` 対象型名（`createdName`）のドット区切り 1 要素。名前と型引数を組にする。

| 変数    | 型                                            | 内容                                                                      |
| ------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `type`  | `'idCreatedNamePair'`                         | 継承                                                                      |
| `left`  | `AnyIdTypeClass \| ErrorTypeClass`            | 型名（`'anyId'`）                                                         |
| `right` | `TypeListTypeClass \| ErrorTypeClass \| null` | 型引数 `<...>`（`'typeList'`）。型引数なし（`new Account()` 等）は `null` |

ゲッター: `getLeft()`, `getRight()`

例:

```apex
new List<String>()
new Account(Name = 'Test', Industry = 'Technology')
```

```json
{"type":"idCreatedNamePair","left":{"type":"anyId","value":"List"},"right":{"type":"typeList","value":["..."]}}
{"type":"idCreatedNamePair","left":{"type":"anyId","value":"Account"},"right":null}
```

### `MapCreatorRestPairTypeClass`（mapCreatorRestPair.ts）

- **type**: `'mapCreatorRestPair'`
- **継承**: `PairTypeClass<ExpressionAllTypeClass, ExpressionAllTypeClass>`
- **元 Context**: `MapCreatorRestPairContext`（文法: `expression MAPTO expression`）
- **役割**: Map 初期化子の `key => value` 1 組。`MapCreatorRestTypeClass` の `value` 要素。

| 変数    | 型                                         | 内容     |
| ------- | ------------------------------------------ | -------- |
| `type`  | `'mapCreatorRestPair'`                     | 継承     |
| `left`  | `ExpressionAllTypeClass \| ErrorTypeClass` | キーの式 |
| `right` | `ExpressionAllTypeClass \| ErrorTypeClass` | 値の式   |

ゲッター: `getLeft()`, `getRight()`

例:

```apex
new Map<String, Integer>{ 'a' => 1, 'b' => 2 }
```

```json
{
    "type": "mapCreatorRestPair",
    "left": { "type": "primaryExpression", "value": { "type": "literalPrimary", "value": "..." } },
    "right": { "type": "primaryExpression", "value": { "type": "literalPrimary", "value": "..." } }
}
```
