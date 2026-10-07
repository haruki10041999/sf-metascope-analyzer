# `src/analyzer/types/apex_IR` レビュー

対象: [src/analyzer/types/apex_IR](../src/analyzer/types/apex_IR) 配下 215 ファイル（25 Visitor フォルダ + `commonVisitor.ts` + `index.ts`）

検証方法:

- 全ファイルの読み取りレビュー
- `@apexdevtools/apex-parser` 5.2.0 の生成パーサー（`dist/esm/antlr/ApexParser.js`）で文法・getter の戻り値を確認
- `npx tsc --noEmit` と `docs/examples/apex-ir/generate-ir.ts` の実行
- 新規テスト（[test/apex_IR](../test/apex_IR)）の実行

> 前提: 生成 getter は `.d.ts` 上 non-null だが、実行時は **単一要素 getter（`expression()` 等）は `null` を返し得る**。`xxx_list()` は常に配列（空なら `[]`）で `null` にはならない。

---

## 1. 総評

- 「`XxxTypeClass`（private constructor + `static create(ctx)`）+ `isXxxType` ガード + フォルダ単位の `XxxVisitor`」というパターンは全フォルダで一貫しており、`CommonVisitor.visit()` で例外を `ErrorTypeClass` に変換して部分解析を継続する設計も良い。
- しかし現状は **モジュール読み込み時点で落ちる（循環 import の TDZ）** ため、IR 生成は一度も動かない。テストも全件この理由で停止する。
- それ以外にも、演算子の取り違え・ガード条件の論理ミス・`type` 文字列のコピペ誤りなど、**実行できれば即座に誤った IR を出すバグ**が複数ある。

---

## 2. 重大度別サマリー

