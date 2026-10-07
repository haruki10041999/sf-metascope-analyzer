# expressionVisitor

Apex の式（`expression` 規則のラベル付き代替）と、SOQL/SOSL の条件式・バインド式・データカテゴリ式を IR ノードに変換する。
各 TypeClass は `private` フィールドを持ち、IR は `JSON.stringify` の結果なので JSON キー = フィールド名（宣言順。基底クラスの `type` が先頭）となる。
子要素の生成・型検証に失敗した場合、その子は `ErrorTypeClass`（`{"type":"AnalyzerError","contextType":...,"context":...,"errorMessage":...}`）に置き換わる。`create()` 内で `throw` した場合は `CommonVisitor.visit` が捕捉し、ノード自体が `ErrorTypeClass` になる。

## Visitor

`ExpressionVisitor extends CommonVisitor<ExpressionAllTypeClass>`（index.ts）。

| visit メソッド                    | Context                             | 生成する TypeClass                    |
| --------------------------------- | ----------------------------------- | ------------------------------------- |
| `visitExpression`                 | `ExpressionContext`                 | `NormalExpressionTypeClass`           |
| `visitPrimaryExpression`          | `PrimaryExpressionContext`          | `PrimaryExpressionTypeClass`          |
| `visitDotExpression`              | `DotExpressionContext`              | `DotExpressionTypeClass`              |
| `visitArrayExpression`            | `ArrayExpressionContext`            | `ArrayExpressionTypeClass`            |
| `visitMethodCallExpression`       | `MethodCallExpressionContext`       | `MethodCallExpressionTypeClass`       |
| `visitNewExpression`              | `NewExpressionContext`              | `NewExpressionTypeClass`              |
| `visitCastExpression`             | `CastExpressionContext`             | `CastExpressionTypeClass`             |
| `visitSubExpression`              | `SubExpressionContext`              | `SubExpressionTypeClass`              |
| `visitPostOpExpression`           | `PostOpExpressionContext`           | `PostOpExpressionTypeClass`           |
| `visitPreOpExpression`            | `PreOpExpressionContext`            | `PreOpExpressionTypeClass`            |
| `visitNegExpression`              | `NegExpressionContext`              | `NegExpressionTypeClass`              |
| `visitArth1Expression`            | `Arth1ExpressionContext`            | `Arth1ExpressionTypeClass`            |
| `visitArth2Expression`            | `Arth2ExpressionContext`            | `Arth2ExpressionTypeClass`            |
| `visitBitExpression`              | `BitExpressionContext`              | `BitExpressionTypeClass`              |
| `visitCmpExpression`              | `CmpExpressionContext`              | `CmpExpressionTypeClass`              |
| `visitInstanceOfExpression`       | `InstanceOfExpressionContext`       | `InstanceOfExpressionTypeClass`       |
| `visitEqualityExpression`         | `EqualityExpressionContext`         | `EqualityExpressionTypeClass`         |
| `visitBitAndExpression`           | `BitAndExpressionContext`           | `BitAndExpressionTypeClass`           |
| `visitBitNotExpression`           | `BitNotExpressionContext`           | `BitNotExpressionTypeClass`           |
| `visitBitOrExpression`            | `BitOrExpressionContext`            | `BitOrExpressionTypeClass`            |
| `visitLogAndExpression`           | `LogAndExpressionContext`           | `LogAndExpressionTypeClass`           |
| `visitLogOrExpression`            | `LogOrExpressionContext`            | `LogOrExpressionTypeClass`            |
| `visitCoalExpression`             | `CoalExpressionContext`             | `CoalExpressionTypeClass`             |
| `visitCondExpression`             | `CondExpressionContext`             | `CondExpressionTypeClass`             |
| `visitAssignExpression`           | `AssignExpressionContext`           | `AssignExpressionTypeClass`           |
| `visitParExpression`              | `ParExpressionContext`              | `ParExpressionTypeClass`              |
| `visitBoundExpression`            | `BoundExpressionContext`            | `BoundExpressionTypeClass`            |
| `visitFilteringExpression`        | `FilteringExpressionContext`        | `FilteringExpressionTypeClass`        |
| `visitFieldExpression`            | `FieldExpressionContext`            | `FieldExpressionTypeClass`            |
| `visitConditionalExpression`      | `ConditionalExpressionContext`      | `ConditionalExpressionTypeClass`      |
| `visitLogicalExpression`          | `LogicalExpressionContext`          | `LogicalExpressionTypeClass`          |
| `visitWhereFieldExpression`       | `WhereFieldExpressionContext`       | `WhereFieldExpressionTypeClass`       |
| `visitWhereConditionalExpression` | `WhereConditionalExpressionContext` | `WhereConditionalExpressionTypeClass` |
| `visitWhereLogicalExpression`     | `WhereLogicalExpressionContext`     | `WhereLogicalExpressionTypeClass`     |

index.ts は base.ts を最初に `export *` し（循環 import 時の TDZ 回避）、各 TypeClass と `isXxxType` ガードを再エクスポートする。

## 基底クラス（base.ts）

### `ExpressionTypeClass<T>`

単一の子 `value` を持つ式。

| 変数    | 型                    | 内容                                   |
| ------- | --------------------- | -------------------------------------- |
| `type`  | `string`              | ノード種別（CommonTypeClass から継承） |
| `value` | `T \| ErrorTypeClass` | 子要素                                 |

ゲッター: `getType()`, `getValue()`

### `ExpressionListBaseTypeClass<T>`

子要素の配列 `value` を持つ式。

| 変数    | 型                        | 内容                                   |
| ------- | ------------------------- | -------------------------------------- |
| `type`  | `string`                  | ノード種別（CommonTypeClass から継承） |
| `value` | `(T \| ErrorTypeClass)[]` | 子要素の配列                           |

ゲッター: `getType()`, `getValue()`

### `SingleOperatorExpressionTypeClass<T>`

単項演算子式。JSON キー順は `type` → `operator` → `value`。

| 変数       | 型                    | 内容                                   |
| ---------- | --------------------- | -------------------------------------- |
| `type`     | `string`              | ノード種別（CommonTypeClass から継承） |
| `operator` | `string`              | 演算子文字列                           |
| `value`    | `T \| ErrorTypeClass` | 被演算子                               |

ゲッター: `getType()`, `getValue()`, `getOperator()`

### `DoubleOperatorExpressionTypeClass<Tleft, TOperator, Tright>`

二項演算子式。JSON キー順は `type` → `left` → `right` → `operator`。

