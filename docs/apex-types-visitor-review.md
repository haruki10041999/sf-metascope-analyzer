# `src/analyzer/types/apex` レビュー

Visitor ベースへ再構成された Apex AST モデリング (`src/analyzer/types/apex` 配下) を対象に、**型の形**・**Visitor への分割方針**・**生成 (maker) 実装の方法**の 3 観点でレビューした結果をまとめる。

- 対象: `@apexdevtools/apex-parser` の各 `XxxContext` → `XxxType` + `makeXxxType()` + `XxxVisitor`
- 構成: 文法カテゴリごとに `xxxVisitor/` フォルダを切り、`index.ts` に `XxxVisitor`（union 型 + dispatch）、各ファイルに `型 + maker` を配置

---

## 1. 総評

- 文法カテゴリ単位（`declarationVisitor` / `expressionVisitor` / `statementVisitor` / `clauseVisitor` …）でフォルダを分ける方針は一貫しており、ファイル 1 つ = 文法ルール 1 つの粒度が保たれていて見通しは良い。
- 「`XxxType`（tagged union）+ `makeXxxType(ctx)` + `XxxVisitor`」の 3 点セットという定型パターンが徹底されており、量産・拡張しやすい。
- 一方で、**型の discriminant を `Omit<T, 'type'>` で剥がす設計**、**Visitor と maker の二重ディスパッチ**、**定型ボイラープレートの手書き量**、**タイプミスが JSON 出力キー／override 判定に直結する**点に、構造的な改善余地がある。

---

## 2. 型の形について

### 2.1 tagged union なのに `type` を剥がしてネストしている（設計上の要注意点）

各型は `type: 'xxx'` を discriminant に持つ tagged union だが、親が子を保持する際は必ず `Omit<ChildType, 'type'>` で discriminant を除去している。

```ts
// classDeclaration.ts
export type ClassDeclarationType = {
    type: 'classDeclaration';
    className: Omit<IdType, 'type'>;
    body: Omit<BodyType, 'type'>;
    extends?: Omit<TypeRefType, 'type'>;
    implements?: Omit<ListType, 'type'>;
};
```

問題点:

- `IdType` / `BodyType` などが **union**（例: `IdType = idType | AnyIdType | SoqlIdType | SoslIdType`）の場合、`type` を剥がすと**判別不能な union** になる。後段（依存解析・ビューア）で「どの id 種別か」を判定できず、絞り込みができない。
- discriminant を残す設計に統一すれば、下流は `switch (node.type)` で網羅的に処理でき、`Omit` の記述も不要になる。
- 「JSON を小さくしたい」意図なら理解できるが、**判別情報を失う代償**が大きい。少なくとも union を保持するフィールドでは `type` を残すことを推奨。

### 2.2 型宣言と実装の不一致（バグ）

`annotation.ts` の `annotation` フィールドは `Omit<IdType, 'type'>` と宣言されているが、実装では `type` を剥がさずそのまま代入している。

```ts
export type AnnotationType = {
    type: 'annotation';
    annotation: Omit<IdType, 'type'>;   // ← type を除く宣言
    ...
};

export const makeAnnotationType = (ctx: AnnotationContext): AnnotationType => {
    const annotation = new IdVisitor().visit(ctx.id());  // ← IdType（type 付き）のまま
    ...
    return { type: 'annotation', annotation: annotation };  // 実行時は type: 'id' が残る
};
```

- 変数経由の代入なので TypeScript の excess-property チェックが効かず**コンパイルは通るが**、実行時 JSON には宣言に無い `type` が混入する。
- 他ファイル（`classDeclaration.ts` 等）は `const { type, ...rest } = ...` で剥がしているため、**annotation だけ挙動が違う**。統一が必要。

### 2.3 discriminant 文字列のタイプミス（JSON 出力キーに直結）

- `methodDeclaration.ts`: `type: 'methoDeclaration'`（正: `methodDeclaration`）。maker・型宣言の両方で誤っており、生成される AST の `type` 値がそのまま誤字になる。
- 下流でこの文字列にマッチングする処理があれば、修正時に破壊的変更になるため早期修正が望ましい。

### 2.4 命名の一貫性

- ファイル名 `triggerMemverDeclaration.ts`（正: `triggerMember...`）。
- `modifier.ts` 内の `ModifierField` は文字列 union で網羅されており良好。ただし内部の暫定値 `'NONE'` を `ModifierField` と別 union にしている点は、`type` 変数の型が `'NONE' | ModifierField` と広がるため、最後に `throw` で握るより **早期 return / switch** の方が型安全。

