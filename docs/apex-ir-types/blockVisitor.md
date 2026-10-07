# blockVisitor

`{ ... }` で囲まれるブロック系の文法要素を扱う。通常ブロック（`block`）、`finally` ブロック、プロパティの `get` / `set` アクセサ、トリガー本体、匿名 Apex 本体を IR に変換する。
子フィールドは変換失敗時に `ErrorTypeClass`（`type: 'AnalyzerError'`, `contextType` / `context` / `errorMessage`）になり得る。

## Visitor

`BlockVisitor` が扱う Context と生成する TypeClass:

| visit メソッド        | Context                 | 生成する TypeClass        |
| --------------------- | ----------------------- | ------------------------- |
| `visitBlock`          | `BlockContext`          | `NormalBlockTypeClass`    |
| `visitFinallyBlock`   | `FinallyBlockContext`   | `FinallyBlockTypeClass`   |
| `visitPropertyBlock`  | `PropertyBlockContext`  | `PropertyBlockTypeClass`  |
| `visitAnonymousBlock` | `AnonymousBlockContext` | `AnonymousBlockTypeClass` |
| `visitTriggerBlock`   | `TriggerBlockContext`   | `TriggerBlockTypeClass`   |
| `visitGetter`         | `GetterContext`         | `GetterTypeClass`         |
| `visitSetter`         | `SetterContext`         | `SetterTypeClass`         |

## 基底クラス（base.ts）

### `BlockTypeClass<T>`

単一の子ノードを `value` に持つブロックノードの基底。

| 変数    | 型                    | 内容                                   |
| ------- | --------------------- | -------------------------------------- |
| `type`  | `string`              | ノード種別（CommonTypeClass から継承） |
| `value` | `T \| ErrorTypeClass` | 子ノード                               |

ゲッター: `getValue()`, `getType()`（CommonTypeClass）

### `BlockListTypeClass<T>`

子ノードの配列を `value` に持つブロックノードの基底。

| 変数    | 型                        | 内容                                   |
| ------- | ------------------------- | -------------------------------------- |
| `type`  | `string`                  | ノード種別（CommonTypeClass から継承） |
| `value` | `(T \| ErrorTypeClass)[]` | 子ノードの配列                         |

ゲッター: `getValue()`, `getType()`（CommonTypeClass）

### `BlockAllTypeClass`

`BlockTypeClass<unknown> | BlockListTypeClass<unknown>` の union 型。`BlockVisitor` の戻り値型に使う。

### `isBlockTypeAll`

`target` が `BlockTypeClass` または `BlockListTypeClass` のインスタンスかを判定するガード。

## TypeClass

### `NormalBlockTypeClass`（normal.ts）

- **type**: `'block'`
- **継承**: `BlockListTypeClass<NormalStatementTypeClass>`
- **元 Context**: `BlockContext`（文法: `LBRACE statement* RBRACE`）
- **役割**: 文の並びを持つ通常のブロック。メソッド本体・コンストラクタ本体・制御文の本体・初期化子などで使われる。

| 変数    | 型                                               | 内容                                                                       |
| ------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| `type`  | `'block'`                                        | 継承                                                                       |
| `value` | `(NormalStatementTypeClass \| ErrorTypeClass)[]` | ブロック内の文（statementVisitor の `statement`）。空ブロック `{}` は `[]` |

ゲッター: `getValue()`（継承）。ガード: `isNormalBlockType`

例:

```apex
{
    counter = 0;
}
```

```json
{
    "type": "block",
    "value": [{ "type": "statement", "value": { "type": "expressionStatement", "...": "..." } }]
}
```

### `FinallyBlockTypeClass`（finallyBlock.ts）

- **type**: `'finallyBlock'`
- **継承**: `BlockTypeClass<NormalBlockTypeClass>`
- **元 Context**: `FinallyBlockContext`（文法: `FINALLY block`）
- **役割**: `try` 文の `finally` 節。

| 変数    | 型                                       | 内容                     |
| ------- | ---------------------------------------- | ------------------------ |
| `type`  | `'finallyBlock'`                         | 継承                     |
| `value` | `NormalBlockTypeClass \| ErrorTypeClass` | `finally` の本体ブロック |

ゲッター: `getValue()`（継承）。ガード: `isFinallyBlockType`

例:

```apex
finally {
    System.debug('finally');
}
```

```json
{
    "type": "finallyBlock",
    "value": {
        "type": "block",
        "value": [{ "type": "statement", "value": { "type": "expressionStatement", "...": "..." } }]
    }
}
```

### `PropertyBlockTypeClass`（propertyBlock.ts）

- **type**: `'propertyBlock'`
- **継承**: `BlockTypeClass<GetterTypeClass | SetterTypeClass>`
- **元 Context**: `PropertyBlockContext`（文法: `modifier* (getter | setter)`）
- **役割**: プロパティ宣言内の `get` / `set` アクセサ 1 つと、そのアクセサ修飾子。