| 変数       | 型                            | 内容                                   |
| ---------- | ----------------------------- | -------------------------------------- |
| `type`     | `string`                      | ノード種別（CommonTypeClass から継承） |
| `left`     | `Tleft \| ErrorTypeClass`     | 左辺                                   |
| `right`    | `Tright \| ErrorTypeClass`    | 右辺                                   |
| `operator` | `TOperator \| ErrorTypeClass` | 演算子                                 |

ゲッター: `getType()`, `getLeft()`, `getRight()`, `getOperator()`

### `ConditionExpressionTypeClass<TCondition, TTrue, TFalse>`

三項条件式。

| 変数         | 型                             | 内容                                   |
| ------------ | ------------------------------ | -------------------------------------- |
| `type`       | `string`                       | ノード種別（CommonTypeClass から継承） |
| `condition`  | `TCondition \| ErrorTypeClass` | 条件                                   |
| `trueValue`  | `TTrue \| ErrorTypeClass`      | 真の場合の値                           |
| `falseValue` | `TFalse \| ErrorTypeClass`     | 偽の場合の値                           |

ゲッター: `getType()`, `getCondition()`, `getTrueValue()`, `getFalseValue()`

### `ExpressionAllTypeClass` / `isExpressionTypeAll`

- `ExpressionAllTypeClass` = 上記 5 基底クラス（型引数 `unknown`）の union 型。
- `isExpressionTypeAll(target)` は上記 5 基底クラスのいずれかの `instanceof` を判定する。基底クラス単位の判定なので、SOQL 系（`fieldExpression` 等）を含むこのフォルダの全 TypeClass が true になる。

## TypeClass

### Apex 式

### `NormalExpressionTypeClass`（normal.ts）

- **type**: `'expression'`
- **継承**: `ExpressionTypeClass<string>`
- **元 Context**: `ExpressionContext`（文法: `expression` 規則の基底。全代替がラベル付き）
- **役割**: 式のソーステキスト（`ctx.getText()`、空白除去済み）をそのまま保持するフォールバック。`ExpressionContext` は自身で `accept` を持たないため通常は到達せず、サンプル IR にも出現しない。

| 変数    | 型                         | 内容           |
| ------- | -------------------------- | -------------- |
| `type`  | `string`                   | `'expression'` |
| `value` | `string \| ErrorTypeClass` | 式のテキスト   |

ゲッター: `getType()`, `getValue()`

### `PrimaryExpressionTypeClass`（primaryExpression.ts）

- **type**: `'primaryExpression'`
- **継承**: `ExpressionTypeClass<PrimaryTypeClass<unknown>>`
- **元 Context**: `PrimaryExpressionContext`（文法: `primary`）
- **役割**: リテラル・識別子・`this`・`super`・SOQL リテラル等の一次式を `PrimaryVisitor` で変換して包む。`primary()` が無い場合は throw。

| 変数    | 型                                            | 内容                                                      |
| ------- | --------------------------------------------- | --------------------------------------------------------- |
| `type`  | `string`                                      | `'primaryExpression'`                                     |
| `value` | `PrimaryTypeClass<unknown> \| ErrorTypeClass` | 一次式（`literalPrimary`, `idPrimary`, `thisPrimary` 等） |

ゲッター: `getType()`, `getValue()`

例:

```apex
public static final Integer MAX_SIZE = 100;
```

```json
{
    "type": "primaryExpression",
    "value": {
        "type": "literalPrimary",
        "value": { "type": "literal", "valueType": "integer", "value": "100" }
    }
}
```

### `DotExpressionTypeClass`（dotExpression.ts）

- **type**: `'dotExpression'`
- **継承**: `DoubleOperatorExpressionTypeClass<ExpressionAllTypeClass, string, AnyIdTypeClass | DotMethodCallTypeClass>`
- **元 Context**: `DotExpressionContext`（文法: `expression (DOT | QUESTIONDOT) (dotMethodCall | anyId)`）
- **役割**: メンバーアクセス／メソッド呼び出し（安全参照 `?.` 含む）。`anyId` があれば `anyId`、無ければ `dotMethodCall` を right に持つ。

| 変数       | 型                                                           | 内容                                                             |
| ---------- | ------------------------------------------------------------ | ---------------------------------------------------------------- |
| `type`     | `string`                                                     | `'dotExpression'`                                                |
| `left`     | `ExpressionAllTypeClass \| ErrorTypeClass`                   | レシーバ式                                                       |
| `right`    | `AnyIdTypeClass \| DotMethodCallTypeClass \| ErrorTypeClass` | フィールド名（`anyId`）またはメソッド呼び出し（`dotMethodCall`） |
| `operator` | `string \| ErrorTypeClass`                                   | `'.'` / `'?.'`                                                   |

ゲッター: `getType()`, `getLeft()`, `getRight()`, `getOperator()`

例:

```apex
this.name = name;
String safe = name?.toUpperCase();
```

```json
{"type":"dotExpression","left":{"type":"primaryExpression","value":{"type":"thisPrimary","value":"this"}},"right":{"type":"anyId","value":"name"},"operator":"."}
{"type":"dotExpression","left":{"type":"primaryExpression","value":{"type":"idPrimary","value":{"type":"id","value":"name"}}},"right":{"type":"dotMethodCall","value":{"type":"anyId","value":"toUpperCase"},"param":null},"operator":"?."}
```

### `ArrayExpressionTypeClass`（arrayExpression.ts）

