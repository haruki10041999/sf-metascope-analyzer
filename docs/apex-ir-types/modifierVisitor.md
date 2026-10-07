# modifierVisitor

クラス・メソッド・フィールド・パラメータなどに付く修飾子（`public` / `static` / `with sharing` 等）とアノテーション（`@AuraEnabled(...)` 等）を扱う。
アノテーションは文法上 `modifier` の一種なので、IR では `modifier` ノードの `value` に `annotation` ノードが入る。

## Visitor

`ModifierVisitor` が扱う Context と生成する TypeClass:

| visit メソッド    | Context             | 生成する TypeClass        |
| ----------------- | ------------------- | ------------------------- |
| `visitModifier`   | `ModifierContext`   | `NormalModifierTypeClass` |
| `visitAnnotation` | `AnnotationContext` | `AnnotationTypeClass`     |

## 基底クラス（base.ts）

### `ModifierTypeClass<T>`

修飾子系ノードの共通基底。値を 1 つだけ持つ。

| 変数    | 型                    | 内容                                      |
| ------- | --------------------- | ----------------------------------------- |
| `type`  | `string`              | ノード種別（CommonTypeClass から継承）    |
| `value` | `T \| ErrorTypeClass` | 修飾子の値。変換失敗時は `ErrorTypeClass` |

ゲッター: `getValue()`, `getType()`（継承）

### `isModifierTypeAll`

`target instanceof ModifierTypeClass` を判定するガード（`ModifierTypeClass<unknown>` に絞り込む）。

## TypeClass

### `NormalModifierTypeClass`（normal.ts）

- **type**: `'modifier'`
- **継承**: `ModifierTypeClass<NormalModifierValueType>`
- **元 Context**: `ModifierContext`（文法: `annotation | GLOBAL | PUBLIC | PROTECTED | PRIVATE | TRANSIENT | STATIC | ABSTRACT | FINAL | WEBSERVICE | OVERRIDE | VIRTUAL | TESTMETHOD | WITH SHARING | WITHOUT SHARING | INHERITED SHARING`）
- **役割**: 修飾子 1 個。キーワード修飾子は文字列、アノテーションは `AnnotationTypeClass` として保持する。

`NormalModifierValueType`（モジュール内の型エイリアス）が取りうる値:
`'GLOBAL'` | `'PUBLIC'` | `'PROTECTED'` | `'PRIVATE'` | `'TRANSIENT'` | `'STATIC'` | `'ABSTRACT'` | `'FINAL'` | `'WEBSERVICE'` | `'OVERRIDE'` | `'VIRTUAL'` | `'TESTMETHOD'` | `'WITH_SHARING'` | `'WITHOUT_SHARING'` | `'INHERITED_SHARING'` | `AnnotationTypeClass`

| 変数    | 型                                          | 内容                                                                                                                                                                                                                                                    |
| ------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`  | `'modifier'`                                | 継承                                                                                                                                                                                                                                                    |
| `value` | `NormalModifierValueType \| ErrorTypeClass` | キーワード修飾子の文字列（`with sharing` → `'WITH_SHARING'`、`inherited sharing` → `'INHERITED_SHARING'`。`INHERITED` と `SHARING` の両トークンが必要）、またはアノテーション。アノテーションの変換に失敗した場合は `ErrorTypeClass`。null にはならない |

ゲッター: `getValue()`

例:

```apex
public static final Integer MAX_SIZE = 100;
```

```json
{ "type": "modifier", "value": "PUBLIC" },
{ "type": "modifier", "value": "STATIC" },
{ "type": "modifier", "value": "FINAL" }
```

### `AnnotationTypeClass`（annotation.ts）

- **type**: `'annotation'`
- **継承**: `ModifierTypeClass<NormalIdTypeClass>`
- **元 Context**: `AnnotationContext`（文法: `ATSIGN id (LPAREN (elementValuePairs | elementValue)? RPAREN)?`）
- **役割**: アノテーション 1 個。名前と、括弧内の引数（単一値 or キー=値の組）を持つ。

| 変数    | 型                                                                              | 内容                                                                                                             |
| ------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `type`  | `'annotation'`                                                                  | 継承                                                                                                             |
| `value` | `NormalIdTypeClass \| ErrorTypeClass`                                           | アノテーション名（`id` ノード）                                                                                  |
| `param` | `ElementValueTypeClass \| ElementValuePairsTypeClass \| ErrorTypeClass \| null` | 括弧内の引数。`@X(v)` なら `elementValue`、`@X(k=v ...)` なら `elementValuePairs`。括弧が無い／空の場合は `null` |

ゲッター: `getValue()`, `getParam()`

例:

```apex
@AuraEnabled(cacheable=true)
public static String getName(Id recordId) { ... }

@Deprecated
webservice static String legacy() { ... }
```

```json
{
    "type": "modifier",
    "value": {
        "type": "annotation",
        "value": { "type": "id", "value": "AuraEnabled" },
        "param": {
            "type": "elementValuePairs",
            "value": [
                {
                    "type": "elementValuePair",
                    "left": { "type": "id", "value": "cacheable" },
                    "right": { "type": "elementValue", "value": "..." }
                }
            ]
        }
    }
}
```

```json
{
    "type": "modifier",
    "value": {
        "type": "annotation",
        "value": { "type": "id", "value": "Deprecated" },
        "param": null
    }
}
```