---

## 3. Visitor への分割方針について

### 3.1 分割の粒度は妥当

- `declarationVisitor` / `expressionVisitor` / `statementVisitor` / `clauseVisitor` / `queryVisitor` … と、ANTLR の文法ルール群に沿った分割で、責務が明確。
- `index.ts` が「union 型定義」と「dispatch クラス」を兼ねる構成は、追加時の編集箇所が 1 箇所に集約されていて良い。

### 3.2 override メソッド名のタイプミス（バグ・要修正）

`expressionVisitor/index.ts` の `VisitLogicalExpression` は**先頭が大文字**で、基底クラス `ApexParserBaseVisitor` の `visitLogicalExpression` を**オーバーライドできていない**。

```ts
VisitLogicalExpression(ctx: LogicalExpressionContext) {  // ← V が大文字。dead method
    return makeLogicalExpressionType(ctx);
}
```

- `LogicalExpressionContext` を visit しても既定実装（`visitChildren`）が走り、`makeLogicalExpressionType` は呼ばれない。
- TypeScript 的にはただのメソッド追加なのでエラーにならず、気付きにくい。`visitLogicalExpression` に修正が必要。
- 同種のミスを機械的に検出するため、`override` 修飾子の付与（`tsconfig` の `noImplicitOverride`）を推奨。付けていれば今回のタイプミスはコンパイルエラーになる。

### 3.3 `memberVisitor` と `declarationVisitor` の命名衝突

- `memberVisitor` は匿名ブロック/トリガーのブロックメンバー、`declarationVisitor` はクラスメンバー宣言を扱っており役割は別だが、名前が近く読み手が混同しやすい。用途が伝わる命名（例: `blockMemberVisitor`）を検討。

---

## 4. 生成（maker）実装の方法について

### 4.1 Visitor と maker の二重ディスパッチ・冗長なインスタンス化

`makeMemberDeclarationType` は、既に `MemberDeclarationContext` と分かっているのに、子ごとに `new DeclarationVisitor().visit(...)` で**もう一段 dispatch** している。

```ts
if (ctx.methodDeclaration()) {
    const { type, ...declaration } = new DeclarationVisitor().visit(ctx.methodDeclaration());
    return { type: 'memberDeclaration', declaration };
}
```

- `ctx.methodDeclaration()` の型は確定しているので、`makeMethodDeclarationType(ctx.methodDeclaration())` を**直接呼べば** Visitor 経由の間接化・毎回の `new` が不要。
- Visitor は状態を持たないため、少なくとも**シングルトン化**（`export const idVisitor = new IdVisitor()`）すれば、`new IdVisitor()` の大量生成を避けられる。現状は maker 呼び出しのたびに new している。

### 4.2 `const { type, ...rest } = ...` ボイラープレートの多発

全 maker で discriminant を剥がす定型が手書きで散在している。ヘルパー化を推奨:

```ts
const omitType = <T extends { type: string }>({ type, ...rest }: T) => rest;
```

- 変数名の衝突回避で `type: _`, `type: __`, `type: ___` と番号を増やす箇所（`methodDeclaration.ts` / `propertyDeclaration.ts`）が発生しており、ヘルパー化で解消できる。

### 4.3 スタイルの不統一

- maker の宣言形式が `export function makeXxx()`（`classDeclaration.ts`）と `export const makeXxx = () => {}`（`methodDeclaration.ts` 他）で混在。どちらかに統一を。
- `methodDeclaration.ts` の `returnType` は IIFE で分岐している。可読性のため通常の `if` か三項＋ヘルパーへ。

```ts
const returnType = ctx.typeRef()
    ? (() => {
          const { type, ...returnType } = makeTypeRefType(ctx.typeRef());
          return returnType;
      })()
    : 'void';
```

### 4.4 エラーハンドリングが「全体停止」型

- 想定外分岐は `throw new Error('値が異常です。...: ' + ctx.getText())` で即停止する（`modifier.ts` / `memberDeclaration.ts` 等）。
- 1 ノードの未対応で解析全体が落ちるため、**ノード単位での握りつぶし＋警告収集**（`unknown` ノードとして生テキスト保持）の方が、実運用の耐障害性が高い。
- エラーメッセージのコンテキスト名が実際の型と食い違う箇所がある（例: `modifier.ts` で `'SoqlIdContext'` と表示）。コピペ由来の残骸なので修正を。