- **type**: `'arrayExpression'`
- **継承**: `ExpressionListBaseTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `ArrayExpressionContext`（文法: `expression LBRACK expression RBRACK`）
- **役割**: 配列/リストの添字アクセス。`value[0]` が配列式、`value[1]` が添字式。`expression_list()` が空なら throw。

| 変数    | 型                                             | 内容                |
| ------- | ---------------------------------------------- | ------------------- |
| `type`  | `string`                                       | `'arrayExpression'` |
| `value` | `(ExpressionAllTypeClass \| ErrorTypeClass)[]` | `[配列式, 添字式]`  |

ゲッター: `getType()`, `getValue()`

例:

```apex
sized[0] = 'test';
```

```json
{
    "type": "arrayExpression",
    "value": [
        {
            "type": "primaryExpression",
            "value": { "type": "idPrimary", "value": { "type": "id", "value": "sized" } }
        },
        {
            "type": "primaryExpression",
            "value": {
                "type": "literalPrimary",
                "value": { "type": "literal", "valueType": "integer", "value": "0" }
            }
        }
    ]
}
```

### `MethodCallExpressionTypeClass`（methodCallExpression.ts）

- **type**: `'methodCallExpression'`
- **継承**: `ExpressionTypeClass<MethodCallTypeClass>`
- **元 Context**: `MethodCallExpressionContext`（文法: `methodCall`）
- **役割**: レシーバ無しのメソッド呼び出し（`foo()`, `this(...)`, `super(...)`）を `CallVisitor` で変換して包む。型不一致時の ErrorTypeClass の `contextType` は `'value'`。

| 変数    | 型                                      | 内容                             |
| ------- | --------------------------------------- | -------------------------------- |
| `type`  | `string`                                | `'methodCallExpression'`         |
| `value` | `MethodCallTypeClass \| ErrorTypeClass` | メソッド呼び出し（`methodCall`） |

ゲッター: `getType()`, `getValue()`

例:

```apex
this('default');
```

```json
{
    "type": "methodCallExpression",
    "value": {
        "type": "methodCall",
        "value": null,
        "param": {
            "type": "expressionList",
            "value": [
                {
                    "type": "primaryExpression",
                    "value": { "type": "literalPrimary", "value": "..." }
                }
            ]
        },
        "reference": "this"
    }
}
```

### `NewExpressionTypeClass`（newExpression.ts）

- **type**: `'newExpression'`
- **継承**: `ExpressionTypeClass<CreatorTypeClass>`
- **元 Context**: `NewExpressionContext`（文法: `NEW creator`）
- **役割**: `new` によるインスタンス生成。`creator` を `RestVisitor` で変換して包む。

| 変数    | 型                                   | 内容                  |
| ------- | ------------------------------------ | --------------------- |
| `type`  | `string`                             | `'newExpression'`     |
| `value` | `CreatorTypeClass \| ErrorTypeClass` | 生成内容（`creator`） |

ゲッター: `getType()`, `getValue()`

例:

```apex
public List<String> names = new List<String>();
```

```json
{
    "type": "newExpression",
    "value": {
        "type": "creator",
        "value": { "type": "createdName", "value": ["..."] },
        "content": { "type": "classCreatorRest", "value": { "type": "arguments", "value": null } }
    }
}
```

### `CastExpressionTypeClass`（castExpression.ts）

- **type**: `'castExpression'`
- **継承**: `ExpressionTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `CastExpressionContext`（文法: `LPAREN typeRef RPAREN expression`）
- **役割**: 型キャスト。キャスト対象式を `value`、キャスト先型を `valueType` に持つ。

| 変数        | 型                                         | 内容                        |
| ----------- | ------------------------------------------ | --------------------------- |
| `type`      | `string`                                   | `'castExpression'`          |
| `value`     | `ExpressionAllTypeClass \| ErrorTypeClass` | キャスト対象の式            |
| `valueType` | `TypeRefTypeClass \| ErrorTypeClass`       | キャスト先の型（`typeRef`） |

ゲッター: `getType()`, `getValue()`, `getValueType()`

例:

```apex
Account account = (Account) objectValue;
```

```json
{
    "type": "castExpression",
    "value": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "objectValue" } }
    },
    "valueType": {
        "type": "typeRef",
        "value": [
            { "type": "typeName", "value": { "type": "id", "value": "Account" }, "generic": null }
        ],
        "dimension": { "type": "arraySubscripts", "value": 0 }
    }
}
```

### `SubExpressionTypeClass`（subExpression.ts）

- **type**: `'subExpression'`
- **継承**: `ExpressionTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `SubExpressionContext`（文法: `LPAREN expression RPAREN`）
- **役割**: 式中の括弧によるグループ化。

| 変数    | 型                                         | 内容              |
| ------- | ------------------------------------------ | ----------------- |
| `type`  | `string`                                   | `'subExpression'` |
| `value` | `ExpressionAllTypeClass \| ErrorTypeClass` | 括弧内の式        |

ゲッター: `getType()`, `getValue()`

例:

```apex
flag = (a > 0 && b > 0) || (a < 0 && b < 0);
```

```json
{
    "type": "subExpression",
    "value": {
        "type": "logAndExpression",
        "left": { "type": "cmpExpression", "left": "...", "right": "...", "operator": ">" },
        "right": { "type": "cmpExpression", "left": "...", "right": "...", "operator": ">" },
        "operator": "&&"
    }
}
```

### `PostOpExpressionTypeClass`（postOpExpression.ts）

- **type**: `'postOpExpression'`
- **継承**: `SingleOperatorExpressionTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `PostOpExpressionContext`（文法: `expression (INC | DEC)`）
- **役割**: 後置インクリメント／デクリメント。

| 変数       | 型                                         | 内容                 |
| ---------- | ------------------------------------------ | -------------------- |
| `type`     | `string`                                   | `'postOpExpression'` |
| `operator` | `string`                                   | `'++'` / `'--'`      |
| `value`    | `ExpressionAllTypeClass \| ErrorTypeClass` | 被演算子             |

ゲッター: `getType()`, `getValue()`, `getOperator()`

例:

```apex
result++;
```

```json
{
    "type": "postOpExpression",
    "operator": "++",
    "value": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "result" } }
    }
}
```

### `PreOpExpressionTypeClass`（preOpExpression.ts）

- **type**: `'preOpExpression'`
- **継承**: `SingleOperatorExpressionTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `PreOpExpressionContext`（文法: `(ADD | SUB | INC | DEC) expression`）
- **役割**: 前置インクリメント／デクリメントと単項 `+` / `-`。

| 変数       | 型                                         | 内容                            |
| ---------- | ------------------------------------------ | ------------------------------- |
| `type`     | `string`                                   | `'preOpExpression'`             |
| `operator` | `string`                                   | `'++'` / `'--'` / `'+'` / `'-'` |
| `value`    | `ExpressionAllTypeClass \| ErrorTypeClass` | 被演算子                        |

ゲッター: `getType()`, `getValue()`, `getOperator()`

例:

```apex
result = -a;
```

```json
{
    "type": "preOpExpression",
    "operator": "-",
    "value": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "a" } }
    }
}
```

### `NegExpressionTypeClass`（negExpression.ts）

- **type**: `'negExpression'`
- **継承**: `SingleOperatorExpressionTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `NegExpressionContext`（文法: `(TILDE | BANG) expression`）
- **役割**: ビット反転 `~` と論理否定 `!`。

