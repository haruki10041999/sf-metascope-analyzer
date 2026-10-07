# restVisitor

`new` 式の `creator`（生成する型名と、それに続く「残り部分」= コンストラクタ引数・配列サイズ/初期化子・Map/Set 初期化子・空の `{}`）を IR に変換する。`CreatorTypeClass` は `NewExpressionTypeClass`（`'newExpression'`）の `value` に入る。
子要素の変換に失敗した場合、そのフィールドには `ErrorTypeClass`（`type: 'AnalyzerError'`、`contextType` / `context` / `errorMessage`）が入る。

## Visitor

| visit メソッド          | Context                   | 生成する TypeClass          |
| ----------------------- | ------------------------- | --------------------------- |
| `visitNoRest`           | `NoRestContext`           | `NoRestTypeClass`           |
| `visitClassCreatorRest` | `ClassCreatorRestContext` | `ClassCreatorRestTypeClass` |
| `visitArrayCreatorRest` | `ArrayCreatorRestContext` | `ArrayCreatorRestTypeClass` |
| `visitMapCreatorRest`   | `MapCreatorRestContext`   | `MapCreatorRestTypeClass`   |
| `visitSetCreatorRest`   | `SetCreatorRestContext`   | `SetCreatorRestTypeClass`   |
| `visitCreator`          | `CreatorContext`          | `CreatorTypeClass`          |

## 基底クラス（base.ts）

### `RestTypeClass<T>`

単一の `value` を持つ rest ノードの基底（`CreatorTypeClass` もこれを継承）。

| 変数    | 型                    | 内容                                   |
| ------- | --------------------- | -------------------------------------- |
| `type`  | `string`              | ノード種別（CommonTypeClass から継承） |
| `value` | `T \| ErrorTypeClass` | ノードの主要素                         |

ゲッター: `getValue()`, `getType()`

### `RestListTypeClass<T>`

`value` が配列の rest ノードの基底（Map / Set 初期化子が使用）。

| 変数    | 型                        | 内容                                   |
| ------- | ------------------------- | -------------------------------------- |
| `type`  | `string`                  | ノード種別（CommonTypeClass から継承） |
| `value` | `(T \| ErrorTypeClass)[]` | 要素の配列                             |

ゲッター: `getValue()`, `getType()`

### `RestAllTypeClass`（型エイリアス）

`RestTypeClass<unknown> | RestListTypeClass<unknown>`。`RestVisitor` の戻り値型、および `CreatorTypeClass.content` の型。

### `isRestTypeAll(target)`（ガード関数）

`RestTypeClass` または `RestListTypeClass` のインスタンスなら `true`。

## TypeClass

### `CreatorTypeClass`（creator.ts）

- **type**: `'creator'`
- **継承**: `RestTypeClass<CreatedNameTypeClass>`
- **元 Context**: `CreatorContext`（文法: `createdName (noRest | classCreatorRest | arrayCreatorRest | mapCreatorRest | setCreatorRest)`）
- **役割**: `new` の対象型名と、続く rest 部分を組にして保持する。