### 4.5 `getText()` 依存

- `idVisitor/id.ts` などは `ctx.getText()` をそのまま値にしている。id 単体では妥当だが、式・型引数など**空白やコメントを含む要素**まで `getText()` に頼ると構造化が失われる。式系の未構造化箇所（既存レビュー `docs/apex-parser-review.md` の指摘）と併せて方針決めを推奨。

---

## 5. 優先度付き改善提案

| 優先  | 項目                                                                                | 対象                                      |
| ----- | ----------------------------------------------------------------------------------- | ----------------------------------------- |
| 🔴 高 | `VisitLogicalExpression` → `visitLogicalExpression` に修正（override 効いていない） | `expressionVisitor/index.ts`              |
| 🔴 高 | `type: 'methoDeclaration'` の誤字修正（出力キーに直結）                             | `declarationVisitor/methodDeclaration.ts` |
| 🔴 高 | `annotation` フィールドの `type` 剥がし漏れ（型と実装の不一致）                     | `annotation.ts`                           |
| 🟠 中 | `noImplicitOverride` 有効化＋各 `visitXxx` に `override` 付与（同種ミス防止）       | `tsconfig.json` / 全 Visitor              |
| 🟠 中 | `Omit<Union, 'type'>` の設計見直し（union は discriminant を残す）                  | 型全般                                    |
| 🟠 中 | Visitor のシングルトン化 / maker 直接呼び出しで二重 dispatch 解消                   | maker 全般                                |
| 🟠 中 | `omitType()` ヘルパーでボイラープレート削減                                         | maker 全般                                |
| 🟡 低 | ファイル名 `triggerMemverDeclaration.ts` の誤字修正                                 | declarationVisitor                        |
| 🟡 低 | maker 宣言スタイル（function / arrow）の統一、IIFE 解消                             | 全般                                      |
| 🟡 低 | エラーメッセージのコンテキスト名の食い違い修正、握りつぶし方針の検討                | maker 全般                                |

---

## 6. 補足

型の網羅度・Visitor 分割の一貫性は高く、量産設計としては良好。今回の重点は「**discriminant の扱い（剥がし過ぎ／剥がし漏れ／誤字）**」と「**override タイプミスの検出をコンパイラに任せる仕組み**」の 2 点。前者は下流の型安全性、後者は今後の同種バグ防止に直結するため、優先対応を推奨する。

---

## 7. 未カテゴライズファイルの分類検討

`apex/` 直下には Visitor フォルダに属さない単体ファイルが 31 個ある。各ファイルがラップしている `XxxContext` と依存関係（import 先）・ANTLR 文法上の親ルールから、入れ込み先を検討した。

### 7.1 既存カテゴリに入れ込めるもの

| ファイル                               | ラップする Context                    | 入れ込み先           | 根拠                                                   |
| -------------------------------------- | ------------------------------------- | -------------------- | ------------------------------------------------------ |
| `formalParameters.ts`                  | `FormalParametersContext`             | `parameterVisitor`   | 既に `formalParameter` / `formalParameterList` が同居  |
| `forInit.ts` / `forUpdate.ts`          | `ForInitContext` / `ForUpdateContext` | `controlVisitor`     | `forControl` / `enhancedForControl` と同じ for 制御系  |
| `enumConstants.ts`                     | `EnumConstantsContext`                | `declarationVisitor` | `enumDeclaration` の構成要素                           |
| `signedInteger.ts` / `signedNumber.ts` | `SignedIntegerContext` 他             | `literalVisitor`     | 数値リテラルの符号付き表現                             |
| `accessLevel.ts`                       | `AccessLevelContext`                  | `statementVisitor`   | DML ステートメントの `as SYSTEM/USER`                  |
| `creator.ts`                           | `CreatorContext`                      | `restVisitor`        | `restVisitor` が `*CreatorRest` 群を保持。creator が親 |
| `elementValuePairs.ts`                 | `ElementValuePairsContext`            | `pairVisitor`        | 実装が `PairVisitor` に依存（`elementValuePair`）      |
| `getter.ts` / `setter.ts`              | `GetterContext` / `SetterContext`     | `blockVisitor`       | `propertyBlock` アクセサ本体。`BlockVisitor` に依存    |
| `triggerCase.ts`                       | `TriggerCaseContext`                  | `unitVisitor`        | `triggerUnit`（`unitVisitor`）の before/after 指定     |