| 変数       | 型                                         | 内容              |
| ---------- | ------------------------------------------ | ----------------- |
| `type`     | `string`                                   | `'negExpression'` |
| `operator` | `string`                                   | `'~'` / `'!'`     |
| `value`    | `ExpressionAllTypeClass \| ErrorTypeClass` | 被演算子          |

ゲッター: `getType()`, `getValue()`, `getOperator()`

例:

```apex
result = ~a;
```

```json
{
    "type": "negExpression",
    "operator": "~",
    "value": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "a" } }
    }
}
```

### `Arth1ExpressionTypeClass`（arth1Expression.ts）

- **type**: `'arth1Expression'`
- **継承**: `DoubleOperatorExpressionTypeClass<ExpressionAllTypeClass, string, ExpressionAllTypeClass>`
- **元 Context**: `Arth1ExpressionContext`（文法: `expression (MUL | DIV) expression`）
- **役割**: 乗除算。`expression_list()` が 2 件でない場合は throw。

| 変数       | 型                                         | 内容                |
| ---------- | ------------------------------------------ | ------------------- |
| `type`     | `string`                                   | `'arth1Expression'` |
| `left`     | `ExpressionAllTypeClass \| ErrorTypeClass` | 左辺                |
| `right`    | `ExpressionAllTypeClass \| ErrorTypeClass` | 右辺                |
| `operator` | `string \| ErrorTypeClass`                 | `'*'` / `'/'`       |

ゲッター: `getType()`, `getLeft()`, `getRight()`, `getOperator()`

例:

```apex
result = a * b;
```

```json
{
    "type": "arth1Expression",
    "left": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "a" } }
    },
    "right": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "b" } }
    },
    "operator": "*"
}
```

### `Arth2ExpressionTypeClass`（arth2Expression.ts）

- **type**: `'arth2Expression'`
- **継承**: `DoubleOperatorExpressionTypeClass<ExpressionAllTypeClass, string, ExpressionAllTypeClass>`
- **元 Context**: `Arth2ExpressionContext`（文法: `expression (ADD | SUB) expression`）
- **役割**: 加減算（文字列連結を含む）。

| 変数       | 型                                         | 内容                |
| ---------- | ------------------------------------------ | ------------------- |
| `type`     | `string`                                   | `'arth2Expression'` |
| `left`     | `ExpressionAllTypeClass \| ErrorTypeClass` | 左辺                |
| `right`    | `ExpressionAllTypeClass \| ErrorTypeClass` | 右辺                |
| `operator` | `string \| ErrorTypeClass`                 | `'+'` / `'-'`       |

ゲッター: `getType()`, `getLeft()`, `getRight()`, `getOperator()`

例:

```apex
Integer result = a + b;
```

```json
{
    "type": "arth2Expression",
    "left": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "a" } }
    },
    "right": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "b" } }
    },
    "operator": "+"
}
```

### `BitExpressionTypeClass`（bitExpression.ts）

- **type**: `'bitExpression'`
- **継承**: `DoubleOperatorExpressionTypeClass<ExpressionAllTypeClass, string, ExpressionAllTypeClass>`
- **元 Context**: `BitExpressionContext`（文法: `expression (LT LT | GT GT GT | GT GT) expression`）
- **役割**: シフト演算。`LT` / `GT` トークン列を連結して演算子文字列を作る。

| 変数       | 型                                         | 内容                      |
| ---------- | ------------------------------------------ | ------------------------- |
| `type`     | `string`                                   | `'bitExpression'`         |
| `left`     | `ExpressionAllTypeClass \| ErrorTypeClass` | 左辺                      |
| `right`    | `ExpressionAllTypeClass \| ErrorTypeClass` | 右辺（シフト量）          |
| `operator` | `string \| ErrorTypeClass`                 | `'<<'` / `'>>'` / `'>>>'` |

ゲッター: `getType()`, `getLeft()`, `getRight()`, `getOperator()`

例:

```apex
result = a << 2;
```

```json
{
    "type": "bitExpression",
    "left": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "a" } }
    },
    "right": {
        "type": "primaryExpression",
        "value": {
            "type": "literalPrimary",
            "value": { "type": "literal", "valueType": "integer", "value": "2" }
        }
    },
    "operator": "<<"
}
```

### `CmpExpressionTypeClass`（cmpExpression.ts）

- **type**: `'cmpExpression'`
- **継承**: `DoubleOperatorExpressionTypeClass<ExpressionAllTypeClass, string, ExpressionAllTypeClass>`
- **元 Context**: `CmpExpressionContext`（文法: `expression (GT | LT) ASSIGN? expression`）
- **役割**: 大小比較。`<=` / `>=` は `LT`/`GT` と `ASSIGN` の 2 トークンから組み立てる。

| 変数       | 型                                         | 内容                            |
| ---------- | ------------------------------------------ | ------------------------------- |
| `type`     | `string`                                   | `'cmpExpression'`               |
| `left`     | `ExpressionAllTypeClass \| ErrorTypeClass` | 左辺                            |
| `right`    | `ExpressionAllTypeClass \| ErrorTypeClass` | 右辺                            |
| `operator` | `string \| ErrorTypeClass`                 | `'<'` / `'>'` / `'<='` / `'>='` |

ゲッター: `getType()`, `getLeft()`, `getRight()`, `getOperator()`

例:

```apex
Boolean flag = a < b;
```

```json
{
    "type": "cmpExpression",
    "left": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "a" } }
    },
    "right": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "b" } }
    },
    "operator": "<"
}
```

### `InstanceOfExpressionTypeClass`（instanceOfExpression.ts）

- **type**: `'instanceOfExpression'`
- **継承**: `DoubleOperatorExpressionTypeClass<ExpressionAllTypeClass, string, TypeRefTypeClass>`
- **元 Context**: `InstanceOfExpressionContext`（文法: `expression INSTANCEOF typeRef`）
- **役割**: 型判定。右辺は式ではなく型参照。

| 変数       | 型                                         | 内容                     |
| ---------- | ------------------------------------------ | ------------------------ |
| `type`     | `string`                                   | `'instanceOfExpression'` |
| `left`     | `ExpressionAllTypeClass \| ErrorTypeClass` | 判定対象の式             |
| `right`    | `TypeRefTypeClass \| ErrorTypeClass`       | 判定する型（`typeRef`）  |
| `operator` | `string \| ErrorTypeClass`                 | 常に `'instanceof'`      |

ゲッター: `getType()`, `getLeft()`, `getRight()`, `getOperator()`

