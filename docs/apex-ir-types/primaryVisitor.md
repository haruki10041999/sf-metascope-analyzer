# primaryVisitor

式の最小単位である `primary`（`this` / `super` / リテラル / 識別子 / `型.class` / SOQL / SOSL）を IR に変換する。生成ノードは `PrimaryExpressionTypeClass`（`'primaryExpression'`）の `value` に入る。
子要素の変換に失敗した場合、そのフィールドには `ErrorTypeClass`（`type: 'AnalyzerError'`、`contextType` / `context` / `errorMessage`）が入る。

## Visitor

| visit メソッド        | Context                 | 生成する TypeClass        |
| --------------------- | ----------------------- | ------------------------- |
| `visitPrimary`        | `PrimaryContext`        | `NormalPrimaryTypeClass`  |
| `visitThisPrimary`    | `ThisPrimaryContext`    | `ThisPrimaryTypeClass`    |
| `visitVoidPrimary`    | `VoidPrimaryContext`    | `VoidPrimaryTypeClass`    |
| `visitSoqlPrimary`    | `SoqlPrimaryContext`    | `SoqlPrimaryTypeClass`    |
| `visitSuperPrimary`   | `SuperPrimaryContext`   | `SuperPrimaryTypeClass`   |
| `visitTypeRefPrimary` | `TypeRefPrimaryContext` | `TypeRefPrimaryTypeClass` |
| `visitIdPrimary`      | `IdPrimaryContext`      | `IdPrimaryTypeClass`      |
| `visitLiteralPrimary` | `LiteralPrimaryContext` | `LiteralPrimaryTypeClass` |
| `visitSoslPrimary`    | `SoslPrimaryContext`    | `SoslPrimaryTypeClass`    |

## 基底クラス（base.ts）

### `PrimaryTypeClass<T>`

全 primary ノードの基底。単一の `value` を持つ。

| 変数    | 型                    | 内容                                   |
| ------- | --------------------- | -------------------------------------- |
| `type`  | `string`              | ノード種別（CommonTypeClass から継承） |
| `value` | `T \| ErrorTypeClass` | primary の中身（文字列または子ノード） |

ゲッター: `getValue()`, `getType()`

### `isPrimaryTypeAll(target)`（ガード関数）

`PrimaryTypeClass` のインスタンスなら `true`。`PrimaryExpressionTypeClass` が子の検証に使用する。

## TypeClass

### `NormalPrimaryTypeClass`（normal.ts）

- **type**: `'primary'`
- **継承**: `PrimaryTypeClass<string>`
- **元 Context**: `PrimaryContext`（文法: `primary` 規則。実体は `#thisPrimary` 等のラベル付き代替）
- **役割**: `PrimaryContext` そのものを訪問した場合のフォールバック。ソーステキストをそのまま保持する。パーサはラベル付き代替の Context を生成するため、通常は出現しない。

| 変数    | 型          | 内容                                          |
| ------- | ----------- | --------------------------------------------- |
| `type`  | `'primary'` | 継承                                          |
| `value` | `string`    | `ctx.getText()`（空白を除いたソーステキスト） |

ゲッター: `getValue()`

例: 例 IR には出現しない。

### `ThisPrimaryTypeClass`（thisPrimary.ts）

- **type**: `'thisPrimary'`
- **継承**: `PrimaryTypeClass<string>`
- **元 Context**: `ThisPrimaryContext`（文法: `THIS`）
- **役割**: `this` 参照。

| 変数    | 型              | 内容                                  |
| ------- | --------------- | ------------------------------------- |
| `type`  | `'thisPrimary'` | 継承                                  |
| `value` | `string`        | `THIS` トークンのテキスト（`'this'`） |

ゲッター: `getValue()`

例:

```apex
this.hook();
```

```json
{ "type": "thisPrimary", "value": "this" }
```

### `SuperPrimaryTypeClass`（superPrimary.ts）

- **type**: `'superPrimary'`
- **継承**: `PrimaryTypeClass<string>`
- **元 Context**: `SuperPrimaryContext`（文法: `SUPER`）
- **役割**: `super` 参照。

| 変数    | 型               | 内容                                    |
| ------- | ---------------- | --------------------------------------- |
| `type`  | `'superPrimary'` | 継承                                    |
| `value` | `string`         | `SUPER` トークンのテキスト（`'super'`） |

ゲッター: `getValue()`

例:

```apex
super.someMethod();
```

```json
{ "type": "superPrimary", "value": "super" }
```

### `VoidPrimaryTypeClass`（voidPrimary.ts）

- **type**: `'voidPrimary'`
- **継承**: `PrimaryTypeClass<string>`
- **元 Context**: `VoidPrimaryContext`（文法: `VOID DOT CLASS`）
- **役割**: `void.class`。

| 変数    | 型              | 内容                                                                  |
| ------- | --------------- | --------------------------------------------------------------------- |
| `type`  | `'voidPrimary'` | 継承                                                                  |
| `value` | `string`        | `VOID` と `CLASS` のテキストを `.` で連結した文字列（`'void.class'`） |

