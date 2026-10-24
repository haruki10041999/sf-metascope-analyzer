# Apex Literal TypeClass の振り分け

この文書では、Apex IR の `literalVisitor` が生成する7種類のLiteral系TypeClassと、converter の振り分けを説明します。

## 処理の流れ

1. `LiteralVisitor` が parser の各訪問メソッドに対応する `TypeClass.create(ctx)` を呼び出します。
2. 各 `create` が、受け取った parser context のトークンや子 context を調べて具体的なTypeClassを作ります。
3. converter の `makeXxxAssignRule.isValid` が、IRオブジェクトを `instanceof` ベースの述語で判別します。
4. 対応する `construct` が出力型へ変換します。出力オブジェクトの `type` はIRの `getType()` を使います。

したがって、生成段階の振り分けは parser context の種類と内容、converter 段階の振り分けは具体的なTypeClassの実体によって行われます。出力後は `type` プロパティで識別できます。

## TypeClass の一覧

| IR TypeClass              | `getType()`      | 生成元の parser context | 内容・判別条件                                                                                                                                                                                                                                            |
| ------------------------- | ---------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NormalLiteralTypeClass`  | `literal`        | `LiteralContext`        | `IntegerLiteral`、`LongLiteral`、`NumberLiteral`、`StringLiteral`、`MultilineStringLiteral`、`BooleanLiteral`、`NULL` のいずれか。`value` はソース文字列で、`valueType` はそれぞれ `integer`、`long`、`number`、`string`、`longText`、`boolean`、`null`。 |
| `SignedIntegerTypeClass`  | `signedInteger`  | `SignedIntegerContext`  | `IntegerLiteral` と、あれば `ADD` / `SUB` の符号。`valueType` は常に `integer`。                                                                                                                                                                          |
| `SignedNumberTypeClass`   | `signedNumber`   | `SignedNumberContext`   | `IntegerLiteral` または `NumberLiteral` と、あれば `ADD` / `SUB` の符号。`valueType` は整数なら `integer`、小数なら `number`。                                                                                                                            |
| `WhenLiteralTypeClass`    | `whenLiteral`    | `WhenLiteralContext`    | 整数・long、文字列・複数行文字列、`qualifiedName`、入れ子の `whenLiteral`、または `NULL`。値に応じて `valueType` が `integer` / `long` / `string` / `longText` / `id` / `null` になる。整数・longの符号はソース順に連結される。                           |
| `SoqlLiteralTypeClass`    | `soqlLiteral`    | `SoqlLiteralContext`    | `ctx.query()` を `QueryVisitor` で変換した `NormalQueryTypeClass` を値として保持する。                                                                                                                                                                    |
| `SoslLiteralTypeClass`    | `soslLiteral`    | `SoslLiteralContext`    | `FindLiteral` の文字列、または `boundExpression` を値として保持し、さらに `soslClauses` を持つ。                                                                                                                                                          |
| `SoslLiteralAltTypeClass` | `soslLiteralAlt` | `SoslLiteralAltContext` | `FindLiteralAlt` の文字列と `soslClauses` を保持する。`SoslLiteralTypeClass` と異なり、値は文字列のみ。                                                                                                                                                   |

想定されたトークンや子 context がない場合、通常・符号付き・when・SOSL系の `create` は不正な値として例外を投げます。SOQL系は `query()` を変換し、期待したQuery型でなければ `ErrorTypeClass` を値として保持します。

## Converter の出力

`src/analyzer/types/apex/converter/literal.ts` では、各IR TypeClass専用の `makeXxxAssignRule` が対応します。

| IR TypeClass              | Converter rule                 | 主な出力プロパティ                                                                |
| ------------------------- | ------------------------------ | --------------------------------------------------------------------------------- |
| `NormalLiteralTypeClass`  | `makeLiteralAssignRule`        | `type: 'literal'`、`value`、`valueType`                                           |
| `SignedIntegerTypeClass`  | `makeSignedIntegerAssignRule`  | `type: 'signedInteger'`、`value`、`valueType: 'integer'`、`operator`              |
| `SignedNumberTypeClass`   | `makeSignedNumberAssignRule`   | `type: 'signedNumber'`、`value`、`valueType`、`operator`                          |
| `WhenLiteralTypeClass`    | `makeWhenLiteralAssignRule`    | `type: 'whenLiteral'`、`value`、`valueType`。整数・longの場合は `operator` も出力 |
| `SoqlLiteralTypeClass`    | `makeSoqlLiteralAssignRule`    | `type: 'soqlLiteral'`、変換したQueryの `value`                                    |
| `SoslLiteralTypeClass`    | `makeSoslLiteralAssignRule`    | `type: 'soslLiteral'`、`value`、`soslClauses`                                     |
| `SoslLiteralAltTypeClass` | `makeSoslLiteralAltAssignRule` | `type: 'soslLiteralAlt'`、`value`、`soslClauses`                                  |

それぞれの rule の `isValid` は対応する `isXxxTypeClass` を使います。たとえば `makeSignedNumberAssignRule` は `SignedNumberTypeClass` のインスタンスだけを受け付けます。出力型の `isXxxType` は別の型述語で、出力オブジェクトの `type` を検査します。

## 関連ソース

- IRの生成とparser contextの振り分け: `src/analyzer/types/apex_IR/literalVisitor/index.ts`
- 各IR TypeClassの生成条件: `src/analyzer/types/apex_IR/literalVisitor/`
- Converterの出力規則: `src/analyzer/types/apex/converter/literal.ts`
- 基底クラスと共通の値保持: `src/analyzer/types/apex_IR/literalVisitor/base.ts`