例:

```apex
Boolean isAccount = objectValue instanceof Account;
```

```json
{
    "type": "instanceOfExpression",
    "left": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "objectValue" } }
    },
    "right": {
        "type": "typeRef",
        "value": [{ "type": "typeName", "value": "...", "generic": null }],
        "dimension": { "type": "arraySubscripts", "value": 0 }
    },
    "operator": "instanceof"
}
```

### `EqualityExpressionTypeClass`（equalityExpression.ts）

- **type**: `'equalityExpression'`
- **継承**: `DoubleOperatorExpressionTypeClass<ExpressionAllTypeClass, string, ExpressionAllTypeClass>`
- **元 Context**: `EqualityExpressionContext`（文法: `expression (TRIPLEEQUAL | TRIPLENOTEQUAL | EQUAL | NOTEQUAL | LESSANDGREATER) expression`）
- **役割**: 等価／非等価比較。

| 変数       | 型                                         | 内容                                         |
| ---------- | ------------------------------------------ | -------------------------------------------- |
| `type`     | `string`                                   | `'equalityExpression'`                       |
| `left`     | `ExpressionAllTypeClass \| ErrorTypeClass` | 左辺                                         |
| `right`    | `ExpressionAllTypeClass \| ErrorTypeClass` | 右辺                                         |
| `operator` | `string \| ErrorTypeClass`                 | `'==='` / `'!=='` / `'=='` / `'!='` / `'<>'` |

ゲッター: `getType()`, `getLeft()`, `getRight()`, `getOperator()`

例:

```apex
return counter == null ? 0 : counter;
```

```json
{
    "type": "equalityExpression",
    "left": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "counter" } }
    },
    "right": {
        "type": "primaryExpression",
        "value": {
            "type": "literalPrimary",
            "value": { "type": "literal", "valueType": "null", "value": "null" }
        }
    },
    "operator": "=="
}
```

### `BitAndExpressionTypeClass`（bitAndExpression.ts）

- **type**: `'bitAndExpression'`
- **継承**: `DoubleOperatorExpressionTypeClass<ExpressionAllTypeClass, string, ExpressionAllTypeClass>`
- **元 Context**: `BitAndExpressionContext`（文法: `expression BITAND expression`）
- **役割**: ビット AND。

| 変数       | 型                                         | 内容                 |
| ---------- | ------------------------------------------ | -------------------- |
| `type`     | `string`                                   | `'bitAndExpression'` |
| `left`     | `ExpressionAllTypeClass \| ErrorTypeClass` | 左辺                 |
| `right`    | `ExpressionAllTypeClass \| ErrorTypeClass` | 右辺                 |
| `operator` | `string \| ErrorTypeClass`                 | 常に `'&'`           |

ゲッター: `getType()`, `getLeft()`, `getRight()`, `getOperator()`

例:

```apex
result = a & b;
```

```json
{
    "type": "bitAndExpression",
    "left": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "a" } }
    },
    "right": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "b" } }
    },
    "operator": "&"
}
```

### `BitNotExpressionTypeClass`（bitNotExpression.ts）

- **type**: `'bitNotExpression'`
- **継承**: `DoubleOperatorExpressionTypeClass<ExpressionAllTypeClass, string, ExpressionAllTypeClass>`
- **元 Context**: `BitNotExpressionContext`（文法: `expression CARET expression`）
- **役割**: ビット XOR（`^`）。名前は BitNot だが二項演算子である点に注意（単項のビット反転 `~` は `negExpression`）。

| 変数       | 型                                         | 内容                 |
| ---------- | ------------------------------------------ | -------------------- |
| `type`     | `string`                                   | `'bitNotExpression'` |
| `left`     | `ExpressionAllTypeClass \| ErrorTypeClass` | 左辺                 |
| `right`    | `ExpressionAllTypeClass \| ErrorTypeClass` | 右辺                 |
| `operator` | `string \| ErrorTypeClass`                 | 常に `'^'`           |

ゲッター: `getType()`, `getLeft()`, `getRight()`, `getOperator()`

例:

```apex
result = a ^ b;
```

```json
{
    "type": "bitNotExpression",
    "left": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "a" } }
    },
    "right": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "b" } }
    },
    "operator": "^"
}
```

### `BitOrExpressionTypeClass`（bitOrExpression.ts）

- **type**: `'bitOrExpression'`
- **継承**: `DoubleOperatorExpressionTypeClass<ExpressionAllTypeClass, string, ExpressionAllTypeClass>`
- **元 Context**: `BitOrExpressionContext`（文法: `expression BITOR expression`）
- **役割**: ビット OR。

| 変数       | 型                                         | 内容                |
| ---------- | ------------------------------------------ | ------------------- |
| `type`     | `string`                                   | `'bitOrExpression'` |
| `left`     | `ExpressionAllTypeClass \| ErrorTypeClass` | 左辺                |
| `right`    | `ExpressionAllTypeClass \| ErrorTypeClass` | 右辺                |
| `operator` | `string \| ErrorTypeClass`                 | 常に `'\|'`         |

ゲッター: `getType()`, `getLeft()`, `getRight()`, `getOperator()`

例:

```apex
result = a | b;
```

```json
{
    "type": "bitOrExpression",
    "left": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "a" } }
    },
    "right": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "b" } }
    },
    "operator": "|"
}
```

### `LogAndExpressionTypeClass`（logAndExpression.ts）

- **type**: `'logAndExpression'`
- **継承**: `DoubleOperatorExpressionTypeClass<ExpressionAllTypeClass, string, ExpressionAllTypeClass>`
- **元 Context**: `LogAndExpressionContext`（文法: `expression AND expression`）
- **役割**: 論理 AND。

| 変数       | 型                                         | 内容                 |
| ---------- | ------------------------------------------ | -------------------- |
| `type`     | `string`                                   | `'logAndExpression'` |
| `left`     | `ExpressionAllTypeClass \| ErrorTypeClass` | 左辺                 |
| `right`    | `ExpressionAllTypeClass \| ErrorTypeClass` | 右辺                 |
| `operator` | `string \| ErrorTypeClass`                 | 常に `'&&'`          |

ゲッター: `getType()`, `getLeft()`, `getRight()`, `getOperator()`

例:

```apex
flag = flag && a > 0;
```

```json
{
    "type": "logAndExpression",
    "left": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "flag" } }
    },
    "right": {
        "type": "cmpExpression",
        "left": { "type": "primaryExpression", "value": "..." },
        "right": { "type": "primaryExpression", "value": "..." },
        "operator": ">"
    },
    "operator": "&&"
}
```

