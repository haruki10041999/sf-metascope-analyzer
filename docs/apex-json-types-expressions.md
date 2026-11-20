# Apex JSON：型・基本式・式

[全体の目次と共通の形](./apex-json-types.md)。29 型別名。表の型名は定義へのリンク。

## 型のノード

すべて `kind: 'type'` の `JsonType`。`type` で中身を区別する。6 つの個別型別名は非公開で、外部からは共用体 `TypeJson` を使う。

| 型 | `kind` | `type` | Apex の例 | 主な属性 |
| --- | --- | --- | --- | --- |
| [PrimitiveTypeJson](../src/analyzer/types/apex/type.ts#L78) | `type` | `primitive` | `String`, `Integer`, `Boolean` | `primitiveType` |
| [CustomTypeJson](../src/analyzer/types/apex/type.ts#L80) | `type` | `custom` | `Account`, `Outer.Inner` | `customType`（名前の配列）, `generic?` |
| [ArrayTypeJson](../src/analyzer/types/apex/type.ts#L82) | `type` | `array` | `Account[][]` | `elementType`, `dimension` |
| [ListTypeJson](../src/analyzer/types/apex/type.ts#L84) | `type` | `list` | `List<Account>` | `elementType` |
| [SetTypeJson](../src/analyzer/types/apex/type.ts#L86) | `type` | `set` | `Set<Id>` | `elementType` |
| [MapTypeJson](../src/analyzer/types/apex/type.ts#L88) | `type` | `map` | `Map<Id, Account>` | `keyType`, `valueType` |

`elementType`・`keyType`・`valueType`・`generic` の要素は `TypeContentJson`。最上位の `TypeJson` と違い、内側の型には `kind`・`sourceKeys` がない。`void` の戻り値は型ノードではなく文字列 `'void'`。

## 基本式・リテラル

| 型 | `kind` | 対応する Apex | 主な属性 |
| --- | --- | --- | --- |
| [IdentifierJson](../src/analyzer/types/apex/primary.ts#L13) | `identifier` | `account`, `String` などの名前 | `name` |
| [ThisJson](../src/analyzer/types/apex/primary.ts#L15) | `this` | `this` | 追加属性なし |
| [SuperJson](../src/analyzer/types/apex/primary.ts#L16) | `super` | `super` | 追加属性なし |
| [StringLiteralJson](../src/analyzer/types/apex/primary.ts#L19) | `string` | `'abc'`、複数行文字列 | `value`（引用符を除きエスケープを戻した文字列） |
| [IntegerLiteralJson](../src/analyzer/types/apex/primary.ts#L21) | `integer` | `123` | `value`（文字列） |
| [LongLiteralJson](../src/analyzer/types/apex/primary.ts#L22) | `long` | `123L` | `value`（`L` を含む文字列） |
| [DecimalLiteralJson](../src/analyzer/types/apex/primary.ts#L23) | `decimal` | `1.5` | `value`（文字列） |
| [BooleanLiteralJson](../src/analyzer/types/apex/primary.ts#L24) | `boolean` | `true`, `false` | `value`（真偽値） |
| [NullLiteralJson](../src/analyzer/types/apex/primary.ts#L25) | `null` | `null` | 追加属性なし |
| [ClassLiteralJson](../src/analyzer/types/apex/primary.ts#L36) | `classLiteral` | `Account.class`, `void.class` | `classType`（`TypeJson` または `'void'`） |
| [UnsupportedJson](../src/analyzer/types/apex/primary.ts#L39) | `unsupported` | パーサーのエラー回復時に解釈できなかった式 | `nodeType` |

数値を文字列にするのは精度を失わないため。`LiteralJson`・`PrimaryJson` はこれらや SOQL / SOSL をまとめる共用体。

## 式

| 型 | `kind` | 対応する Apex | 主な属性 |
| --- | --- | --- | --- |
| [DotMethodCallJson](../src/analyzer/types/apex/expression.ts#L67) | `memberAccess` | `a.b`, `a.b(123)`, `a?.b` | `type: 'object' \| 'method'`, `object`, `operator`, `member`, `memberArg?` |
| [CallJson](../src/analyzer/types/apex/expression.ts#L102) | `call` | `f(123)`, `this(...)`, `super(...)` | `callee`, `arg`（引数がなければ空配列） |
| [NewJson](../src/analyzer/types/apex/expression.ts#L127) | `new` | `new Account()`, `new List<Account>{...}`, `new Integer[3]` | `newType`, `arg?`, `elements?`, `entries?`, `size?` |
| [CastJson](../src/analyzer/types/apex/expression.ts#L211) | `cast` | `(Account) value` | `convertType`, `expression` |
| [ParenthesizedJson](../src/analyzer/types/apex/expression.ts#L225) | `parenthesized` | `(a + b)` | `expression` |
| [IndexJson](../src/analyzer/types/apex/expression.ts#L235) | `index` | `items[0]` | `object`, `index` |
| [BinaryJson](../src/analyzer/types/apex/expression.ts#L277) | `binary` | `a + b`, `a == b`, `a ^ b` | `left`, `operator`, `right` |
| [LogicalJson](../src/analyzer/types/apex/expression.ts#L283) | `logical` | `a && b`, `a \|\| b`, `a ?? b` | `left`, `operator`, `right` |
| [AssignmentJson](../src/analyzer/types/apex/expression.ts#L289) | `assignment` | `a = b`, `a += b` | `left`, `operator`, `right` |
| [InstanceofJson](../src/analyzer/types/apex/expression.ts#L341) | `instanceof` | `value instanceof Account` | `expression`, `checkType` |
| [UnaryJson](../src/analyzer/types/apex/expression.ts#L355) | `unary` | `!x`, `-x`, `++x`, `x++` | `operator`, `operatorLocation`, `argument` |
| [ConditionalJson](../src/analyzer/types/apex/expression.ts#L374) | `conditional` | `condition ? a : b` | `condition`, `trueValue`, `falseValue` |

`BaseExpressionJson` は基本式・これらの式・`soql`・`sosl` をまとめる共用体。

## 呼び出しの違い

- `hoge.aaa.b(123)` は外側が `memberAccess` / `type: 'method'`、その `object` が `hoge.aaa` の `memberAccess` / `type: 'object'`。
- `hoge().aaa.b(123)` はさらに内側の `hoge()` が `call`。`call.callee` は `identifier`・`this`・`super` のいずれか。
- `memberAccess.object` は識別子に限らず、呼び出し・`this`・添字などの `BaseExpressionJson`。名前空間・クラス・変数の区別は JSON の形だけでは確定しない。
- `NewEntryJson` は `new Map<K, V>{ key => value }` の 1 組を表す kind なしの入れ物。

### JSON の例

`hoge().aaa.b(123)` の式。見やすさのため、すべてのノードの `sourceKeys` を省略している。

```json
{
  "kind": "memberAccess",
  "type": "method",
  "object": {
    "kind": "memberAccess",
    "type": "object",
    "object": {
      "kind": "call",
      "callee": { "kind": "identifier", "name": "hoge" },
      "arg": []
    },
    "operator": ".",
    "member": "aaa"
  },
  "operator": ".",
  "member": "b",
  "memberArg": [{ "kind": "integer", "value": "123" }]
}
```