| 変数      | 型                                       | 内容                                                                                                                                                        |
| --------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`    | `'creator'`                              | 継承                                                                                                                                                        |
| `value`   | `CreatedNameTypeClass \| ErrorTypeClass` | 生成する型名（`'createdName'`）                                                                                                                             |
| `content` | `RestAllTypeClass \| ErrorTypeClass`     | rest 部分。`NoRestTypeClass` / `ClassCreatorRestTypeClass` / `ArrayCreatorRestTypeClass` / `MapCreatorRestTypeClass` / `SetCreatorRestTypeClass` のいずれか |

ゲッター: `getValue()`, `getContent()`

例:

```apex
public List<String> names = new List<String>();
```

```json
{
    "type": "creator",
    "value": { "type": "createdName", "value": ["..."] },
    "content": { "type": "classCreatorRest", "value": { "type": "arguments", "value": null } }
}
```

### `NoRestTypeClass`（noRest.ts）

- **type**: `'noRest'`
- **継承**: `RestTypeClass<string>`
- **元 Context**: `NoRestContext`（文法: `LBRACE RBRACE`）
- **役割**: 空の初期化子 `{}`（例: `new Set<String>{}`）。

| 変数    | 型         | 内容                      |
| ------- | ---------- | ------------------------- |
| `type`  | `'noRest'` | 継承                      |
| `value` | `string`   | `ctx.getText()`（`'{}'`） |

ゲッター: `getValue()`

例:

```apex
Set<String> emptySet = new Set<String>{};
```

```json
{ "type": "noRest", "value": "{}" }
```

### `ClassCreatorRestTypeClass`（classCreatorRest.ts）

- **type**: `'classCreatorRest'`
- **継承**: `RestTypeClass<NormalArgumentsTypeClass>`
- **元 Context**: `ClassCreatorRestContext`（文法: `arguments`）
- **役割**: コンストラクタ呼び出しの引数部 `(...)`。

| 変数    | 型                                           | 内容                                                                             |
| ------- | -------------------------------------------- | -------------------------------------------------------------------------------- |
| `type`  | `'classCreatorRest'`                         | 継承                                                                             |
| `value` | `NormalArgumentsTypeClass \| ErrorTypeClass` | 引数（`'arguments'`）。引数なし `()` の場合は `arguments` 側の `value` が `null` |

ゲッター: `getValue()`

例:

```apex
new List<String>()
```

```json
{ "type": "classCreatorRest", "value": { "type": "arguments", "value": null } }
```

### `ArrayCreatorRestTypeClass`（arrayCreatorRest.ts）

- **type**: `'arrayCreatorRest'`
- **継承**: `RestTypeClass<ArrayInitializerTypeClass | null>`
- **元 Context**: `ArrayCreatorRestContext`（文法: `LBRACK expression RBRACK | LBRACK RBRACK arrayInitializer`）
- **役割**: 配列生成。サイズ指定形式と初期化子形式のどちらか一方を持つ。

| 変数    | 型                                                    | 内容                                                                 |
| ------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| `type`  | `'arrayCreatorRest'`                                  | 継承                                                                 |
| `value` | `ArrayInitializerTypeClass \| ErrorTypeClass \| null` | 初期化子（`'arrayInitializer'`）。サイズ指定形式（`[n]`）では `null` |
| `size`  | `ExpressionAllTypeClass \| ErrorTypeClass \| null`    | 配列サイズの式。初期化子形式（`[] {...}`）では `null`                |

ゲッター: `getValue()`, `getSize()`

例:

```apex
List<String>[] arrayOfLists = new List<String>[2];
Integer[] numbers = new Integer[] { 1, 2, 3 };
```

```json
{"type":"arrayCreatorRest","value":null,"size":{"type":"primaryExpression","value":{"type":"literalPrimary","value":"..."}}}
{"type":"arrayCreatorRest","value":{"type":"arrayInitializer","value":[{"type":"primaryExpression","value":"..."},{"type":"primaryExpression","value":"..."},{"type":"primaryExpression","value":"..."}]},"size":null}
```

### `MapCreatorRestTypeClass`（mapCreatorRest.ts）

- **type**: `'mapCreatorRest'`
- **継承**: `RestListTypeClass<MapCreatorRestPairTypeClass>`
- **元 Context**: `MapCreatorRestContext`（文法: `LBRACE mapCreatorRestPair (COMMA mapCreatorRestPair)* RBRACE`）
- **役割**: Map の初期化子 `{ k => v, ... }`。

| 変数    | 型                                                  | 内容                                                                                 |
| ------- | --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `type`  | `'mapCreatorRest'`                                  | 継承                                                                                 |
| `value` | `(MapCreatorRestPairTypeClass \| ErrorTypeClass)[]` | キーと値のペア（`'mapCreatorRestPair'`）の配列。1 件以上（0 件なら `create` が例外） |

ゲッター: `getValue()`

例:

```apex
Map<String, Integer> initializedMap = new Map<String, Integer>{ 'a' => 1, 'b' => 2 };
```

```json
{
    "type": "mapCreatorRest",
    "value": [
        { "type": "mapCreatorRestPair", "left": "...", "right": "..." },
        { "type": "mapCreatorRestPair", "left": "...", "right": "..." }
    ]
}
```

### `SetCreatorRestTypeClass`（setCreatorRest.ts）

- **type**: `'setCreatorRest'`
- **継承**: `RestListTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `SetCreatorRestContext`（文法: `LBRACE expression (COMMA expression)* RBRACE`）
- **役割**: Set / List の初期化子 `{ e1, e2, ... }`。

| 変数    | 型                                             | 内容                                                 |
| ------- | ---------------------------------------------- | ---------------------------------------------------- |
| `type`  | `'setCreatorRest'`                             | 継承                                                 |
| `value` | `(ExpressionAllTypeClass \| ErrorTypeClass)[]` | 要素の式の配列。1 件以上（0 件なら `create` が例外） |

ゲッター: `getValue()`

例:

```apex
List<String> initializedList = new List<String>{ 'a', 'b' };
```

```json
{
    "type": "setCreatorRest",
    "value": [
        { "type": "primaryExpression", "value": "..." },
        { "type": "primaryExpression", "value": "..." }
    ]
}
```