### `LogOrExpressionTypeClass`（logOrExpression.ts）

- **type**: `'logOrExpression'`
- **継承**: `DoubleOperatorExpressionTypeClass<ExpressionAllTypeClass, string, ExpressionAllTypeClass>`
- **元 Context**: `LogOrExpressionContext`（文法: `expression OR expression`）
- **役割**: 論理 OR。

| 変数       | 型                                         | 内容                |
| ---------- | ------------------------------------------ | ------------------- |
| `type`     | `string`                                   | `'logOrExpression'` |
| `left`     | `ExpressionAllTypeClass \| ErrorTypeClass` | 左辺                |
| `right`    | `ExpressionAllTypeClass \| ErrorTypeClass` | 右辺                |
| `operator` | `string \| ErrorTypeClass`                 | 常に `'\|\|'`       |

ゲッター: `getType()`, `getLeft()`, `getRight()`, `getOperator()`

例:

```apex
flag = flag || a < 0;
```

```json
{
    "type": "logOrExpression",
    "left": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "flag" } }
    },
    "right": {
        "type": "cmpExpression",
        "left": { "type": "primaryExpression", "value": "..." },
        "right": { "type": "primaryExpression", "value": "..." },
        "operator": "<"
    },
    "operator": "||"
}
```

### `CoalExpressionTypeClass`（coalExpression.ts）

- **type**: `'coalExpression'`
- **継承**: `DoubleOperatorExpressionTypeClass<ExpressionAllTypeClass, string, ExpressionAllTypeClass>`
- **元 Context**: `CoalExpressionContext`（文法: `expression COAL expression`）
- **役割**: null 合体演算子。

| 変数       | 型                                         | 内容                   |
| ---------- | ------------------------------------------ | ---------------------- |
| `type`     | `string`                                   | `'coalExpression'`     |
| `left`     | `ExpressionAllTypeClass \| ErrorTypeClass` | 左辺                   |
| `right`    | `ExpressionAllTypeClass \| ErrorTypeClass` | 左辺が null の場合の値 |
| `operator` | `string \| ErrorTypeClass`                 | 常に `'??'`            |

ゲッター: `getType()`, `getLeft()`, `getRight()`, `getOperator()`

例:

```apex
Integer coalesced = counter ?? 0;
```

```json
{
    "type": "coalExpression",
    "left": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "counter" } }
    },
    "right": {
        "type": "primaryExpression",
        "value": {
            "type": "literalPrimary",
            "value": { "type": "literal", "valueType": "integer", "value": "0" }
        }
    },
    "operator": "??"
}
```

### `CondExpressionTypeClass`（condExpression.ts）

- **type**: `'condExpression'`
- **継承**: `ConditionExpressionTypeClass<ExpressionAllTypeClass, ExpressionAllTypeClass, ExpressionAllTypeClass>`
- **元 Context**: `CondExpressionContext`（文法: `expression QUESTION expression COLON expression`）
- **役割**: 三項演算子。`expression_list()` が 3 件でない場合は throw。

| 変数         | 型                                         | 内容               |
| ------------ | ------------------------------------------ | ------------------ |
| `type`       | `string`                                   | `'condExpression'` |
| `condition`  | `ExpressionAllTypeClass \| ErrorTypeClass` | 条件式             |
| `trueValue`  | `ExpressionAllTypeClass \| ErrorTypeClass` | 真の場合の式       |
| `falseValue` | `ExpressionAllTypeClass \| ErrorTypeClass` | 偽の場合の式       |

ゲッター: `getType()`, `getCondition()`, `getTrueValue()`, `getFalseValue()`

例:

```apex
return counter == null ? 0 : counter;
```

```json
{
    "type": "condExpression",
    "condition": { "type": "equalityExpression", "left": "...", "right": "...", "operator": "==" },
    "trueValue": {
        "type": "primaryExpression",
        "value": {
            "type": "literalPrimary",
            "value": { "type": "literal", "valueType": "integer", "value": "0" }
        }
    },
    "falseValue": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "counter" } }
    }
}
```

### `AssignExpressionTypeClass`（assignExpression.ts）

- **type**: `'assignExpression'`
- **継承**: `DoubleOperatorExpressionTypeClass<ExpressionAllTypeClass, string, ExpressionAllTypeClass>`
- **元 Context**: `AssignExpressionContext`（文法: `expression (ASSIGN | ADD_ASSIGN | SUB_ASSIGN | MUL_ASSIGN | DIV_ASSIGN | AND_ASSIGN | OR_ASSIGN | XOR_ASSIGN | RSHIFT_ASSIGN | URSHIFT_ASSIGN | LSHIFT_ASSIGN) expression`）
- **役割**: 代入および複合代入。

| 変数       | 型                                         | 内容                                                                                                 |
| ---------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `type`     | `string`                                   | `'assignExpression'`                                                                                 |
| `left`     | `ExpressionAllTypeClass \| ErrorTypeClass` | 代入先                                                                                               |
| `right`    | `ExpressionAllTypeClass \| ErrorTypeClass` | 代入値                                                                                               |
| `operator` | `string \| ErrorTypeClass`                 | `'='` / `'+='` / `'-='` / `'*='` / `'/='` / `'&='` / `'\|='` / `'^='` / `'>>='` / `'>>>='` / `'<<='` |

ゲッター: `getType()`, `getLeft()`, `getRight()`, `getOperator()`

例:

```apex
counter = 0;
```

```json
{
    "type": "assignExpression",
    "left": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "counter" } }
    },
    "right": {
        "type": "primaryExpression",
        "value": {
            "type": "literalPrimary",
            "value": { "type": "literal", "valueType": "integer", "value": "0" }
        }
    },
    "operator": "="
}
```

### SOQL / SOSL 式

### `BoundExpressionTypeClass`（boundExpression.ts）