ゲッター: `getValue()`

例:

```apex
System.Type voidType = void.class;
```

```json
{ "type": "voidPrimary", "value": "void.class" }
```

### `TypeRefPrimaryTypeClass`（typeRefPrimary.ts）

- **type**: `'typeRefPrimary'`
- **継承**: `PrimaryTypeClass<TypeRefTypeClass>`
- **元 Context**: `TypeRefPrimaryContext`（文法: `typeRef DOT CLASS`）
- **役割**: `型.class` 形式の型参照。`.class` 部分は保持せず型のみを持つ。

| 変数    | 型                                   | 内容                  |
| ------- | ------------------------------------ | --------------------- |
| `type`  | `'typeRefPrimary'`                   | 継承                  |
| `value` | `TypeRefTypeClass \| ErrorTypeClass` | 型参照（`'typeRef'`） |

ゲッター: `getValue()`

例:

```apex
System.Type stringType = String.class;
```

```json
{
    "type": "typeRefPrimary",
    "value": {
        "type": "typeRef",
        "value": ["..."],
        "dimension": { "type": "arraySubscripts", "value": 0 }
    }
}
```

### `IdPrimaryTypeClass`（idPrimary.ts）

- **type**: `'idPrimary'`
- **継承**: `PrimaryTypeClass<NormalIdTypeClass>`
- **元 Context**: `IdPrimaryContext`（文法: `id`）
- **役割**: 変数名・型名などの単一識別子。

| 変数    | 型                                    | 内容             |
| ------- | ------------------------------------- | ---------------- |
| `type`  | `'idPrimary'`                         | 継承             |
| `value` | `NormalIdTypeClass \| ErrorTypeClass` | 識別子（`'id'`） |

ゲッター: `getValue()`

例:

```apex
counter = 0;
```

```json
{ "type": "idPrimary", "value": { "type": "id", "value": "counter" } }
```

### `LiteralPrimaryTypeClass`（literalPrimary.ts）

- **type**: `'literalPrimary'`
- **継承**: `PrimaryTypeClass<NormalLiteralTypeClass>`
- **元 Context**: `LiteralPrimaryContext`（文法: `literal`）
- **役割**: 数値・文字列・真偽値・`null` のリテラル。

| 変数    | 型                                         | 内容                    |
| ------- | ------------------------------------------ | ----------------------- |
| `type`  | `'literalPrimary'`                         | 継承                    |
| `value` | `NormalLiteralTypeClass \| ErrorTypeClass` | リテラル（`'literal'`） |

ゲッター: `getValue()`

例:

```apex
public static final Integer MAX_SIZE = 100;
```

```json
{ "type": "literalPrimary", "value": { "type": "literal", "valueType": "integer", "value": "100" } }
```

### `SoqlPrimaryTypeClass`（soqlPrimary.ts）

- **type**: `'soqlPrimary'`
- **継承**: `PrimaryTypeClass<SoqlLiteralTypeClass>`
- **元 Context**: `SoqlPrimaryContext`（文法: `soqlLiteral`）
- **役割**: インライン SOQL（`[SELECT ...]`）。

| 変数    | 型                                       | 内容                             |
| ------- | ---------------------------------------- | -------------------------------- |
| `type`  | `'soqlPrimary'`                          | 継承                             |
| `value` | `SoqlLiteralTypeClass \| ErrorTypeClass` | SOQL リテラル（`'soqlLiteral'`） |

ゲッター: `getValue()`

例:

```apex
[SELECT Id FROM Account ...]
```

```json
{
    "type": "soqlPrimary",
    "value": {
        "type": "soqlLiteral",
        "value": {
            "type": "query",
            "value": { "type": "selectList", "value": "..." },
            "from": { "type": "fromNameList", "value": "..." },
            "...": "..."
        }
    }
}
```

### `SoslPrimaryTypeClass`（soslPrimary.ts）

- **type**: `'soslPrimary'`
- **継承**: `PrimaryTypeClass<SoslLiteralTypeClass>`
- **元 Context**: `SoslPrimaryContext`（文法: `soslLiteral`）
- **役割**: インライン SOSL（`[FIND ...]`）。

| 変数    | 型                                       | 内容                             |
| ------- | ---------------------------------------- | -------------------------------- |
| `type`  | `'soslPrimary'`                          | 継承                             |
| `value` | `SoslLiteralTypeClass \| ErrorTypeClass` | SOSL リテラル（`'soslLiteral'`） |

ゲッター: `getValue()`

例:

```apex
[FIND 'test' IN ALL FIELDS RETURNING Account, Contact]
```

```json
{
    "type": "soslPrimary",
    "value": {
        "type": "soslLiteral",
        "value": "[FIND 'test'",
        "soslClauses": {
            "type": "soslClauses",
            "value": "...",
            "fieldSpecList": "...",
            "withList": null,
            "limitClause": null,
            "updateList": null
        }
    }
}
```