| 変数       | 型                                                     | 内容                                                                                                        |
| ---------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `type`     | `'propertyBlock'`                                      | 継承                                                                                                        |
| `value`    | `GetterTypeClass \| SetterTypeClass \| ErrorTypeClass` | `get` なら `getter`、`set` なら `setter`                                                                    |
| `modifier` | `(NormalModifierTypeClass \| ErrorTypeClass)[]`        | アクセサの修飾子（`private set` の `PRIVATE` 等。値の一覧は declarationVisitor.md 冒頭参照）。無ければ `[]` |

ゲッター: `getValue()`（継承）, `getModifier()`。ガード: `isPropertyBlockType`

例:

```apex
public Integer readOnlyProperty { get; private set; }
```

```json
[
    { "type": "propertyBlock", "value": { "type": "getter", "value": null }, "modifier": [] },
    {
        "type": "propertyBlock",
        "value": { "type": "setter", "value": null },
        "modifier": [{ "type": "modifier", "value": "PRIVATE" }]
    }
]
```

### `GetterTypeClass`（getter.ts）

- **type**: `'getter'`
- **継承**: `BlockTypeClass<NormalBlockTypeClass | null>`
- **元 Context**: `GetterContext`（文法: `GET (SEMI | block)`）
- **役割**: プロパティの `get` アクセサ。

| 変数    | 型                                               | 内容                                                  |
| ------- | ------------------------------------------------ | ----------------------------------------------------- |
| `type`  | `'getter'`                                       | 継承                                                  |
| `value` | `NormalBlockTypeClass \| ErrorTypeClass \| null` | アクセサ本体。自動プロパティ（`get;`）の場合は `null` |

ゲッター: `getValue()`（継承）。ガード: `isGetterType`

例:

```apex
get { return counter == null ? 0 : counter; }
```

```json
{ "type": "getter", "value": { "type": "block", "value": ["..."] } }
```

### `SetterTypeClass`（setter.ts）

- **type**: `'setter'`
- **継承**: `BlockTypeClass<NormalBlockTypeClass | null>`
- **元 Context**: `SetterContext`（文法: `SET (SEMI | block)`）
- **役割**: プロパティの `set` アクセサ。

| 変数    | 型                                               | 内容                                                  |
| ------- | ------------------------------------------------ | ----------------------------------------------------- |
| `type`  | `'setter'`                                       | 継承                                                  |
| `value` | `NormalBlockTypeClass \| ErrorTypeClass \| null` | アクセサ本体。自動プロパティ（`set;`）の場合は `null` |

ゲッター: `getValue()`（継承）。ガード: `isSetterType`

例:

```apex
set;
```

```json
{ "type": "setter", "value": null }
```

### `AnonymousBlockTypeClass`（anonymousBlock.ts）

- **type**: `'anonymousBlock'`
- **継承**: `BlockListTypeClass<AnonymousBlockMemberTypeClass>`
- **元 Context**: `AnonymousBlockContext`（文法: `anonymousBlockMember*`）
- **役割**: 匿名 Apex 全体の本体。メンバー宣言と文の並び。

| 変数    | 型                                                    | 内容                                                                            |
| ------- | ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| `type`  | `'anonymousBlock'`                                    | 継承                                                                            |
| `value` | `(AnonymousBlockMemberTypeClass \| ErrorTypeClass)[]` | 各メンバー（memberVisitor の `anonymousBlockMember`）。メンバーが 0 件なら `[]` |

ゲッター: `getValue()`（継承）。ガード: `isAnonymousBlockType`

例:

```apex
public class AnonymousHelper { ... }
System.debug('x');
```

```json
{
    "type": "anonymousBlock",
    "value": [
        {
            "type": "anonymousBlockMember",
            "value": { "type": "anonymousMemberDeclaration", "...": "..." },
            "modifier": [{ "type": "modifier", "value": "PUBLIC" }]
        },
        {
            "type": "anonymousBlockMember",
            "value": { "type": "statement", "...": "..." },
            "modifier": []
        }
    ]
}
```

### `TriggerBlockTypeClass`（triggerBlock.ts）

- **type**: `'triggerBlock'`
- **継承**: `BlockListTypeClass<TriggerBlockMemberTypeClass>`
- **元 Context**: `TriggerBlockContext`（文法: `LBRACE triggerBlockMember* RBRACE`）
- **役割**: トリガー本体。メンバー宣言と文の並び。

| 変数    | 型                                                  | 内容                                                                         |
| ------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| `type`  | `'triggerBlock'`                                    | 継承                                                                         |
| `value` | `(TriggerBlockMemberTypeClass \| ErrorTypeClass)[]` | 各メンバー（memberVisitor の `triggerBlockMember`）。本体が空 `{}` なら `[]` |

ゲッター: `getValue()`（継承）。ガード: `isTriggerBlockType`

例:

```apex
{
    System.debug(Trigger.isExecuting);
    private static final String PREFIX = 'Trigger: ';
}
```

```json
{
    "type": "triggerBlock",
    "value": [
        {
            "type": "triggerBlockMember",
            "value": { "type": "statement", "...": "..." },
            "modifier": []
        },
        {
            "type": "triggerBlockMember",
            "value": { "type": "triggerMemberDeclaration", "...": "..." },
            "modifier": [{ "type": "modifier", "value": "PRIVATE" }, "..."]
        }
    ]
}
```