- **type**: `'boundExpression'`
- **継承**: `ExpressionTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `BoundExpressionContext`（文法: `COLON expression`）
- **役割**: SOQL/SOSL 内のバインド変数（`:expr`）。`COLON` は保持せず式のみを持つ。

| 変数    | 型                                         | 内容                   |
| ------- | ------------------------------------------ | ---------------------- |
| `type`  | `string`                                   | `'boundExpression'`    |
| `value` | `ExpressionAllTypeClass \| ErrorTypeClass` | バインドされる Apex 式 |

ゲッター: `getType()`, `getValue()`

例（`value` ノード内に出現）:

```apex
WHERE Industry = :industry
```

```json
{
    "type": "value",
    "value": {
        "type": "boundExpression",
        "value": {
            "type": "primaryExpression",
            "value": { "type": "idPrimary", "value": { "type": "id", "value": "industry" } }
        }
    },
    "valueType": "boundExpression"
}
```

### `FilteringExpressionTypeClass`（filteringExpression.ts）

- **type**: `'filteringExpression'`
- **継承**: `ExpressionListBaseTypeClass<DataCategorySelectionTypeClass>`
- **元 Context**: `FilteringExpressionContext`（文法: `dataCategorySelection (SOQLAND dataCategorySelection)*`）
- **役割**: `WITH DATA CATEGORY` のフィルタ条件。`AND` は保持せず、選択条件を配列で持つ。選択数と `AND` 数が整合しない場合は throw。選択が 0 件なら `value` は `[]`。

| 変数    | 型                                                     | 内容                         |
| ------- | ------------------------------------------------------ | ---------------------------- |
| `type`  | `string`                                               | `'filteringExpression'`      |
| `value` | `(DataCategorySelectionTypeClass \| ErrorTypeClass)[]` | データカテゴリ選択条件の配列 |

ゲッター: `getType()`, `getValue()`

例:

```apex
WITH DATA CATEGORY Geography__c AT Usa__c
```

```json
{
    "type": "filteringExpression",
    "value": [
        {
            "type": "dataCategorySelection",
            "value": { "type": "soqlId", "value": { "type": "id", "value": "Geography__c" } },
            "selector": { "type": "filteringSelector", "value": "AT" },
            "category": { "type": "dataCategoryName", "value": ["..."] }
        }
    ]
}
```

### `FieldExpressionTypeClass`（fieldExpression.ts）

- **type**: `'fieldExpression'`
- **継承**: `DoubleOperatorExpressionTypeClass<FieldNameTypeClass | SoqlFunctionTypeClass, ComparisonOperatorTypeClass, NormalValueTypeClass>`
- **元 Context**: `FieldExpressionContext`（文法: `(fieldName | soqlFunction) comparisonOperator value`）
- **役割**: SOQL の単一比較条件。`fieldName` があれば left は `fieldName`、無ければ `soqlFunction`。

| 変数       | 型                                                              | 内容                                                                                                                                                  |
| ---------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`     | `string`                                                        | `'fieldExpression'`                                                                                                                                   |
| `left`     | `FieldNameTypeClass \| SoqlFunctionTypeClass \| ErrorTypeClass` | 項目名（`fieldName`）または関数（`soqlFunction`）                                                                                                     |
| `right`    | `NormalValueTypeClass \| ErrorTypeClass`                        | 比較値（`value`）                                                                                                                                     |
| `operator` | `ComparisonOperatorTypeClass \| ErrorTypeClass`                 | 比較演算子ノード。`value` は `'='` / `'!='` / `'<'` / `'>'` / `'<='` / `'>='` / `'<>'` / `'LIKE'` / `'IN'` / `'NOT IN'` / `'INCLUDES'` / `'EXCLUDES'` |

ゲッター: `getType()`, `getLeft()`, `getRight()`, `getOperator()`

例:

```apex
WHERE Industry = 'Technology'
```

```json
{
    "type": "fieldExpression",
    "left": { "type": "fieldName", "value": [{ "type": "soqlId", "value": "..." }] },
    "right": { "type": "value", "value": "'Technology'", "valueType": "string" },
    "operator": { "type": "comparisonOperator", "value": "=" }
}
```

### `ConditionalExpressionTypeClass`（conditionalExpression.ts）

- **type**: `'conditionalExpression'`
- **継承**: `ExpressionTypeClass<LogicalExpressionTypeClass | FieldExpressionTypeClass>`
- **元 Context**: `ConditionalExpressionContext`（文法: `LPAREN logicalExpression RPAREN | fieldExpression`）
- **役割**: `HAVING` 条件の 1 項。括弧付きなら `logicalExpression`、そうでなければ `fieldExpression` を持つ（括弧自体は保持しない）。

| 変数    | 型                                                                         | 内容                         |
| ------- | -------------------------------------------------------------------------- | ---------------------------- |
| `type`  | `string`                                                                   | `'conditionalExpression'`    |
| `value` | `LogicalExpressionTypeClass \| FieldExpressionTypeClass \| ErrorTypeClass` | 括弧内の論理式または比較条件 |

ゲッター: `getType()`, `getValue()`

例:

```apex
HAVING COUNT(Id) > 10
```

```json
{
    "type": "conditionalExpression",
    "value": {
        "type": "fieldExpression",
        "left": {
            "type": "soqlFunction",
            "value": "COUNT",
            "param": { "type": "fieldName", "value": "..." }
        },
        "right": {
            "type": "value",
            "value": {
                "type": "signedNumber",
                "valueType": "integer",
                "value": "10",
                "operator": null
            },
            "valueType": "signedNumber"
        },
        "operator": { "type": "comparisonOperator", "value": ">" }
    }
}
```

### `LogicalExpressionTypeClass`（logicalExpression.ts）

- **type**: `'logicalExpression'`
- **継承**: `ExpressionListBaseTypeClass<ConditionalExpressionTypeClass>`
- **元 Context**: `LogicalExpressionContext`（文法: `NOT conditionalExpression | conditionalExpression (SOQLAND conditionalExpression)* | conditionalExpression (SOQLOR conditionalExpression)*`）
- **役割**: `HAVING` の論理式。1 階層内で AND と OR は混在しないため、演算子を 1 つだけ保持する。項数と AND/OR 数が整合しない場合は throw。

| 変数       | 型                                                     | 内容                                                            |
| ---------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| `type`     | `string`                                               | `'logicalExpression'`                                           |
| `value`    | `(ConditionalExpressionTypeClass \| ErrorTypeClass)[]` | 条件項の配列                                                    |
| `operator` | `string \| null`                                       | `'AND'` / `'OR'` / `'NOT'`。単一項（演算子なし）の場合は `null` |

ゲッター: `getType()`, `getValue()`, `getOperator()`

例:

```apex
HAVING COUNT(Id) > 10
```

```json
{
    "type": "logicalExpression",
    "value": [
        {
            "type": "conditionalExpression",
            "value": { "type": "fieldExpression", "left": "...", "right": "...", "operator": "..." }
        }
    ],
    "operator": null
}
```