| 優先    | 内容                                                                                                          | 対象                                                                                                                                     |
| ------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 🔴 致命 | 循環 import による TDZ `ReferenceError`。全 Visitor が読み込み不可                                            | 全フォルダの `index.ts` ⇔ 各ファイル                                                                                                     |
| 🔴 致命 | `tsc` エラー 3 件（重複 export 2、型不一致 1）                                                                | [index.ts](../src/analyzer/types/apex_IR/index.ts), [arrayCreatorRest.ts](../src/analyzer/types/apex_IR/restVisitor/arrayCreatorRest.ts) |
| 🔴 高   | `a <= b` / `a >= b` の演算子が `'='` になる                                                                   | [cmpExpression.ts](../src/analyzer/types/apex_IR/expressionVisitor/cmpExpression.ts#L26-L45)                                             |
| 🔴 高   | SOQL 比較演算子 `<=` `>=` が `'='`、`NOT IN` が `'IN'` になる                                                 | [comparisonOperator.ts](../src/analyzer/types/apex_IR/queryVisitor/comparisonOperator.ts#L31-L50)                                        |
| 🔴 高   | `arrayCreatorRest` の `value` / `size` が逆                                                                   | [arrayCreatorRest.ts](../src/analyzer/types/apex_IR/restVisitor/arrayCreatorRest.ts#L33-L48)                                             |
| 🔴 高   | `whenValue` のガードが常に真 → `switch` 文が必ず `ErrorTypeClass`                                             | [whenValue.ts](../src/analyzer/types/apex_IR/valueVisitor/whenValue.ts#L24-L31)                                                          |
| 🔴 高   | `upsert` 文がガードで弾かれ常に `ErrorTypeClass`                                                              | [statementVisitor/normal.ts](../src/analyzer/types/apex_IR/statementVisitor/normal.ts#L78-L100)                                          |
| 🔴 高   | `CommonVisitor.visit(null)` の catch 内で再度 `TypeError`（null 安全でない）                                  | [commonVisitor.ts](../src/analyzer/types/apex_IR/commonVisitor.ts#L75-L87)                                                               |
| 🟠 中   | `void` のインターフェースメソッドで `visit(null)`                                                             | [interfaceMethodDeclaration.ts](../src/analyzer/types/apex_IR/declarationVisitor/interfaceMethodDeclaration.ts#L40)                      |
| 🟠 中   | 型引数なし `List` / `Set` / `Map` で `visit(null)`                                                            | [typeName.ts](../src/analyzer/types/apex_IR/nameVisitor/typeName.ts#L28-L33)                                                             |
| 🟠 中   | `List<String>[]` など、コレクション型の配列次元が落ちる                                                       | [typeRef.ts](../src/analyzer/types/apex_IR/typeVisitor/typeRef.ts#L31-L39)                                                               |
| 🟠 中   | `type` 文字列の誤り（`limitClause` / `elseClasuse` / `conditionalExpression` / `InterfaceMethodDeclaration`） | 4 ファイル（§4 参照）                                                                                                                    |
| 🟠 中   | FROM 句のオブジェクト名とエイリアスの対応・順序が失われる                                                     | [fromNameList.ts](../src/analyzer/types/apex_IR/listVisitor/fromNameList.ts#L22-L33)                                                     |
| 🟠 中   | ブラウザ向けバンドルに入るコードで `import { get } from 'http'`                                               | [propertyDeclaration.ts](../src/analyzer/types/apex_IR/declarationVisitor/propertyDeclaration.ts#L9)                                     |
| 🟡 低   | 効かないガード条件、タイプミス、未使用 import、命名揺れ                                                       | §4 各ファイル                                                                                                                            |

---

## 3. 横断的な指摘

### 3.1 循環 import による TDZ（最優先）

各フォルダの `index.ts` は「基底クラス（`XxxTypeClass<T>`）」と「Visitor」を定義し、同時に各ファイルを `import` している。一方、各ファイルは `import { XxxTypeClass } from '.'` で基底クラスを取り込んで `extends` している。

```text
declarationVisitor/index.ts ──import──▶ memberDeclaration.ts
        ▲                                  │
        └──────────import { DeclarationTypeClass } from '.'
```

ESM ではクラス宣言は TDZ を持つため、`index.ts` の評価が終わる前に `class MemberDeclarationTypeClass extends DeclarationTypeClass` が評価されて落ちる。

```text
ReferenceError: Cannot access 'DeclarationTypeClass' before initialization
    at src/analyzer/types/apex_IR/declarationVisitor/memberDeclaration.ts:33:49
```

テスト実行時は入口の違いで `TypeTypeClass` / `ExpressionListTypeClass` / `IdValueTypeClass` / `PrimaryTypeClass` / `PrimitiveLiteralTypeClass` / `RestTypeClass` でも同様に失敗しており、**全フォルダ共通の構造問題**。

修正案:

- 各フォルダの基底クラスとその型ガードを `base.ts` に分離し、各ファイルは `./base` から import する（`base.ts` は同フォルダのファイルを import しない）。
- `index.ts` は `base.ts` と各ファイルの re-export と Visitor 定義だけにする。
- 他フォルダの Visitor（`new ExpressionVisitor()` 等）はメソッド内でしか使っていないため、クラス評価時には不要で、フォルダ間の循環は TDZ にならない。

### 3.2 `tsc --noEmit` エラー

| エラー                                                | 原因                                                                                                                                                                                                                       |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts(11)`: `ExpressionListTypeClass` 重複 export | [expressionVisitor/index.ts](../src/analyzer/types/apex_IR/expressionVisitor/index.ts#L132) の基底クラスと [listVisitor/expressionList.ts](../src/analyzer/types/apex_IR/listVisitor/expressionList.ts) の具象クラスが同名 |
| `index.ts(22)`: `TypeListTypeClass` 重複 export       | [typeVisitor/index.ts](../src/analyzer/types/apex_IR/typeVisitor/index.ts#L24) の基底クラスと [listVisitor/typeList.ts](../src/analyzer/types/apex_IR/listVisitor/typeList.ts) の具象クラスが同名                          |
| `arrayCreatorRest.ts(49)`: 型不一致                   | §4 restVisitor 参照（`value` と `size` が逆）                                                                                                                                                                              |

基底クラスは `ExpressionListBaseTypeClass` のように名前で区別することを推奨。`export *` の衝突は実行時に**黙って両方とも export されなくなる**ため、型エラーのまま放置しないこと。

### 3.3 `CommonVisitor.visit()` が null 安全でない

```ts
override visit(ctx: ApexParserRuleContext) {
    try {
        return super.visit(ctx);           // ctx が null → TypeError
    } catch (error) {
        return ErrorTypeClass.create(
            ctx.constructor.name,          // ← ここで再び TypeError（catch 外へ送出）
            ctx.getText(),
            ...
```

- 任意子要素（`ctx.typeRef()` 等）を確認せずに `visit()` へ渡す箇所が複数あり（§4）、その場合 `ErrorTypeClass` 化されず**親ノードごと**エラーになる。
- `ctx?.constructor.name ?? 'null'` のように catch 側を null 安全にするか、`visit()` 冒頭で null を `ErrorTypeClass` に変換する。

### 3.4 `isValidClass` の例外が親ノード単位で失われる

`isValidClass` は型不一致時に `throw` するため、子 1 つの不一致で親の `create()` 全体が中断し、親が丸ごと `ErrorTypeClass` になる。子だけを `ErrorTypeClass` に置き換える（`return ErrorTypeClass.create(...)`）方が、部分解析の方針（[apex-ir-design.md](apex-ir-design.md)）と合う。

### 3.5 ガードの書き方

- 「`create()` 冒頭で必須子要素を検査 → 以降で取り出し」という流れ自体は良いが、`&&` / `||` の取り違えで**常に偽（＝何も検査しない）または常に真（＝常に例外）**になっているガードが多い（`whenValue` / `dotExpression` / `fromNameList` / `classBody` / `interfaceBody` / `typeName`）。
- `xxx_list()` は null にならないので `!ctx.xxx_list()` は不要。
- `if (!ctx)` は `create(ctx)` が Visitor 経由でしか呼ばれない以上到達しない（`normal.ts` 系、`arrayCreatorRest.ts` など 9 箇所）。
- エラーメッセージで `' + ctx` としている箇所は `[object Object]` になる。`ctx.getText()` に統一する。

### 3.6 Visitor の生成コスト

`create()` のたびに `new ExpressionVisitor()` 等を生成している。Visitor は状態を持たないため、フォルダごとにシングルトンを export すれば十分。

### 3.7 命名の揺れ

- ファイル名: `GroupByClause.ts` / `SetCreatorRest.ts` のみ PascalCase。
- `type` 文字列: `allRowClause`（文法は `allRowsClause`）、`statement`（`NormalStatementTypeClass`）、`InterfaceMethodDeclaration`（先頭大文字）。
- `bitNotExpression` は文法名由来だが実体は XOR（`^`）。IR 上は意味名（`xor`）にした方が誤読を防げる（[apex-ir-design.md](apex-ir-design.md) の「文法規則由来の名前を node kind にしない」方針とも一致）。
- `visitExpression(ctx: ExpressionContext)` は、`ExpressionContext` がラベル付き代替の抽象基底で `accept` から呼ばれないため到達しない。[expressionVisitor/normal.ts](../src/analyzer/types/apex_IR/expressionVisitor/normal.ts) も実質未使用。

---

## 4. ファイル別レビュー

「指摘なし」は、今回の観点（文法との対応・null 処理・型文字列・ガード）で問題が見つからなかったもの。§3 の横断的指摘（循環 import 等）は全ファイル共通のため個別には再掲しない。

### commonVisitor.ts / index.ts

| ファイル                                                           | 指摘                                                          |
| ------------------------------------------------------------------ | ------------------------------------------------------------- |
| [commonVisitor.ts](../src/analyzer/types/apex_IR/commonVisitor.ts) | §3.3 null 安全でない catch。§3.4 `isValidClass` が throw する |
| [index.ts](../src/analyzer/types/apex_IR/index.ts)                 | §3.2 重複 export 2 件                                         |

### argumentsVisitor

| ファイル                                | 指摘     |
| --------------------------------------- | -------- |
| index.ts / normal.ts / typeArguments.ts | 指摘なし |

### blockVisitor

| ファイル                                                                                                                | 指摘     |
| ----------------------------------------------------------------------------------------------------------------------- | -------- |
| index.ts / anonymousBlock.ts / finallyBlock.ts / getter.ts / normal.ts / propertyBlock.ts / setter.ts / triggerBlock.ts | 指摘なし |

### bodyVisitor

| ファイル                                                                               | 指摘                                                                                                        |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [classBody.ts](../src/analyzer/types/apex_IR/bodyVisitor/classBody.ts#L29)             | `!list && list.length > 0` は常に偽で、ガードとして機能しない。空クラスは正当なのでガード自体を削除してよい |
| [interfaceBody.ts](../src/analyzer/types/apex_IR/bodyVisitor/interfaceBody.ts#L24-L26) | 同上                                                                                                        |
| index.ts                                                                               | 指摘なし                                                                                                    |

### callVisitor

| ファイル                                    | 指摘     |
| ------------------------------------------- | -------- |
| index.ts / dotMethodCall.ts / methodCall.ts | 指摘なし |

### clauseVisitor

| ファイル                                                                                                                                                                                                                                                                     | 指摘                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [offsetClause.ts](../src/analyzer/types/apex_IR/clauseVisitor/offsetClause.ts#L14)                                                                                                                                                                                           | `super('limitClause', ...)`。`limitClause.ts` からのコピペ誤り。`'offsetClause'` に修正                   |
| [elseClause.ts](../src/analyzer/types/apex_IR/clauseVisitor/elseClause.ts#L10)                                                                                                                                                                                               | `'elseClasuse'` のタイプミス                                                                              |
| [filteringSelector.ts](../src/analyzer/types/apex_IR/clauseVisitor/filteringSelector.ts#L34)                                                                                                                                                                                 | ガード名 `isFileteringSelectorType` のタイプミス（index.ts と dataCategorySelection.ts も追従修正が必要） |
| [allRowClause.ts](../src/analyzer/types/apex_IR/clauseVisitor/allRowClause.ts)                                                                                                                                                                                               | 文法は `AllRowsClause`。ファイル名・`type` 文字列を `allRowsClause` に揃える                              |
| [GroupByClause.ts](../src/analyzer/types/apex_IR/clauseVisitor/GroupByClause.ts)                                                                                                                                                                                             | ファイル名のみ PascalCase                                                                                 |
| index.ts / catchClause.ts / dataCategorySelection.ts / fieldGroupBy.ts / fieldOrder.ts / forClauses.ts / limitClause.ts / orderByClause.ts / soslClauses.ts / soslWithClause.ts / typeOf.ts / updateType.ts / usingScope.ts / whenClause.ts / whereClause.ts / withClause.ts | 指摘なし                                                                                                  |

### controlVisitor

| ファイル                                                                                      | 指摘     |
| --------------------------------------------------------------------------------------------- | -------- |
| index.ts / enhancedForControl.ts / forControl.ts / forInit.ts / forUpdate.ts / whenControl.ts | 指摘なし |

### declarationVisitor

| ファイル                                                                                                                                                                                                                                                                                               | 指摘                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| [index.ts](../src/analyzer/types/apex_IR/declarationVisitor/index.ts#L68)                                                                                                                                                                                                                              | `DeclarationTypeClass` を定義しつつ各ファイルを import しており、TDZ の発生源（§3.1）                                                                |
| [interfaceMethodDeclaration.ts](../src/analyzer/types/apex_IR/declarationVisitor/interfaceMethodDeclaration.ts#L40)                                                                                                                                                                                    | `void run();` のとき `ctx.typeRef()` が null のまま `visit()`。`methodDeclaration.ts` と同様に `ctx.VOID() ? 'void' : ...` で分岐する                |
| 〃 [L27](../src/analyzer/types/apex_IR/declarationVisitor/interfaceMethodDeclaration.ts#L27)                                                                                                                                                                                                           | `type` が `'InterfaceMethodDeclaration'`（先頭大文字）。他と揃えて `'interfaceMethodDeclaration'`                                                    |
| 〃 [L14](../src/analyzer/types/apex_IR/declarationVisitor/interfaceMethodDeclaration.ts#L14)                                                                                                                                                                                                           | 未使用 import `InsertStatementTypeClass`                                                                                                             |
| [propertyDeclaration.ts](../src/analyzer/types/apex_IR/declarationVisitor/propertyDeclaration.ts#L9)                                                                                                                                                                                                   | 未使用の `import { get } from 'http'`（エディタの自動 import 誤爆）。Vite のブラウザビルドで Node 組み込みモジュール解決エラーになり得るため削除必須 |
| anonymousMemberDeclaration.ts / classBodyDeclaration.ts / classDeclaration.ts / constructorDeclaration.ts / enumConstants.ts / enumDeclaration.ts / fieldDeclaration.ts / localVariableDeclaration.ts / memberDeclaration.ts / methodDeclaration.ts / triggerMemberDeclaration.ts / typeDeclaration.ts | 指摘なし                                                                                                                                             |

### entryVisitor

| ファイル                                     | 指摘     |
| -------------------------------------------- | -------- |
| index.ts / selectEntry.ts / subFieldEntry.ts | 指摘なし |

### expressionVisitor

| ファイル                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 指摘                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [cmpExpression.ts](../src/analyzer/types/apex_IR/expressionVisitor/cmpExpression.ts#L45)                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 文法は `expression (GT \| LT) ASSIGN? expression`。`ctx.ASSIGN() ? '=' : ...` のため `<=` / `>=` が `'='` になる。`(GT ? '>' : '<') + (ASSIGN ? '=' : '')` とする。ガード（L29）の `!ctx.ASSIGN()` も不要 |
| [dotExpression.ts](../src/analyzer/types/apex_IR/expressionVisitor/dotExpression.ts#L28-L32)                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `!expression && (!anyId \|\| !dotMethodCall) && (!DOT \|\| !QUESTIONDOT)` は意図（いずれか欠落で例外）と逆で、ほぼ常に偽。`!expr \|\| (!anyId && !dotMethodCall) \|\| (!DOT && !QUESTIONDOT)`             |
| [boundExpression.ts](../src/analyzer/types/apex_IR/expressionVisitor/boundExpression.ts#L18-L19)                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `!ctx.COLON`（呼び出し漏れ）で常に偽。エラーメッセージが `' + ctx`                                                                                                                                        |
| [whereConditionalExpression.ts](../src/analyzer/types/apex_IR/expressionVisitor/whereConditionalExpression.ts#L20)                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `type` が `'conditionalExpression'` で `ConditionalExpressionTypeClass` と衝突。`'whereConditionalExpression'` に。L26 のメッセージも `ConditionalExpressionContext` と誤記                               |
| [whereLogicalExpression.ts](../src/analyzer/types/apex_IR/expressionVisitor/whereLogicalExpression.ts#L37)                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `isValidClassList` の第 3 引数が `'conditionalExpression'`（実際は `whereConditionalExpression`）。エラーメッセージが誤誘導になる                                                                         |
| [index.ts](../src/analyzer/types/apex_IR/expressionVisitor/index.ts#L132)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `ExpressionListTypeClass` が listVisitor と重複（§3.2）。`visitExpression` は到達不能（§3.7）                                                                                                             |
| [bitNotExpression.ts](../src/analyzer/types/apex_IR/expressionVisitor/bitNotExpression.ts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 実体は XOR（§3.7、命名のみ）                                                                                                                                                                              |
| normal.ts / parExpression.ts / subExpression.ts                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `if (!ctx)` は到達不能（§3.5）                                                                                                                                                                            |
| arrayExpression.ts / arth1Expression.ts / arth2Expression.ts / assignExpression.ts / bitAndExpression.ts / bitExpression.ts / bitOrExpression.ts / castExpression.ts / coalExpression.ts / condExpression.ts / conditionalExpression.ts / equalityExpression.ts / fieldExpression.ts / filteringExpression.ts / instanceOfExpression.ts / logAndExpression.ts / logicalExpression.ts / logOrExpression.ts / methodCallExpression.ts / negExpression.ts / newExpression.ts / postOpExpression.ts / preOpExpression.ts / primaryExpression.ts / whereFieldExpression.ts | 指摘なし                                                                                                                                                                                                  |

### idVisitor

| ファイル                         | 指摘                           |
| -------------------------------- | ------------------------------ |
| anyId.ts / normal.ts / soqlId.ts | `if (!ctx)` は到達不能（§3.5） |
| index.ts / soslId.ts             | 指摘なし                       |

### listVisitor

| ファイル                                                                                                                                                                                                           | 指摘                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [fromNameList.ts](../src/analyzer/types/apex_IR/listVisitor/fromNameList.ts#L15-L18)                                                                                                                               | `(!list && list.length === 0)` は常に偽。文法は `fieldName soqlId? (COMMA fieldName soqlId?)*` なので最低 1 件は保証され、ガードは不要                                                   |
| 〃 [L22-L33](../src/analyzer/types/apex_IR/listVisitor/fromNameList.ts#L22-L33)                                                                                                                                    | `fieldName` 全件 → `soqlId` 全件の順に連結しており、`FROM Account a, Contact c` で「どのエイリアスがどのオブジェクトか」が失われる。子要素を順に走査して `{ name, alias? }` のペアにする |
| [typeList.ts](../src/analyzer/types/apex_IR/listVisitor/typeList.ts) / [expressionList.ts](../src/analyzer/types/apex_IR/listVisitor/expressionList.ts)                                                            | 他フォルダの基底クラスと同名（§3.2）                                                                                                                                                     |
| index.ts / fieldGroupByList.ts / fieldList.ts / fieldNameList.ts / fieldOrderList.ts / fieldSpecList.ts / formalParameterList.ts / networkList.ts / selectList.ts / subFieldList.ts / updateList.ts / valueList.ts | 指摘なし                                                                                                                                                                                 |

### literalVisitor

| ファイル                                                                                    | 指摘                                                |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [signedInteger.ts](../src/analyzer/types/apex_IR/literalVisitor/signedInteger.ts#L38-L40)   | ガード引数名 `taraget` のタイプミス（動作影響なし） |
| [signedNumber.ts](../src/analyzer/types/apex_IR/literalVisitor/signedNumber.ts#L45-L46)     | 同上                                                |
| index.ts / normal.ts / soqlLiteral.ts / soslLiteral.ts / soslLiteralAlt.ts / whenLiteral.ts | 指摘なし                                            |

### memberVisitor

| ファイル                                                   | 指摘     |
| ---------------------------------------------------------- | -------- |
| index.ts / anonymousBlockMember.ts / triggerBlockMember.ts | 指摘なし |

### modifierVisitor

| ファイル                                                                     | 指摘                                                                                                                                |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [annotation.ts](../src/analyzer/types/apex_IR/modifierVisitor/annotation.ts) | `elementValue` と `elementValuePairs` を独立した `if` で順に代入している。文法上排他なので `else if` にして意図を明確にする（軽微） |
| index.ts / normal.ts                                                         | 指摘なし                                                                                                                            |

### nameVisitor

| ファイル                                                                                            | 指摘                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [typeName.ts](../src/analyzer/types/apex_IR/nameVisitor/typeName.ts#L28-L33)                        | 文法は `LIST typeArguments?` 等で型引数は任意。`List` 単体で `ctx.typeArguments()` が null のまま `visit()` され、§3.3 により親ごとエラーになる。`typeArguments() ? ... : null` で分岐する |
| 〃 [L22](../src/analyzer/types/apex_IR/nameVisitor/typeName.ts#L22)                                 | ガードの `ctx.typeArguments()` が否定されておらず、条件の意図が不明。`!LIST && !SET && !MAP && !id` で十分                                                                                 |
| index.ts / createName.ts / dataCategoryName.ts / dateFieldName.ts / fieldName.ts / qualifiedName.ts | 指摘なし                                                                                                                                                                                   |

### pairVisitor

| ファイル                                                                                             | 指摘     |
| ---------------------------------------------------------------------------------------------------- | -------- |
| index.ts / elementValuePair.ts / elementValuePairs.ts / idCreatedNamePair.ts / mapCreatorRestPair.ts | 指摘なし |

### parameterVisitor

| ファイル                                                                     | 指摘     |
| ---------------------------------------------------------------------------- | -------- |
| index.ts / formalParameter.ts / formalParameters.ts / soqlFieldsParameter.ts | 指摘なし |

### primaryVisitor

| ファイル                                                                                                                                              | 指摘                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| normal.ts                                                                                                                                             | `if (!ctx)` は到達不能（§3.5） |
| index.ts / idPrimary.ts / literalPrimary.ts / soqlPrimary.ts / soslPrimary.ts / superPrimary.ts / thisPrimary.ts / typeRefPrimary.ts / voidPrimary.ts | 指摘なし                       |

### queryVisitor

| ファイル                                                                                              | 指摘                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [comparisonOperator.ts](../src/analyzer/types/apex_IR/queryVisitor/comparisonOperator.ts#L31-L50)     | ① 文法の `<=` / `>=` は `LT ASSIGN` / `GT ASSIGN` の 2 トークン。先に `ASSIGN()` を判定しているため `'='` になる。② `NOT IN` は `value = 'NOT IN'` の直後に `value = 'IN'` で上書き。③ `LESSANDGREATER`（`<>`）の `getText()` が値型 union に含まれず `as` で握りつぶしている |
| index.ts / dateFormula.ts / fieldSpec.ts / normal.ts / searchGroup.ts / soqlFunction.ts / subQuery.ts | 指摘なし                                                                                                                                                                                                                                                                      |

### restVisitor

| ファイル                                                                                     | 指摘                                                                                                                                                               |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [arrayCreatorRest.ts](../src/analyzer/types/apex_IR/restVisitor/arrayCreatorRest.ts#L33-L48) | `ctx.expression()`（`[5]` のサイズ）を `value` に、`ctx.arrayInitializer()`（`{1, 2}`）を `size` に入れており逆。`tsc` エラーの原因。L29 の `if (!ctx)` は到達不能 |
| [SetCreatorRest.ts](../src/analyzer/types/apex_IR/restVisitor/SetCreatorRest.ts)             | ファイル名のみ PascalCase                                                                                                                                          |
| noRest.ts                                                                                    | `if (!ctx)` は到達不能（§3.5）                                                                                                                                     |
| index.ts / classCreatorRest.ts / creator.ts / mapCreatorRest.ts                              | 指摘なし                                                                                                                                                           |

### statementVisitor

| ファイル                                                                                                                                                                                                                                                                                                                                                                                                                                             | 指摘                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [normal.ts](../src/analyzer/types/apex_IR/statementVisitor/normal.ts#L78-L100)                                                                                                                                                                                                                                                                                                                                                                       | ガードで `!ctx.updateStatement()` が 2 回あり `!ctx.upsertStatement()` が無い。`upsert` 文は他の子が全て null のため例外になる。後段の `else if` 連鎖にも `updateStatement` 分岐が重複（到達不能） |
| index.ts / accessLevel.ts / breakStatement.ts / continueStatement.ts / deleteStatement.ts / doWhileStatement.ts / expressionStatement.ts / forStatement.ts / ifStatement.ts / insertStatement.ts / localVariableDeclarationStatement.ts / mergeStatement.ts / returnStatement.ts / runAsStatement.ts / switchStatement.ts / throwStatement.ts / tryStatement.ts / undeleteStatement.ts / updateStatement.ts / upsertStatement.ts / whileStatement.ts | 指摘なし                                                                                                                                                                                           |

### typeVisitor

| ファイル                                                                                   | 指摘                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [typeRef.ts](../src/analyzer/types/apex_IR/typeVisitor/typeRef.ts#L31-L39)                 | `typeName.getValue()` が文字列（`'list' \| 'set' \| 'map'`）のとき `dimension` を取得しない。`List<String>[]` の配列次元が失われる。文法上 `arraySubscripts` は常に存在するので無条件に取得すればよい（`String` は 0、`List<String>` も 0 で統一） |
| [arraySubscripts.ts](../src/analyzer/types/apex_IR/typeVisitor/arraySubscripts.ts#L13-L17) | `_list()` は null にならないため前 2 条件は冗長。`LBRACK` と `RBRACK` の数の比較だけでよい                                                                                                                                                         |
| [index.ts](../src/analyzer/types/apex_IR/typeVisitor/index.ts#L24)                         | `TypeListTypeClass` が listVisitor と重複（§3.2）                                                                                                                                                                                                  |

### unitVisitor

| ファイル                                                                           | 指摘     |
| ---------------------------------------------------------------------------------- | -------- |
| index.ts / anonymousUnit.ts / compilationUnit.ts / triggerCase.ts / triggerUnit.ts | 指摘なし |

### valueVisitor

| ファイル                                                                            | 指摘                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [whenValue.ts](../src/analyzer/types/apex_IR/valueVisitor/whenValue.ts#L24-L31)     | 文法は `ELSE \| whenLiteral (COMMA whenLiteral)* \| typeRef id` の 3 択なのに、ガードが「ELSE が無い **または** whenLiteral が無い **または** …」で、どの形でも必ず例外になる。`!ELSE && whenLiteral_list().length === 0 && (!typeRef \|\| !id)` に修正 |
| [locationValue.ts](../src/analyzer/types/apex_IR/valueVisitor/locationValue.ts#L51) | `'coodinateValue'` のタイプミス（エラーメッセージのみ）                                                                                                                                                                                                 |
| index.ts / coordinateValue.ts / elementValue.ts / normal.ts                         | 指摘なし                                                                                                                                                                                                                                                |

### variableVisitor

| ファイル                                                                        | 指摘     |
| ------------------------------------------------------------------------------- | -------- |
| index.ts / arrayInitializer.ts / variableDeclarator.ts / variableDeclarators.ts | 指摘なし |

---

## 5. テスト

Node 標準の `node:test` と既存の `tsx` を使う（追加依存なし）。

```powershell
npm test
```

| ファイル                                                       | 内容                                                                                                         |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [test/apex_IR/helpers.ts](../test/apex_IR/helpers.ts)          | 任意ルールのパース（テスト入力の構文エラーは即失敗）、IR 内の `ErrorTypeClass` / `type` の収集               |
| [module.test.ts](../test/apex_IR/module.test.ts)               | `apex_IR/index.ts` と 25 フォルダの `index.ts` が単独で読み込めること（§3.1）                                |
| [commonVisitor.test.ts](../test/apex_IR/commonVisitor.test.ts) | `ErrorTypeClass` / `isValidClass` / `isValidClassList`、`visit(null)` の扱い（§3.3）                         |
| [expression.test.ts](../test/apex_IR/expression.test.ts)       | 比較演算子 `<` `>` `<=` `>=`、`.` / `?.`、単項・二項・三項・`??`、bound 式、where 条件式の `type`            |
| [query.test.ts](../test/apex_IR/query.test.ts)                 | SOQL 比較演算子 11 種、`offsetClause` / `limitClause`、FROM 句の順序、SOQL 全体                              |
| [type.test.ts](../test/apex_IR/type.test.ts)                   | 配列次元（`List<String>[]` 含む）、修飾名、型引数なし `List`、`arrayCreatorRest`                             |
| [statement.test.ts](../test/apex_IR/statement.test.ts)         | 文 17 種（`upsert` 含む）、`switch`、`whenValue` 3 形式                                                      |
| [unit.test.ts](../test/apex_IR/unit.test.ts)                   | クラス（初期化子なしフィールド・空宣言 `;` 含む）/ インターフェース（`void` メソッド）/ 匿名 Apex / トリガー |

`query.test.ts` には TYPEOF の `elseClause`、`COUNT()` / `COUNT(Id) ... HAVING` / `FIELDS(STANDARD)` / 負の小数を含む SOQL も追加した。

### 現在の実行結果

- `npm test`: 103 件すべて成功。
- `docs/examples/apex-ir/generate-ir.ts`: 成功。`ParserTest.ir.json` 内の `AnalyzerError` は 31 件 → 2 件。残り 2 件は `ParserTest.cls` 755 行目付近の匿名クラス（Apex では不正な構文）に対するエラー回復の結果で、IR 側の問題ではない。そのため同ファイルを使う全体テストは置いていない。
- `tsc --noEmit`: `apex_IR` 配下のエラーは 0 件。残る 2 件（`parser/apex.ts` の `ApexClass`、`types/apex/modifier.ts` の `ModifierType`）は対象外の既存エラー。

---

## 6. 対応状況

| 指摘                         | 対応                                                                                                                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §3.1 循環 import の TDZ      | 各フォルダの基底クラス・型ガード・union 型を `base.ts` に分離し、`index.ts` の先頭で `export * from './base'` する形にした。各ファイルの `import ... from '.'` は変更不要                                        |
| §3.2 重複 export             | 基底クラスを `ExpressionListBaseTypeClass` / `TypeListBaseTypeClass` に改名                                                                                                                                      |
| §3.3 `visit(null)`           | `CommonVisitor.visit()` 冒頭で null を `ErrorTypeClass` に変換。加えて、Visitor に対応する `visitXxx` が無い（`visitChildren` の戻り値が返る）場合も `ErrorTypeClass` にした                                     |
| §3.4 `isValidClass` の throw | 型不一致は子だけを `ErrorTypeClass` に置き換えるよう変更                                                                                                                                                         |
| §3.5 ガード                  | `whenValue` / `dotExpression` / `boundExpression` / `fromNameList` / `classBody` / `interfaceBody` / `typeName` / `arraySubscripts` を修正。到達不能な `if (!ctx)` を削除し、`' + ctx` を `ctx.getText()` に統一 |
| §3.7 命名                    | `allRowClause.ts` → `allRowsClause.ts`（type も `allRowsClause`）、`GroupByClause.ts` → `groupByClause.ts`、`SetCreatorRest.ts` → `setCreatorRest.ts`                                                            |
| §4 個別バグ                  | 比較演算子（Apex / SOQL）、`arrayCreatorRest`、`upsert`、`interfaceMethodDeclaration`、`typeRef` の配列次元、`type` 文字列 4 件、FROM 句の順序、`http` import、タイプミス 4 件、`annotation` の分岐をすべて修正  |

### テスト・IR 生成で新たに見つかり修正したもの

| ファイル                                                                                                                                                                           | 内容                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [idVisitor/soqlId.ts](../src/analyzer/types/apex_IR/idVisitor/soqlId.ts)                                                                                                           | `ctx.id()` ではなく自分自身を visit しており、常に型不一致                                                         |
| [clauseVisitor/whereClause.ts](../src/analyzer/types/apex_IR/clauseVisitor/whereClause.ts)                                                                                         | `whereLogicalExpression` を `ClauseVisitor` で visit していた（`ExpressionVisitor` が正）                          |
| [blockVisitor/normal.ts](../src/analyzer/types/apex_IR/blockVisitor/normal.ts)                                                                                                     | 空ブロック `{ }` を異常扱いしていた                                                                                |
| [variableVisitor/variableDeclarator.ts](../src/analyzer/types/apex_IR/variableVisitor/variableDeclarator.ts)                                                                       | 初期化子なし（`String name;`）を異常扱いしていた                                                                   |
| [pairVisitor/idCreatedNamePair.ts](../src/analyzer/types/apex_IR/pairVisitor/idCreatedNamePair.ts)                                                                                 | 型引数なし（`new Account()`）を異常扱いしていた                                                                    |
| [expressionVisitor/whereFieldExpression.ts](../src/analyzer/types/apex_IR/expressionVisitor/whereFieldExpression.ts)                                                               | 文法 `fieldExpression \| FORMULA(...) comparisonOperator value` の前者でも演算子・値を必須にしていた               |
| [declarationVisitor/classBodyDeclaration.ts](../src/analyzer/types/apex_IR/declarationVisitor/classBodyDeclaration.ts)                                                             | 空宣言 `;` を異常扱いしていた（value は `null`）                                                                   |
| [literalVisitor/signedInteger.ts](../src/analyzer/types/apex_IR/literalVisitor/signedInteger.ts) / [signedNumber.ts](../src/analyzer/types/apex_IR/literalVisitor/signedNumber.ts) | 符号（`+` / `-`）を必須にしていた                                                                                  |
| [valueVisitor/normal.ts](../src/analyzer/types/apex_IR/valueVisitor/normal.ts)                                                                                                     | `signedNumber` を `isSignedIntegerType` で判定していた                                                             |
| [queryVisitor/soqlFunction.ts](../src/analyzer/types/apex_IR/queryVisitor/soqlFunction.ts)                                                                                         | `COUNT` / `FIELDS` の引数の取り出し元が逆（`COUNT(field)` は `fieldName`、`FIELDS(...)` は `soqlFieldsParameter`） |

なお、§4 で「if 文の else 節」として扱っていた `elseClause` は、文法上は SOQL `TYPEOF ... ELSE fieldList END` の句だった。テストはこちらに合わせて修正した。

### 未対応（設計判断が必要なもの）

- §3.6 Visitor のシングルトン化: 全ファイルに影響し、動作上の問題もないため見送った。
- §3.7 `bitNotExpression`（実体は XOR）の改名と、到達不能な `visitExpression`: IR の `type` 名を変えることになり、[apex-ir-design.md](apex-ir-design.md) の正規化方針と合わせて決めるべきため見送った。
