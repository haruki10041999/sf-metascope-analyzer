# callVisitor

メソッド呼び出しを扱う。レシーバ無しの呼び出し（`hook()`、`this(...)`、`super(...)`）と、`.` の右側に来る呼び出し（`String.valueOf(...)` の `valueOf(...)` 部分）の 2 種類。

## Visitor

`CallVisitor` が扱う Context と生成する TypeClass:

| visit メソッド       | Context                | 生成する TypeClass       |
| -------------------- | ---------------------- | ------------------------ |
| `visitMethodCall`    | `MethodCallContext`    | `MethodCallTypeClass`    |
| `visitDotMethodCall` | `DotMethodCallContext` | `DotMethodCallTypeClass` |

## 基底クラス（base.ts）

### `CallTypeClass<T, Tparam>`

呼び出し系ノードの共通基底。メソッド名と実引数を持つ。

| 変数    | 型                                 | 内容                                   |
| ------- | ---------------------------------- | -------------------------------------- |
| `type`  | `string`                           | ノード種別（CommonTypeClass から継承） |
| `value` | `T \| ErrorTypeClass`              | 呼び出すメソッド名                     |
| `param` | `Tparam \| ErrorTypeClass \| null` | 実引数。引数なし `()` の場合は `null`  |

ゲッター: `getValue()`, `getParam()`, `getType()`（継承）

### `isCallType`

`target instanceof CallTypeClass` を判定するガード（`CallTypeClass<unknown, unknown>` に絞り込む）。

## TypeClass

### `MethodCallTypeClass`（methodCall.ts）

- **type**: `'methodCall'`
- **継承**: `CallTypeClass<NormalIdTypeClass | null, ExpressionListTypeClass>`
- **元 Context**: `MethodCallContext`（文法: `id LPAREN expressionList? RPAREN | THIS LPAREN expressionList? RPAREN | SUPER LPAREN expressionList? RPAREN`）
- **役割**: レシーバ無しのメソッド呼び出し、または `this(...)` / `super(...)` によるコンストラクタ呼び出し。

| 変数        | 型                                                  | 内容                                                                            |
| ----------- | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `type`      | `'methodCall'`                                      | 継承                                                                            |
| `value`     | `NormalIdTypeClass \| null \| ErrorTypeClass`       | メソッド名（`id` ノード）。`this(...)` / `super(...)` の場合は `null`           |
| `param`     | `ExpressionListTypeClass \| ErrorTypeClass \| null` | 実引数（`expressionList` ノード）。引数なしは `null`                            |
| `reference` | `string \| null`                                    | `this(...)` なら `'this'`、`super(...)` なら `'super'`、通常の呼び出しは `null` |

ゲッター: `getValue()`, `getParam()`, `getReference()`

例:

```apex
this('default');
super();
hook();
```

```json
{
    "type": "methodCall",
    "value": null,
    "param": { "type": "expressionList", "value": ["..."] },
    "reference": "this"
}
```

```json
{ "type": "methodCall", "value": null, "param": null, "reference": "super" }
```

```json
{
    "type": "methodCall",
    "value": { "type": "id", "value": "hook" },
    "param": null,
    "reference": null
}
```

### `DotMethodCallTypeClass`（dotMethodCall.ts）

- **type**: `'dotMethodCall'`
- **継承**: `CallTypeClass<AnyIdTypeClass, ExpressionListTypeClass>`
- **元 Context**: `DotMethodCallContext`（文法: `anyId LPAREN expressionList? RPAREN`）
- **役割**: `expr.method(...)` の `.` より右側の呼び出し部分。レシーバは親の `dotExpression` 側が持つ。

| 変数    | 型                                                  | 内容                                                 |
| ------- | --------------------------------------------------- | ---------------------------------------------------- |
| `type`  | `'dotMethodCall'`                                   | 継承                                                 |
| `value` | `AnyIdTypeClass \| ErrorTypeClass`                  | メソッド名（`anyId` ノード。予約語も可）             |
| `param` | `ExpressionListTypeClass \| ErrorTypeClass \| null` | 実引数（`expressionList` ノード）。引数なしは `null` |

ゲッター: `getValue()`, `getParam()`

例:

```apex
return String.valueOf(recordId);
```

```json
{
    "type": "dotMethodCall",
    "value": { "type": "anyId", "value": "valueOf" },
    "param": {
        "type": "expressionList",
        "value": [{ "type": "primaryExpression", "value": "..." }]
    }
}
```