### `WhereFieldExpressionTypeClass`（whereFieldExpression.ts）

- **type**: `'whereFieldExpression'`
- **継承**: `DoubleOperatorExpressionTypeClass<FieldExpressionTypeClass | string, ComparisonOperatorTypeClass | null, NormalValueTypeClass | null>`
- **元 Context**: `WhereFieldExpressionContext`（文法: `fieldExpression | FORMULA LPAREN StringLiteral RPAREN comparisonOperator value`）
- **役割**: `WHERE` 条件の 1 項。2 つの形で null の入り方が異なる。
    - `fieldExpression` の場合: left = `fieldExpression`、`operator` / `right` は `null`（演算子と値は fieldExpression 側が保持）。
    - `FORMULA(...)` の場合: left = `FORMULA` + `(` + 文字列リテラル（引用符込み）+ `)` の文字列、`operator` = `comparisonOperator`、`right` = `value`。サンプル IR には未出現。

| 変数       | 型                                                      | 内容                                                                                                     |
| ---------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `type`     | `string`                                                | `'whereFieldExpression'`                                                                                 |
| `left`     | `FieldExpressionTypeClass \| string \| ErrorTypeClass`  | 比較条件、または FORMULA 式の文字列                                                                      |
| `right`    | `NormalValueTypeClass \| ErrorTypeClass \| null`        | 比較値（fieldExpression 形では `null`）                                                                  |
| `operator` | `ComparisonOperatorTypeClass \| ErrorTypeClass \| null` | 比較演算子ノード（fieldExpression 形では `null`）。取り得る `value` は `FieldExpressionTypeClass` と同じ |

ゲッター: `getType()`, `getLeft()`, `getRight()`, `getOperator()`

例:

```apex
WHERE Industry = 'Technology'
```

```json
{
    "type": "whereFieldExpression",
    "left": {
        "type": "fieldExpression",
        "left": { "type": "fieldName", "value": ["..."] },
        "right": { "type": "value", "value": "'Technology'", "valueType": "string" },
        "operator": { "type": "comparisonOperator", "value": "=" }
    },
    "right": null,
    "operator": null
}
```

### `WhereConditionalExpressionTypeClass`（whereConditionalExpression.ts）

- **type**: `'whereConditionalExpression'`
- **継承**: `ExpressionTypeClass<WhereLogicalExpressionTypeClass | WhereFieldExpressionTypeClass>`
- **元 Context**: `WhereConditionalExpressionContext`（文法: `LPAREN whereLogicalExpression RPAREN | whereFieldExpression`）
- **役割**: `WHERE` 論理式の 1 項。括弧付きなら `whereLogicalExpression`、そうでなければ `whereFieldExpression` を持つ（括弧自体は保持しない）。

| 変数    | 型                                                                                   | 内容                           |
| ------- | ------------------------------------------------------------------------------------ | ------------------------------ |
| `type`  | `string`                                                                             | `'whereConditionalExpression'` |
| `value` | `WhereLogicalExpressionTypeClass \| WhereFieldExpressionTypeClass \| ErrorTypeClass` | 括弧内の論理式または単一条件   |

ゲッター: `getType()`, `getValue()`

例:

```apex
WHERE Industry = 'Technology'
```

```json
{
    "type": "whereConditionalExpression",
    "value": {
        "type": "whereFieldExpression",
        "left": { "type": "fieldExpression", "left": "...", "right": "...", "operator": "..." },
        "right": null,
        "operator": null
    }
}
```

### `WhereLogicalExpressionTypeClass`（whereLogicalExpression.ts）

- **type**: `'whereLogicalExpression'`
- **継承**: `ExpressionListBaseTypeClass<WhereConditionalExpressionTypeClass>`
- **元 Context**: `WhereLogicalExpressionContext`（文法: `NOT whereConditionalExpression | whereConditionalExpression (SOQLAND whereConditionalExpression)* | whereConditionalExpression (SOQLOR whereConditionalExpression)*`）
- **役割**: `WHERE` 句の論理式。1 階層内で AND と OR は混在しないため、演算子を 1 つだけ保持する。項数と AND/OR 数が整合しない場合は throw。

| 変数       | 型                                                          | 内容                                                            |
| ---------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| `type`     | `string`                                                    | `'whereLogicalExpression'`                                      |
| `value`    | `(WhereConditionalExpressionTypeClass \| ErrorTypeClass)[]` | 条件項の配列                                                    |
| `operator` | `string \| null`                                            | `'AND'` / `'OR'` / `'NOT'`。単一項（演算子なし）の場合は `null` |

ゲッター: `getType()`, `getValue()`, `getOperator()`

例:

```apex
AND (Phone = NULL OR Fax != NULL)
```

```json
{
    "type": "whereLogicalExpression",
    "value": [
        {
            "type": "whereConditionalExpression",
            "value": {
                "type": "whereFieldExpression",
                "left": { "type": "fieldExpression", "...": "..." },
                "right": null,
                "operator": null
            }
        },
        {
            "type": "whereConditionalExpression",
            "value": {
                "type": "whereFieldExpression",
                "left": { "type": "fieldExpression", "...": "..." },
                "right": null,
                "operator": null
            }
        }
    ],
    "operator": "OR"
}
```

### `ParExpressionTypeClass`（parExpression.ts）

- **type**: `'parExpression'`
- **継承**: `ExpressionTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `ParExpressionContext`（文法: `LPAREN expression RPAREN`）
- **役割**: 括弧付きの Apex 式。SOQL 専用ではなく、`if` / `while` / `do-while` 等の条件部（`parExpression` 規則）で使われる。式中の括弧は `subExpression`。

| 変数    | 型                                         | 内容              |
| ------- | ------------------------------------------ | ----------------- |
| `type`  | `string`                                   | `'parExpression'` |
| `value` | `ExpressionAllTypeClass \| ErrorTypeClass` | 括弧内の式        |

ゲッター: `getType()`, `getValue()`

例:

```apex
if (value > 100) { ... }
```

```json
{
    "type": "parExpression",
    "value": {
        "type": "cmpExpression",
        "left": {
            "type": "primaryExpression",
            "value": { "type": "idPrimary", "value": { "type": "id", "value": "value" } }
        },
        "right": {
            "type": "primaryExpression",
            "value": {
                "type": "literalPrimary",
                "value": { "type": "literal", "valueType": "integer", "value": "100" }
            }
        },
        "operator": ">"
    }
}
```