### 7.2 SOQL / SOSL クエリ系 → `queryVisitor` または `clauseVisitor`

SOQL/SOSL のサブルールが多数を占める。**句（clause）に相当するもの**は `clauseVisitor`（既に `GroupByClause` / `orderByClause` / `withClause` 等が同居）、**値・演算子・関数・SOSL 断片**は `queryVisitor` が妥当。

| ファイル                   | ラップする Context             | 入れ込み先      | 役割                                       |
| -------------------------- | ------------------------------ | --------------- | ------------------------------------------ |
| `fieldGroupBy.ts`          | `FieldGroupByContext`          | `clauseVisitor` | GROUP BY 対象（`GroupByClause`）           |
| `fieldOrder.ts`            | `FieldOrderContext`            | `clauseVisitor` | ORDER BY 対象（`orderByClause`）           |
| `usingScope.ts`            | `UsingScopeContext`            | `clauseVisitor` | USING SCOPE                                |
| `updateType.ts`            | `UpdateTypeContext`            | `clauseVisitor` | FOR UPDATE TRACKING/VIEWSTAT               |
| `dataCategorySelection.ts` | `DataCategorySelectionContext` | `clauseVisitor` | WITH DATA CATEGORY                         |
| `filteringSelector.ts`     | `FilteringSelectorContext`     | `clauseVisitor` | データカテゴリ AT/ABOVE/BELOW              |
| `typeOf.ts`                | `TypeOfContext`                | `clauseVisitor` | TYPEOF（`whenClause`/`elseClause` に依存） |
| `comparisonOperator.ts`    | `ComparisonOperatorContext`    | `queryVisitor`  | WHERE 比較演算子                           |
| `dateFormula.ts`           | `DateFormulaContext`           | `queryVisitor`  | 日付リテラル（LAST_N_DAYS 等）             |
| `soqlFunction.ts`          | `SoqlFunctionContext`          | `queryVisitor`  | SOQL 集計/日付/距離関数                    |
| `fieldSpec.ts`             | `FieldSpecContext`             | `queryVisitor`  | SOSL フィールド指定                        |
| `searchGroup.ts`           | `SearchGroupContext`           | `queryVisitor`  | SOSL 検索対象（ALL/NAME 等）               |

> 補足: SOQL 系は 12 ファイルと量が多いため、`clauseVisitor` / `queryVisitor` に振り分ける代わりに、専用の `soqlVisitor` / `soslVisitor` を新設して集約する案も有力。依存解析でクエリを重点的に扱うなら分離した方が見通しが良い。

### 7.3 新カテゴリの新設が妥当なもの

既存カテゴリに自然な受け皿がなく、複数ファイルで 1 ファミリを形成しているもの。新規 `xxxVisitor` を切ることを推奨。

| 新カテゴリ（案）  | 集約するファイル                                                           | ファミリ                                                                            |
| ----------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `modifierVisitor` | `modifier.ts` / `annotation.ts`                                            | クラスメンバー修飾（`modifier` が `annotation` を内包）                             |
| `typeVisitor`     | `typeRef.ts` / `arraySubscripts.ts`                                        | 型参照（`typeName` は `nameVisitor`、`typeArguments` は `argumentsVisitor` に既存） |
| `variableVisitor` | `variableDeclarator.ts` / `variableDeclarators.ts` / `arrayInitializer.ts` | 変数宣言子と初期化子                                                                |

> `elementValuePairs.ts` を `pairVisitor` ではなく `modifierVisitor` 側に寄せる選択肢もある（annotation の構成要素のため）。ただし実装が `PairVisitor` 依存なので、7.1 の通り `pairVisitor` を第一候補とする。

### 7.4 まとめ（振り分け先の集計）

- **既存カテゴリへ**: `parameterVisitor`(1) / `controlVisitor`(2) / `declarationVisitor`(1) / `literalVisitor`(2) / `statementVisitor`(1) / `restVisitor`(1) / `pairVisitor`(1) / `blockVisitor`(2) / `unitVisitor`(1) / `clauseVisitor`(7) / `queryVisitor`(5)
- **新カテゴリへ**: `modifierVisitor`(2) / `typeVisitor`(2) / `variableVisitor`(3)

いずれも「文法ルールのファミリ = フォルダ」という既存方針に沿った分類であり、直下のフラットなファイル群を解消することで、2〜4 章で挙げた `Omit` 設計やヘルパー化の見直しもフォルダ単位で進めやすくなる。
