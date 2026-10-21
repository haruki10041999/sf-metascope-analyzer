# Apex IR の nullable フィールド

`src/analyzer/types/apex_IR` の TypeClass を調べ、宣言上 `| null` を許容するフィールドをまとめたもの。対象は **41 ファイル、62 フィールド**（`CommonTypeClass.span` を含む）。

## 表記の読み方

- `| null`: 構文要素または値が存在しない状態。
- `| ErrorTypeClass`: 子要素の変換エラー。正常な省略を表す `null` とは別。
- `T[]`: 要素がない場合も空配列になるフィールド。フィールド自体が `null` になる型とは別。

ANTLR の単一子 getter は、生成された型宣言が non-null でも実行時に `null` を返す場合がある。Visitor 経由では `CommonVisitor.visit(null)` が `NULL_CHILD` の `ErrorTypeClass` に変換するため、ここに列挙した「宣言上 nullable」のフィールドとは区別する。

## フィールド一覧

| Visitor / ファイル                                                                                                              | nullable フィールド                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 共通: [commonVisitor.ts](../../src/analyzer/types/apex_IR/commonVisitor.ts)                                                     | `span: SourceSpan \| null`                                                                                                                       |
| arguments: [base.ts](../../src/analyzer/types/apex_IR/argumentsVisitor/base.ts)                                                 | `value: T \| ErrorTypeClass \| null`                                                                                                             |
| call: [base.ts](../../src/analyzer/types/apex_IR/callVisitor/base.ts)                                                           | `param: Tparam \| ErrorTypeClass \| null`                                                                                                        |
| call: [methodCall.ts](../../src/analyzer/types/apex_IR/callVisitor/methodCall.ts)                                               | `reference: string \| null`                                                                                                                      |
| clause: [fieldOrder.ts](../../src/analyzer/types/apex_IR/clauseVisitor/fieldOrder.ts)                                           | `direction`, `nulls`: `string \| null`                                                                                                           |
| clause: [groupByClause.ts](../../src/analyzer/types/apex_IR/clauseVisitor/groupByClause.ts)                                     | `mode: string \| null`; `having: LogicalExpressionTypeClass \| ErrorTypeClass \| null`                                                           |
| clause: [soslClauses.ts](../../src/analyzer/types/apex_IR/clauseVisitor/soslClauses.ts)                                         | `fieldSpecList`, `limitClause`, `updateList`: `... \| ErrorTypeClass \| null`; `withList: (SoslWithClauseTypeClass \| ErrorTypeClass)[] \| null` |
| clause: [soslWithClause.ts](../../src/analyzer/types/apex_IR/clauseVisitor/soslWithClause.ts)                                   | `content: SoslWithClauseContent \| ErrorTypeClass \| null`                                                                                       |
| clause: [typeOf.ts](../../src/analyzer/types/apex_IR/clauseVisitor/typeOf.ts)                                                   | `elseClause: ElseClauseTypeClass \| ErrorTypeClass \| null`                                                                                      |
| clause: [withClause.ts](../../src/analyzer/types/apex_IR/clauseVisitor/withClause.ts)                                           | `field: FilteringExpressionTypeClass \| ErrorTypeClass \| null`                                                                                  |
| control: [forControl.ts](../../src/analyzer/types/apex_IR/controlVisitor/forControl.ts)                                         | `init`, `update`: `... \| ErrorTypeClass \| null`                                                                                                |
| declaration: [classDeclaration.ts](../../src/analyzer/types/apex_IR/declarationVisitor/classDeclaration.ts)                     | `extend`, `implement`: `... \| ErrorTypeClass \| null`                                                                                           |
| declaration: [constructorDeclaration.ts](../../src/analyzer/types/apex_IR/declarationVisitor/constructorDeclaration.ts)         | `param: FormalParametersTypeClass \| ErrorTypeClass \| null`                                                                                     |
| declaration: [enumDeclaration.ts](../../src/analyzer/types/apex_IR/declarationVisitor/enumDeclaration.ts)                       | `constant: EnumConstantsTypeClass \| ErrorTypeClass \| null`                                                                                     |
| declaration: [interfaceDeclaration.ts](../../src/analyzer/types/apex_IR/declarationVisitor/interfaceDeclaration.ts)             | `extend: TypeListTypeClass \| ErrorTypeClass \| null`                                                                                            |
| declaration: [interfaceMethodDeclaration.ts](../../src/analyzer/types/apex_IR/declarationVisitor/interfaceMethodDeclaration.ts) | `param: FormalParametersTypeClass \| ErrorTypeClass \| null`                                                                                     |
| declaration: [methodDeclaration.ts](../../src/analyzer/types/apex_IR/declarationVisitor/methodDeclaration.ts)                   | `param: FormalParametersTypeClass \| ErrorTypeClass \| null`; `block: NormalBlockTypeClass \| ErrorTypeClass \| null`                            |
| entry: [selectEntry.ts](../../src/analyzer/types/apex_IR/entryVisitor/selectEntry.ts)                                           | `alias: SoqlIdTypeClass \| ErrorTypeClass \| null`                                                                                               |
| entry: [subFieldEntry.ts](../../src/analyzer/types/apex_IR/entryVisitor/subFieldEntry.ts)                                       | `alias: SoqlIdTypeClass \| ErrorTypeClass \| null`                                                                                               |
| expression: [logicalExpression.ts](../../src/analyzer/types/apex_IR/expressionVisitor/logicalExpression.ts)                     | `operator: string \| null`                                                                                                                       |
| expression: [whereLogicalExpression.ts](../../src/analyzer/types/apex_IR/expressionVisitor/whereLogicalExpression.ts)           | `operator: string \| null`                                                                                                                       |
| list: [fieldList.ts](../../src/analyzer/types/apex_IR/listVisitor/fieldList.ts)                                                 | `func: SoslFieldFunction \| null`                                                                                                                |
| list: [fromNameList.ts](../../src/analyzer/types/apex_IR/listVisitor/fromNameList.ts)                                           | `alias: SoqlIdTypeClass \| ErrorTypeClass \| null`                                                                                               |
| literal: [signedInteger.ts](../../src/analyzer/types/apex_IR/literalVisitor/signedInteger.ts)                                   | `operator: string \| null`                                                                                                                       |
| literal: [signedNumber.ts](../../src/analyzer/types/apex_IR/literalVisitor/signedNumber.ts)                                     | `operator: string \| null`                                                                                                                       |
| literal: [whenLiteral.ts](../../src/analyzer/types/apex_IR/literalVisitor/whenLiteral.ts)                                       | `operator: string \| null`                                                                                                                       |
| modifier: [annotation.ts](../../src/analyzer/types/apex_IR/modifierVisitor/annotation.ts)                                       | `param: ElementValueTypeClass \| ElementValuePairsTypeClass \| ErrorTypeClass \| null`                                                           |
| name: [typeName.ts](../../src/analyzer/types/apex_IR/nameVisitor/typeName.ts)                                                   | `generic: TypeArgumentsTypeClass \| ErrorTypeClass \| null`                                                                                      |
| query: [base.ts](../../src/analyzer/types/apex_IR/queryVisitor/base.ts)                                                         | `forClause`, `whereClause`, `orderByClause`, `limitClause`, `updateList`: `... \| ErrorTypeClass \| null`                                        |
| query: [dateFormula.ts](../../src/analyzer/types/apex_IR/queryVisitor/dateFormula.ts)                                           | `param: SignedIntegerTypeClass \| ErrorTypeClass \| null`                                                                                        |
| query: [fieldSpec.ts](../../src/analyzer/types/apex_IR/queryVisitor/fieldSpec.ts)                                               | `fieldList`, `where`, `listView`, `orderBy`, `limitClause`, `offsetClause`: `... \| ErrorTypeClass \| null`                                      |
| query: [normal.ts](../../src/analyzer/types/apex_IR/queryVisitor/normal.ts)                                                     | `usingScope`, `withClause`, `groupByClause`, `offsetClause`, `allRowsClause`: `... \| ErrorTypeClass \| null`                                    |
| query: [soqlFunction.ts](../../src/analyzer/types/apex_IR/queryVisitor/soqlFunction.ts)                                         | `param: SoqlParameterType \| ErrorTypeClass \| null`                                                                                             |
| rest: [arrayCreatorRest.ts](../../src/analyzer/types/apex_IR/restVisitor/arrayCreatorRest.ts)                                   | `size: BasedExpressionTypeClass \| ErrorTypeClass \| null`                                                                                       |
| statement: [base.ts](../../src/analyzer/types/apex_IR/statementVisitor/base.ts)                                                 | `accessLevel: AccessLevelTypeClass \| ErrorTypeClass \| null`                                                                                    |
| statement: [mergeStatement.ts](../../src/analyzer/types/apex_IR/statementVisitor/mergeStatement.ts)                             | `accessLevel: AccessLevelTypeClass \| ErrorTypeClass \| null`                                                                                    |
| statement: [tryStatement.ts](../../src/analyzer/types/apex_IR/statementVisitor/tryStatement.ts)                                 | `finallyBlock: FinallyBlockTypeClass \| ErrorTypeClass \| null`                                                                                  |
| statement: [upsertStatement.ts](../../src/analyzer/types/apex_IR/statementVisitor/upsertStatement.ts)                           | `key: QualifiedNameTypeClass \| ErrorTypeClass \| null`                                                                                          |
| value: [locationValue.ts](../../src/analyzer/types/apex_IR/valueVisitor/locationValue.ts)                                       | `coordinates: (CoordinateValueTypeClass \| ErrorTypeClass)[] \| null`                                                                            |
| value: [whenValue.ts](../../src/analyzer/types/apex_IR/valueVisitor/whenValue.ts)                                               | `valueType: TypeRefTypeClass \| ErrorTypeClass \| null`                                                                                          |
| variable: [variableDeclarator.ts](../../src/analyzer/types/apex_IR/variableVisitor/variableDeclarator.ts)                       | `content: BasedExpressionTypeClass \| ErrorTypeClass \| null`                                                                                    |

## 分類上の注意

- `reference`、`direction`、`nulls`、`mode`、`operator` は文字列値そのものが省略可能。
- `withList` と `coordinates` は、リスト内要素ではなくリスト全体が `null` になり得る。
- その他は主に、文法上省略可能な子 TypeClass を表す。
- 配列型のフィールドがすべて nullable という意味ではない。たとえば `catchBlock` や `whenClause` は `T[]` で、空の場合は空配列として表す。

共通の TypeClass 情報と各 Visitor の概要は [README.md](README.md) を参照。
