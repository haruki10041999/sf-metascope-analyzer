# parameterVisitor

メソッド・コンストラクタの仮引数（`formalParameters` / `formalParameter`）と、SOQL の `FIELDS(ALL|CUSTOM|STANDARD)` の引数を扱う。

## Visitor

`ParameterVisitor` が扱う Context と生成する TypeClass:

| visit メソッド             | Context                      | 生成する TypeClass             |
| -------------------------- | ---------------------------- | ------------------------------ |
| `visitFormalParameter`     | `FormalParameterContext`     | `FormalParameterTypeClass`     |
| `visitFormalParameters`    | `FormalParametersContext`    | `FormalParametersTypeClass`    |
| `visitSoqlFieldsParameter` | `SoqlFieldsParameterContext` | `SoqlFieldsParameterTypeClass` |

## 基底クラス（base.ts）

### `ParameterTypeClass<T>`

パラメータ系ノードの共通基底。値を 1 つだけ持つ。

| 変数    | 型                    | 内容                                            |
| ------- | --------------------- | ----------------------------------------------- |
| `type`  | `string`              | ノード種別（CommonTypeClass から継承）          |
| `value` | `T \| ErrorTypeClass` | パラメータの主値。変換失敗時は `ErrorTypeClass` |

ゲッター: `getValue()`, `getType()`（継承）

### `isParameterTypeAll`

`target instanceof ParameterTypeClass` を判定するガード（`ParameterTypeClass<unknown>` に絞り込む）。

## TypeClass

### `FormalParametersTypeClass`（formalParameters.ts）

- **type**: `'formalParameters'`
- **継承**: `ParameterTypeClass<FormalParameterListTypeClass | null>`
- **元 Context**: `FormalParametersContext`（文法: `LPAREN formalParameterList? RPAREN`）
- **役割**: メソッド宣言の引数リスト全体（括弧を含む）。

| 変数    | 型                                                       | 内容                                                                        |
| ------- | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| `type`  | `'formalParameters'`                                     | 継承                                                                        |
| `value` | `FormalParameterListTypeClass \| ErrorTypeClass \| null` | 仮引数リスト（`formalParameterList` ノード）。引数なし `()` の場合は `null` |

ゲッター: `getValue()`

例:

```apex
public static String getName(Id recordId) { ... }
webservice static String legacy() { ... }
```

```json
{
    "type": "formalParameters",
    "value": {
        "type": "formalParameterList",
        "value": [{ "type": "formalParameter", "value": "...", "valueType": "...", "modifier": [] }]
    }
}
```

```json
{ "type": "formalParameters", "value": null }
```

### `FormalParameterTypeClass`（formalParameter.ts）

- **type**: `'formalParameter'`
- **継承**: `ParameterTypeClass<NormalIdTypeClass>`
- **元 Context**: `FormalParameterContext`（文法: `modifier* typeRef id`）
- **役割**: 仮引数 1 個。引数名・型・修飾子を持つ。

| 変数        | 型                                              | 内容                                               |
| ----------- | ----------------------------------------------- | -------------------------------------------------- |
| `type`      | `'formalParameter'`                             | 継承                                               |
| `value`     | `NormalIdTypeClass \| ErrorTypeClass`           | 引数名（`id` ノード）                              |
| `valueType` | `TypeRefTypeClass \| ErrorTypeClass`            | 引数の型（`typeRef` ノード）                       |
| `modifier`  | `(NormalModifierTypeClass \| ErrorTypeClass)[]` | 修飾子（`final` やアノテーション）。無ければ空配列 |

ゲッター: `getValue()`, `getValueType()`, `getModifier()`

例:

```apex
public static String getName(Id recordId) { ... }
```

```json
{
    "type": "formalParameter",
    "value": { "type": "id", "value": "recordId" },
    "valueType": {
        "type": "typeRef",
        "value": [
            { "type": "typeName", "value": { "type": "id", "value": "Id" }, "generic": null }
        ],
        "dimension": { "type": "arraySubscripts", "value": 0 }
    },
    "modifier": []
}
```

### `SoqlFieldsParameterTypeClass`（soqlFieldsParameter.ts）

- **type**: `'soqlFieldsParameter'`
- **継承**: `ParameterTypeClass<SoqlFieldsParameterValueType>`
- **元 Context**: `SoqlFieldsParameterContext`（文法: `ALL | CUSTOM | STANDARD`。SOQL の `FIELDS(...)` 内）
- **役割**: `FIELDS()` 関数の引数キーワード。

`SoqlFieldsParameterValueType`（モジュール内の型エイリアス）が取りうる値: `'ALL'` | `'CUSTOM'` | `'STANDARD'`

| 変数    | 型                                               | 内容                                                              |
| ------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| `type`  | `'soqlFieldsParameter'`                          | 継承                                                              |
| `value` | `SoqlFieldsParameterValueType \| ErrorTypeClass` | `'ALL'` / `'CUSTOM'` / `'STANDARD'` のいずれか。null にはならない |

ゲッター: `getValue()`

例:

```apex
List<Account> allFields = [SELECT FIELDS(ALL) FROM Account LIMIT 200];
```

```json
{
    "type": "soqlFunction",
    "value": "FIELDS",
    "param": { "type": "soqlFieldsParameter", "value": "ALL" }
}
```
