# memberVisitor

トリガー本体・匿名 Apex 本体の 1 要素（メンバー）を扱う。各メンバーは「修飾子付きのメンバー宣言」か「文」のどちらか。
子フィールドは変換失敗時に `ErrorTypeClass`（`type: 'AnalyzerError'`, `contextType` / `context` / `errorMessage`）になり得る。

## Visitor

`MemberVisitor` が扱う Context と生成する TypeClass:

| visit メソッド              | Context                       | 生成する TypeClass              |
| --------------------------- | ----------------------------- | ------------------------------- |
| `visitAnonymousBlockMember` | `AnonymousBlockMemberContext` | `AnonymousBlockMemberTypeClass` |
| `visitTriggerBlockMember`   | `TriggerBlockMemberContext`   | `TriggerBlockMemberTypeClass`   |

## 基底クラス（base.ts）

### `MemberTypeClass<T>`

メンバー本体（宣言または文）と修飾子リストを持つ基底。

| 変数       | 型                                              | 内容                                                                                                                                                                                                                                                                                                                            |
| ---------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`     | `string`                                        | ノード種別（CommonTypeClass から継承）                                                                                                                                                                                                                                                                                          |
| `value`    | `T \| ErrorTypeClass`                           | メンバー本体                                                                                                                                                                                                                                                                                                                    |
| `modifier` | `(NormalModifierTypeClass \| ErrorTypeClass)[]` | メンバー宣言に付く修飾子。無ければ `[]`。各要素の `value` は `'GLOBAL'` / `'PUBLIC'` / `'PROTECTED'` / `'PRIVATE'` / `'TRANSIENT'` / `'STATIC'` / `'ABSTRACT'` / `'FINAL'` / `'WEBSERVICE'` / `'OVERRIDE'` / `'VIRTUAL'` / `'TESTMETHOD'` / `'WITH_SHARING'` / `'WITHOUT_SHARING'` / `'INHERITED_SHARING'` またはアノテーション |

ゲッター: `getValue()`, `getModifier()`, `getType()`（CommonTypeClass）

### `isMemberTypeAll`

`target` が `MemberTypeClass<unknown>` のインスタンスかを判定するガード（union 型の定義は無く、`MemberVisitor` の戻り値型は `MemberTypeClass<unknown>`）。

## TypeClass

### `AnonymousBlockMemberTypeClass`（anonymousBlockMember.ts）

- **type**: `'anonymousBlockMember'`
- **継承**: `MemberTypeClass<AnonymousMemberDeclarationTypeClass | NormalStatementTypeClass>`
- **元 Context**: `AnonymousBlockMemberContext`（文法: `modifier* anonymousMemberDeclaration | statement`）
- **役割**: 匿名 Apex の 1 要素。

| 変数       | 型                                                                                  | 内容                                                                  |
| ---------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `type`     | `'anonymousBlockMember'`                                                            | 継承                                                                  |
| `value`    | `AnonymousMemberDeclarationTypeClass \| NormalStatementTypeClass \| ErrorTypeClass` | メンバー宣言なら `anonymousMemberDeclaration`、それ以外は `statement` |
| `modifier` | `(NormalModifierTypeClass \| ErrorTypeClass)[]`                                     | 継承。メンバー宣言の修飾子。`statement` の場合は `[]`                 |

ゲッター: `getValue()`, `getModifier()`（継承）。ガード: `isAnonymousBlockMemberType`

例:

```apex
static String describe(Object value) {
    return String.valueOf(value);
}
```

```json
{
    "type": "anonymousBlockMember",
    "value": {
        "type": "anonymousMemberDeclaration",
        "value": {
            "type": "methodDeclaration",
            "value": { "type": "id", "value": "describe" },
            "...": "..."
        }
    },
    "modifier": [{ "type": "modifier", "value": "STATIC" }]
}
```

### `TriggerBlockMemberTypeClass`（triggerBlockMember.ts）

- **type**: `'triggerBlockMember'`
- **継承**: `MemberTypeClass<TriggerMemberDeclarationTypeClass | NormalStatementTypeClass>`
- **元 Context**: `TriggerBlockMemberContext`（文法: `modifier* triggerMemberDeclaration | statement`）
- **役割**: トリガー本体の 1 要素。

| 変数       | 型                                                                                | 内容                                                                |
| ---------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `type`     | `'triggerBlockMember'`                                                            | 継承                                                                |
| `value`    | `TriggerMemberDeclarationTypeClass \| NormalStatementTypeClass \| ErrorTypeClass` | メンバー宣言なら `triggerMemberDeclaration`、それ以外は `statement` |
| `modifier` | `(NormalModifierTypeClass \| ErrorTypeClass)[]`                                   | 継承。メンバー宣言の修飾子。`statement` の場合は `[]`               |

ゲッター: `getValue()`, `getModifier()`（継承）。ガード: `isTriggerBlockMemberType`

例:

```apex
System.debug(Trigger.isExecuting);
```

```json
{
    "type": "triggerBlockMember",
    "value": {
        "type": "statement",
        "value": {
            "type": "expressionStatement",
            "value": { "type": "dotExpression", "...": "..." }
        }
    },
    "modifier": []
}
```
