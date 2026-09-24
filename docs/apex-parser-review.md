# Apex パーサー 実装レビュー

`src/analyzer/types/apex` 配下の Apex AST モデリングと `src/analyzer/parser/apex.ts` のパース処理を確認した結果をまとめる。

- 調査日: 2026-09-24
- 対象: `@apexdevtools/apex-parser` を使った Apex クラスの構文木モデリング

---

## 1. 概要

Apex の構文要素を TypeScript の型 (`XxxType` / `XxxField`) と生成関数 (`makeXxx`) の組で表現する設計。`CompilationUnitContext` を起点に、クラス／メンバー／ステートメント／SOQL まで広範に型が定義されている。

一方で、**「実際に `.cls` ファイルを読み込んで構文木を組み立てる結線」が存在しない** ため、現状は AST モデルの定義群であり、パーサーとしては未完成の状態。

---

## 2. 対応しているもの（実装済み）

### クラス／型宣言 (`cls.ts`, `member/`)

| 要素                                                   | ファイル                | 状態 |
| ------------------------------------------------------ | ----------------------- | ---- |
| クラス宣言（extends / implements / 初期化ブロック）    | `member/class.ts`       | ✅   |
| インターフェース宣言（extends / メソッド）             | `member/interface.ts`   | ✅   |
| Enum 宣言（定数一覧）                                  | `member/enum.ts`        | ✅   |
| メソッド（戻り値 void 対応 / 本体）                    | `member/method.ts`      | ✅   |
| コンストラクタ                                         | `member/constructor.ts` | ✅   |
| プロパティ（getter / setter / 各アクセサ修飾子・本体） | `member/property.ts`    | ✅   |
| フィールド（複数宣言子）                               | `member/field.ts`       | ✅   |
| ネストした class / interface / enum                    | `member/index.ts`       | ✅   |

### 修飾子・アノテーション・型・パラメータ

| 要素                                                                                                                                                    | ファイル        | 状態                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------------------- |
| 修飾子（global/public/protected/private/static/abstract/final/virtual/override/webservice/testmethod/transient/with sharing/without sharing/inherited） | `modifer.ts`    | ✅                   |
| アノテーション（単一値 / key-value ペア）                                                                                                               | `annotation.ts` | ✅                   |
| 型（primitive / custom / List / Set / Map / 配列）                                                                                                      | `type.ts`       | ⚠️（後述の制約あり） |
| メソッドパラメータ（型・修飾子）                                                                                                                        | `params.ts`     | ✅                   |
| 変数宣言子（初期値付き）                                                                                                                                | `variant.ts`    | ✅                   |

### ステートメント (`statement/`)

| 要素                                                           | ファイル                  | 状態                 |
| -------------------------------------------------------------- | ------------------------- | -------------------- |
| ブロック                                                       | `block.ts`                | ✅                   |
| if                                                             | `if.ts`                   | ✅                   |
| switch（when 条件 / else）                                     | `switch.ts`               | ✅                   |
| for（通常 / 拡張 for-each）                                    | `for.ts`                  | ✅                   |
| while / do-while                                               | `while.ts` / `doWhile.ts` | ✅                   |
| try-catch-finally                                              | `try.ts`                  | ✅                   |
| return / throw / break / continue                              | 各ファイル                | ✅                   |
| DML（insert/update/delete/undelete/upsert/merge・AccessLevel） | `dml.ts`                  | ✅                   |
| System.runAs                                                   | `runAs.ts`                | ✅                   |
| ローカル変数宣言                                               | `localVariant.ts`         | ✅                   |
| 式ステートメント                                               | `expression.ts`           | ⚠️（生テキストのみ） |

### SOQL (`soql/`)

| 要素                                                     | ファイル                               | 状態                       |
| -------------------------------------------------------- | -------------------------------------- | -------------------------- |
| SELECT（field / 集計関数 / サブクエリ）                  | `select.ts`                            | ✅                         |
| FROM                                                     | `from.ts`                              | ✅                         |
| WHERE（AND / OR / NOT の論理式ツリー化）                 | `where.ts`                             | ✅                         |
| ORDER BY / LIMIT / OFFSET                                | 各ファイル                             | ✅                         |
| FOR / USING SCOPE / ALL ROWS / UPDATE                    | 各ファイル                             | ✅                         |
| フィールド式（演算子・値・bind・list・null・サブクエリ） | `fieldExpression.ts`                   | ✅                         |
| SOQL 関数（count / normal / fields / date / distance）   | `function/`                            | ⚠️（無限再帰バグあり）     |
| サブクエリ                                               | `subQuery/`                            | ✅                         |
| GROUP BY / HAVING / WITH（型は定義済み）                 | `groupBy.ts` / `having.ts` / `with.ts` | ❌（未結線・デッドコード） |

---

## 3. 未対応・問題点

### 🔴 重大

1. **パース処理そのものが結線されていない**
    - `src/analyzer/parser/apex.ts` の `readApexClass` は `class/*.json` を読み込むだけで、`.cls` の解析を一切行っていない。
    - `ApexParserFactory` を import しているが未使用。`CompilationUnitContext` を得て `makeClsField()` を呼び出すコードがどこにも存在しない（`makeClsField` の呼び出し元ゼロ）。
    - 結果として、豊富な AST モデルは定義されているだけで、実際の Apex ソースはパースされない。
    - 対応: `.cls` 読込 → Lexer/Parser 生成 → `compilationUnit()` → `makeClsField()` の橋渡し実装が必要。

2. **SOQL サブシステムが Apex 解析経路から切断されている**
    - 式は `expression.ts` などで `getText()` の生文字列として取り込むため、インライン SOQL（`[SELECT ...]`）が構造化されない。
    - トップレベルクエリ用の `soql/index.ts#makeSubQueryField`（`QueryContext`）はどこからも呼ばれていない（サブクエリ用の `subQuery/index.ts` のみ使用）。
    - `soql/soql.ts` は空ファイル。

3. **SOQL 関数生成の無限再帰**
    - `soql/function/index.ts` の `_makeSoqlFunctionField` 冒頭:
        ```ts
        if (ctx.soqlFunction()) {
            return _makeSoqlFunctionField(ctx, order, soqlFunctionFields); // ← 同じ ctx を渡している
        }
        ```
    - 子コンテキストではなく同一 `ctx` を再帰呼び出しするため、ネストした関数に到達するとスタックオーバーフローになる。`ctx.soqlFunction()` を渡すべき。

### 🟠 中程度

4. **式が生テキスト依存**
    - `expression`（式ステートメント）、DML の `variant`、`for` の `condition`/`update`、`switch` の `variant`、`merge` の `variants` などが `getText()` の文字列。
    - メソッド呼び出し・代入・変数参照・インライン SOQL/SOSL が構造化されないため、依存関係解析には不十分。

5. **ジェネリック型の取りこぼし (`type.ts`)**
    - `List` / `Set` / `Map` 以外のジェネリック型（例: `Iterable<T>`、カスタム `MyContainer<T>`、`System.Type` 系）の `typeArguments` が無視され、型引数を失う。
    - ドット区切り名（`A.B.C`）の各セグメントに付く型引数も未対応。

6. **GROUP BY / HAVING / WITH がデッドコード**
    - `makeGroupByField` / `makeWithField` はどこからも呼ばれていない。`soql/index.ts` の `QueryField` に `groupBy` / `having` / `with` フィールドが含まれていない（`having` は `groupBy` 経由のみで、その `groupBy` 自体が未結線）。

7. **エラーハンドリング**
    - 想定外構文で `throw new Error(...)` により処理全体が停止する。1 クラスの解析失敗が全体を止めうるため、クラス単位の握りつぶし／収集が望ましい。

### 🟡 軽微

8. **タイプミス（JSON 出力のキーに影響）**
    - `type.ts`: `'primititve'`（正: `primitive`）。
    - `modifer.ts`: `annotaition`（正: `annotation`）。ファイル名 `modifer.ts` も `modifier` のミス。
    - エラーメッセージの表記揺れ: 「値が以上です」（`member/index.ts`）と「値が異常です」が混在。

9. **修飾子あたりのアノテーションが 1 つ固定**
    - `ModifierField.annotaition?: AnnotationField` は単一。Apex では各アノテーションが個別 `modifier` として扱われるため実害は小さいが、モデル名／単数形が誤解を招く。

### ⛔ スコープ外（未着手）

10. **Apex Trigger 未対応** — 型・処理ともになし（`ROADMAP.md` 上も第 2 フェーズ扱い）。
11. **SOSL 未対応**。
12. **コメント / ドキュメンテーション（ApexDoc）の保持なし**。
13. **ソース位置情報（行・列）の保持なし** — 差分表示・ジャンプに必要になる可能性。

---

## 4. 推奨する対応順

1. `apex.ts` に `.cls` 読込 → `ApexParserFactory` → `compilationUnit()` → `makeClsField()` の結線を実装（🔴1）。
2. `soql/function/index.ts` の無限再帰を修正（🔴3）。
3. `QueryField` に `groupBy` / `with` を結線、`soql/soql.ts` を実装またはトップレベルクエリ経路を整理（🔴2 / 🟠6）。
4. タイプミス（`primititve` / `annotaition`）を修正し、出力キーを確定（🟡8）。
5. 式・DML 対象などの構造化方針を決定（依存解析の要件次第）（🟠4）。
6. ジェネリック型の一般化（🟠5）とエラー握りつぶし方針（🟠7）。

---

## 5. 補足

AST モデルの網羅度は高く、構文カバレッジ設計は良好。現状の最大の課題は「実行パスの結線不足」と「一部デッドコード・バグ」であり、モデル定義を活かすための橋渡し実装が最優先。

---

## 6. 文法ルール対応表（`ApexParser.d.ts` 突き合わせ）

`@apexdevtools/apex-parser` の全パーサールール（`RULE_*`）を、実装の `makeXxx` 関数と突き合わせた結果。凡例: ✅対応済み / ⚠️部分対応 / ❌未対応。

### 6.1 宣言・構造（✅ 概ね網羅）

| 文法ルール                                                               | 実装                             | 状態                  |
| ------------------------------------------------------------------------ | -------------------------------- | --------------------- |
| `compilationUnit` / `typeDeclaration`                                    | `cls.ts`                         | ✅（※呼び出し未結線） |
| `classDeclaration` / `classBody` / `classBodyDeclaration`                | `member/class.ts`                | ✅                    |
| `interfaceDeclaration` / `interfaceBody` / `interfaceMethodDeclaration`  | `member/interface.ts`            | ✅                    |
| `enumDeclaration` / `enumConstants`                                      | `member/enum.ts`                 | ✅                    |
| `methodDeclaration`                                                      | `member/method.ts`               | ✅                    |
| `constructorDeclaration`                                                 | `member/constructor.ts`          | ✅                    |
| `fieldDeclaration` / `variableDeclarators` / `variableDeclarator`        | `member/field.ts` / `variant.ts` | ✅                    |
| `propertyDeclaration` / `propertyBlock` / `getter` / `setter`            | `member/property.ts`             | ✅                    |
| `modifier`                                                               | `modifer.ts`                     | ✅                    |
| `annotation` / `elementValuePairs` / `elementValuePair` / `elementValue` | `annotation.ts`                  | ✅                    |
| `formalParameters` / `formalParameterList` / `formalParameter`           | `params.ts`                      | ✅                    |
| `qualifiedName` / `typeList`                                             | 各所で使用                       | ✅                    |

### 6.2 型（⚠️ ジェネリクスに制約）

| 文法ルール                                 | 実装      | 状態 |
| ------------------------------------------ | --------- | ---- |
| `typeRef` / `typeName` / `arraySubscripts` | `type.ts` | ⚠️   |
| `typeArguments`                            | `type.ts` | ⚠️   |

- `List` / `Set` / `Map` と primitive / custom / 配列は対応。
- **未対応**: `List/Set/Map` 以外のジェネリック（`Iterable<T>`、`Database.QueryLocator`、カスタム `MyType<T>` 等）の `typeArguments` を無視。ドット区切り名の各セグメントの型引数も破棄。

### 6.3 ステートメント（✅ ただし式は生テキスト）

| 文法ルール                                                                     | 実装                           | 状態                                                              |
| ------------------------------------------------------------------------------ | ------------------------------ | ----------------------------------------------------------------- |
| `block` / `localVariableDeclaration(Statement)`                                | `block.ts` / `localVariant.ts` | ✅                                                                |
| `ifStatement`                                                                  | `if.ts`                        | ✅                                                                |
| `switchStatement` / `whenControl` / `whenValue` / `whenLiteral`                | `switch.ts`                    | ⚠️ `when Account a { }`（`whenValue` の `typeRef id` 形）が未処理 |
| `forStatement` / `forControl` / `forInit` / `enhancedForControl` / `forUpdate` | `statement/for.ts`             | ✅（condition/update/init は getText）                            |
| `whileStatement` / `doWhileStatement`                                          | `while.ts` / `doWhile.ts`      | ✅                                                                |
| `tryStatement` / `catchClause` / `finallyBlock`                                | `try.ts`                       | ✅                                                                |
| `returnStatement` / `throwStatement` / `breakStatement` / `continueStatement`  | 各ファイル                     | ✅                                                                |
| `accessLevel`                                                                  | `dml.ts`                       | ✅                                                                |
| `insert/update/delete/undelete/upsert/mergeStatement`                          | `dml.ts`                       | ⚠️ upsert の外部 ID（`qualifiedName`）を未取得                    |
| `runAsStatement`                                                               | `runAs.ts`                     | ✅                                                                |
| `expressionStatement`                                                          | `expression.ts`                | ⚠️ `getText()` のみ                                               |

### 6.4 式（❌ ほぼ未構造化）

| 文法ルール                                                                                                | 状態          |
| --------------------------------------------------------------------------------------------------------- | ------------- |
| `expression`（`Assign`/`MethodCall`/`Dot`/`New`/`Cast`/`InstanceOf`/`Cond`/算術/比較 等の全サブタイプ）   | ❌ 生テキスト |
| `primary`（`This`/`Super`/`Id`/`Literal`/`TypeRef`/`Soql`/`Sosl` 等）                                     | ❌            |
| `methodCall` / `dotMethodCall` / `arguments`                                                              | ❌            |
| `creator` / `createdName` / `classCreatorRest` / `arrayCreatorRest` / `mapCreatorRest` / `setCreatorRest` | ❌            |
| `arrayInitializer` / `parExpression` / `expressionList`                                                   | ❌            |

> `new`・メソッド呼び出し・代入・キャスト・三項・インライン SOQL/SOSL がすべて文字列化されるため、参照解決や依存抽出には使えない。

#### 具体的な対応策

`expression` は左再帰＋多数のサブタイプ（`ApexParser.d.ts` の `AssignExpressionContext` / `DotExpressionContext` / `NewExpressionContext` / `CastExpressionContext` / `InstanceOfExpressionContext` など約 25 種）を持つため、**全サブタイプを `makeXxx` で網羅する AST 化はコスト過大**。依存解析（型・オブジェクト参照の抽出）が目的なら、次の 2 段構えが現実的。

**方針 A（推奨・最小実装）: `ApexParserBaseVisitor` で「参照」だけ抽出する**

`ApexParserVisitor` は `visitXxx` が optional な Visitor 定義であり、既定の子巡回を実装したクラスではない。`@apexdevtools/apex-parser` が公開する `ApexParserBaseVisitor<void>` を継承し、必要な `visitXxx` だけを上書きする。各メソッドの最後に `this.visitChildren(ctx)` を呼ぶと、収集対象外の算術・比較・代入なども子ノードへ再帰できる。`getText()` は元の出力として残し、参照情報を追加で収集する。

- 抽出対象と参照先ノード（`ApexParser.d.ts` 準拠）:

    | 抽出したいもの                             | 対象コンテキスト                                                                                | 取り出し方                                                                                    |
    | ------------------------------------------ | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
    | `new Account()` などの生成型               | `NewExpressionContext` → `creator()` → `createdName()` → `idCreatedNamePair().anyId()`          | 型名を連結（`Namespace.Type`）。`idCreatedNamePair().typeList()` でジェネリック引数も再帰取得 |
    | キャスト型 `(Account)x`                    | `CastExpressionContext` → `typeRef()`                                                           | 既存の `makeTypeField(typeRef)` を再利用                                                      |
    | `x instanceof Account`                     | `InstanceOfExpressionContext` → `typeRef()`                                                     | 同上                                                                                          |
    | `Account.SObjectType` / `MyClass.method()` | `DotExpressionContext` → 左 `expression()` ＋ `anyId()` / `dotMethodCall().anyId()`             | 先頭 `IdPrimaryContext` からドット連鎖を辿り修飾名を復元                                      |
    | 静的/インスタンスのメソッド呼び出し        | `MethodCallExpressionContext` → `methodCall().id()`、`DotExpressionContext` → `dotMethodCall()` | 呼び出し名・レシーバを収集（コールグラフ用）                                                  |
    | インライン SOQL `[SELECT ...]`             | `PrimaryExpressionContext` → `primary()` が `SoqlPrimaryContext` → `soqlLiteral().query()`      | 既存の SOQL 生成関数（後述 6.5 の結線）へ委譲                                                 |
    | インライン SOSL                            | `SoslPrimaryContext` → `soslLiteral()`                                                          | SOSL 実装後に委譲（6.6）                                                                      |
    | `Account.class` 等                         | `TypeRefPrimaryContext` → `typeRef()`                                                           | `makeTypeField` を再利用                                                                      |

- 実装形: `src/analyzer/types/apex/expression/` に Collector を置き、`expression.ts` から呼び出す。`QueryField` はトップレベル `query` 用の生成関数を実装した後に利用する。

    ```ts
    import {
        ApexParserBaseVisitor,
        ApexParserVisitor,
        CastExpressionContext,
        DotExpressionContext,
        InstanceOfExpressionContext,
        MethodCallExpressionContext,
        NewExpressionContext,
        PrimaryExpressionContext,
        SoqlPrimaryContext,
    } from '@apexdevtools/apex-parser';

    import { TypeField, makeTypeField } from '../type';

    export type MethodReference = {
        receiver?: string;
        name: string;
    };

    export type ExpressionReferences = {
        typeReferences: TypeField[];
        methodCalls: MethodReference[];
        soqlTexts: string[];
    };

    export class ReferenceCollector extends ApexParserBaseVisitor<void> {
        readonly result: ExpressionReferences = {
            typeReferences: [],
            methodCalls: [],
            soqlTexts: [],
        };

        visitNewExpression = (ctx: NewExpressionContext): void => {
            this.result.typeReferences.push(makeCreatedTypeField(ctx.creator().createdName()));
            this.visitChildren(ctx);
        };

        visitCastExpression = (ctx: CastExpressionContext): void => {
            this.result.typeReferences.push(makeTypeField(ctx.typeRef()));
            this.visitChildren(ctx);
        };

        visitInstanceOfExpression = (ctx: InstanceOfExpressionContext): void => {
            this.result.typeReferences.push(makeTypeField(ctx.typeRef()));
            this.visitChildren(ctx);
        };

        visitMethodCallExpression = (ctx: MethodCallExpressionContext): void => {
            const method = ctx.methodCall();
            this.result.methodCalls.push({ name: method.id().getText() });
            this.visitChildren(ctx);
        };

        visitDotExpression = (ctx: DotExpressionContext): void => {
            if (ctx.dotMethodCall()) {
                this.result.methodCalls.push({
                    receiver: ctx.expression().getText(),
                    name: ctx.dotMethodCall().anyId().getText(),
                });
            }
            this.visitChildren(ctx);
        };

        visitPrimaryExpression = (ctx: PrimaryExpressionContext): void => {
            const primary = ctx.primary();
            if (primary instanceof SoqlPrimaryContext) {
                this.result.soqlTexts.push(primary.soqlLiteral().getText());
            }
            this.visitChildren(ctx);
        };
    }
    ```

    上の `NewExpressionContext` の型名取得は、実際には `createdName()` 用の専用 `makeCreatedTypeField` を追加する。`createdName()` は `TypeRefContext` ではなく `IdCreatedNamePairContext[]` を持つため、`makeTypeField` をそのまま渡せない。`idCreatedNamePair_list()` を連結し、各 `typeList()` を再帰的に変換する実装にする。

    ```ts
    export const collectExpressionReferences = (ctx: ExpressionContext): ExpressionReferences => {
        const collector = new ReferenceCollector();
        collector.visit(ctx);
        return collector.result;
    };
    ```

    `expression.ts` は次の形に変更する。

    ```ts
    export type ExpressionStatementType = {
        type: 'expression';
        expression: string; // 既存: 生テキストは残す
        references: ExpressionReferences;
    };
    ```

    ```ts
    export const makeExpressionStatementType = (
        ctx: ExpressionStatementContext,
    ): ExpressionStatementType => ({
        type: 'expression',
        expression: ctx.expression().getText(),
        references: collectExpressionReferences(ctx.expression()),
    });
    ```

**共通適用箇所**

各生成関数で `getText()` を個別に解析し直さず、式コンテキストをそのまま `collectExpressionReferences` に渡す。既存の文字列フィールドは互換性のため残し、同じ式の参照情報を隣接フィールドに追加する。

| 対象                                                                        | 現在の式取得                                   | 変更内容                                                                                                                |
| --------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `variant.ts`                                                                | `variableDeclaratorCtx.expression().getText()` | `initialValue` を残し、`initialValueReferences: collectExpressionReferences(variableDeclaratorCtx.expression())` を追加 |
| `statement/for.ts`                                                          | condition / update / init を `getText()`       | 各 `ExpressionContext` に Collector を適用。拡張forの `list` も `listReferences` を追加                                 |
| `statement/switch.ts`                                                       | `ctx.expression().getText()`                   | `variantReferences` を追加。`whenLiteral` はリテラルなので通常は参照収集不要                                            |
| `statement/dml.ts`                                                          | `ctx.expression().getText()`                   | `variantReferences` または `variantReferences[]` を追加。`merge` は各 expression に適用                                 |
| `return.ts` / `throw.ts` / `if.ts` / `while.ts` / `doWhile.ts` / `runAs.ts` | 式を `getText()`                               | 対応する `ExpressionContext` / `ExpressionListContext` を Collector に渡す                                              |
| `field.ts` の初期値                                                         | 変数名と初期値だけを保存                       | 式の参照情報を `VariantField` に追加                                                                                    |

`for` の通常形では `forControl().expression()`、`forUpdate().expressionList().expression_list()`、`forInit().expressionList()` をそれぞれ走査する。ローカル宣言形の `forInit().localVariableDeclaration()` は既存の `makeVariantList` を使うため、`makeVariantList` 側で初期値の参照情報も生成する。

実装順は、(1) `expression/references.ts` の Collector と単体テスト、(2) `expression.ts` と `variant.ts`、(3) `for`/`switch`/DML、(4) return/throw/条件式、(5) SOQL生成関数への委譲とする。まず `new Account()`、`foo.bar()`、`(Account)value`、`value instanceof Account`、`[SELECT Id FROM Account]` を含む最小 Apex ソースで、型参照・メソッド呼び出し・SOQL検出を確認する。

**方針 B（将来・フル AST 化）: サブタイプ単位で段階導入**

依存解析以上（リファクタリング支援・型推論など）が必要になった場合のみ。`ExpressionField` を判別可能ユニオンとして定義し、優先度順に生成関数を足す。

1. `primary`（`Id`/`Literal`/`This`/`Super`/`SoqlPrimary`/`TypeRefPrimary`）
2. `DotExpression` / `MethodCallExpression` / `NewExpression`（参照解決の核）
3. `Assign` / `Cast` / `InstanceOf` / `Cond`（三項）
4. 算術・比較・論理（`Arth1/2`、`Cmp`、`Equality`、`LogAnd/LogOr`）と単項（`PreOp`/`PostOp`/`Neg`）

> いずれの方針でも、左再帰の解決は手書き分岐より **`ApexParserVisitor` に委譲**するのが安全（`copyFrom` で生成される具象型を `instanceof` で判定しなくて済む）。まずは方針 A を入れ、6.5 のインライン SOQL 結線とセットで依存抽出を成立させるのが最短。

#### `ExpressionContext` のContext階層

`ApexParser.d.ts` では、`ExpressionContext` は共通の基底Contextであり、実際の式は `copyFrom` で生成される次の具象Contextとして表現される。Visitorでは具象Contextごとの `visitXxx` を実装し、各メソッドで `visitChildren(ctx)` を呼ぶ。

```text
ExpressionContext
├─ PrimaryExpressionContext
│  └─ primary(): PrimaryContext
├─ Arth1ExpressionContext       # * /
├─ CoalExpressionContext        # ??
├─ DotExpressionContext         # . / ?.
├─ BitOrExpressionContext       # |
├─ ArrayExpressionContext       # expr[expr]
├─ NewExpressionContext         # new ...
├─ AssignExpressionContext      # =, +=, -=, ...
├─ MethodCallExpressionContext  # foo(...)
├─ BitNotExpressionContext      # ^
├─ Arth2ExpressionContext       # + -
├─ LogAndExpressionContext      # &&
├─ CastExpressionContext        # (Type)expr
├─ BitAndExpressionContext      # &
├─ CmpExpressionContext         # < >
├─ BitExpressionContext         # 型引数に見える < > の式
├─ LogOrExpressionContext       # ||
├─ CondExpressionContext        # condition ? a : b
├─ EqualityExpressionContext    # ==, !=, ===, !==, <>
├─ PostOpExpressionContext      # expr++, expr--
├─ NegExpressionContext         # !expr, ~expr
├─ PreOpExpressionContext        # ++expr, --expr, +expr, -expr
├─ SubExpressionContext         # (expr)
└─ InstanceOfExpressionContext  # expr instanceof Type
```

各Contextで取得できる子要素は次のとおり。

| Context                       | 主なAccessor                                                               | 子要素の意味                                                |
| ----------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `PrimaryExpressionContext`    | `primary()`                                                                | 識別子、リテラル、`this`、`super`、型、SOQL、SOSLなどの起点 |
| `Arth1ExpressionContext`      | `expression_list()` / `expression(i)` / `MUL()` / `DIV()`                  | 乗算・除算の左右の式                                        |
| `CoalExpressionContext`       | `expression_list()` / `COAL()`                                             | null合体式                                                  |
| `DotExpressionContext`        | `expression()` / `anyId()` / `dotMethodCall()` / `DOT()` / `QUESTIONDOT()` | レシーバに対するプロパティ参照またはメソッド呼び出し        |
| `BitOrExpressionContext`      | `expression_list()` / `BITOR()`                                            | ビットOR                                                    |
| `ArrayExpressionContext`      | `expression_list()` / `LBRACK()` / `RBRACK()`                              | 配列・リストの添字式                                        |
| `NewExpressionContext`        | `creator()` / `NEW()`                                                      | インスタンス、配列、Map、Setの生成                          |
| `AssignExpressionContext`     | `expression_list()` / `ASSIGN()`等                                         | 代入および複合代入                                          |
| `MethodCallExpressionContext` | `methodCall()`                                                             | レシーバを持たないメソッド呼び出し                          |
| `BitNotExpressionContext`     | `expression_list()` / `CARET()`                                            | XOR相当の式                                                 |
| `Arth2ExpressionContext`      | `expression_list()` / `ADD()` / `SUB()`                                    | 加算・減算                                                  |
| `LogAndExpressionContext`     | `expression_list()` / `AND()`                                              | 論理AND                                                     |
| `CastExpressionContext`       | `typeRef()` / `expression()`                                               | 型キャストと対象式                                          |
| `BitAndExpressionContext`     | `expression_list()` / `BITAND()`                                           | ビットAND                                                   |
| `CmpExpressionContext`        | `expression_list()` / `GT()` / `LT()` / `ASSIGN()`                         | 大小比較                                                    |
| `BitExpressionContext`        | `expression_list()` / `LT_list()` / `GT_list()`                            | シフト・型関連の`<`/`>`式                                   |
| `LogOrExpressionContext`      | `expression_list()` / `OR()`                                               | 論理OR                                                      |
| `CondExpressionContext`       | `expression_list()` / `QUESTION()` / `COLON()`                             | 三項条件式。順番は条件、真、偽                              |
| `EqualityExpressionContext`   | `expression_list()` / `EQUAL()`等                                          | 等価・不等価比較                                            |
| `PostOpExpressionContext`     | `expression()` / `INC()` / `DEC()`                                         | 後置インクリメント・デクリメント                            |
| `NegExpressionContext`        | `expression()` / `TILDE()` / `BANG()`                                      | 否定・ビット反転                                            |
| `PreOpExpressionContext`      | `expression()` / `ADD()` / `SUB()` / `INC()` / `DEC()`                     | 前置演算子                                                  |
| `SubExpressionContext`        | `expression()` / `LPAREN()` / `RPAREN()`                                   | 括弧で囲まれた式                                            |
| `InstanceOfExpressionContext` | `expression()` / `typeRef()` / `INSTANCEOF()`                              | 型判定                                                      |

#### `PrimaryContext` の階層

`PrimaryExpressionContext.primary()` の戻り値は `PrimaryContext` であり、さらに次の具象Contextへ分岐する。

```text
PrimaryContext
├─ ThisPrimaryContext       # this
├─ SuperPrimaryContext      # super
├─ LiteralPrimaryContext    # 数値、文字列、真偽値、null
├─ TypeRefPrimaryContext    # Type.class
├─ VoidPrimaryContext       # void.class
├─ IdPrimaryContext         # 識別子
├─ SoqlPrimaryContext       # [SELECT ...]
└─ SoslPrimaryContext       # [FIND ...]
```

| PrimaryContext          | 主なAccessor                      | 収集対象                                       |
| ----------------------- | --------------------------------- | ---------------------------------------------- |
| `ThisPrimaryContext`    | `THIS()`                          | `this` キーワード                              |
| `SuperPrimaryContext`   | `SUPER()`                         | `super` キーワード                             |
| `LiteralPrimaryContext` | `literal()`                       | リテラル値                                     |
| `TypeRefPrimaryContext` | `typeRef()` / `DOT()` / `CLASS()` | `Account.class` などの型参照                   |
| `VoidPrimaryContext`    | `VOID()` / `DOT()` / `CLASS()`    | `void.class`                                   |
| `IdPrimaryContext`      | `id()`                            | 変数・フィールド・単純な型名                   |
| `SoqlPrimaryContext`    | `soqlLiteral()`                   | `SoqlLiteralContext` → `QueryContext`          |
| `SoslPrimaryContext`    | `soslLiteral()`                   | `SoslLiteralContext` / `SoslLiteralAltContext` |

#### 式の内部Context

式の具象Contextからさらに辿れる補助Contextは次のとおり。

```text
NewExpressionContext
└─ CreatorContext
   ├─ CreatedNameContext
   │  └─ IdCreatedNamePairContext[]
   │     ├─ anyId()
   │     └─ typeList()
   ├─ ClassCreatorRestContext
   │  └─ ArgumentsContext
   │     └─ ExpressionListContext
   ├─ ArrayCreatorRestContext
   │  ├─ expression()
   │  └─ ArrayInitializerContext
   ├─ MapCreatorRestContext
   │  └─ MapCreatorRestPairContext[]
   │     └─ expression_list()
   ├─ SetCreatorRestContext
   │  └─ expression_list()
   └─ NoRestContext

MethodCallExpressionContext
└─ MethodCallContext
   ├─ id()
   ├─ THIS() / SUPER()
   └─ ArgumentsContext
      └─ ExpressionListContext

DotExpressionContext
├─ expression()                 # 左側のレシーバ
├─ anyId()                      # プロパティ参照
└─ DotMethodCallContext          # ドット後のメソッド呼び出し
   ├─ anyId()
   └─ ArgumentsContext
```

`visitChildren(ctx)` を呼ぶと、これらの `CreatorContext`、`ArgumentsContext`、`ExpressionListContext`、さらに引数内の `ExpressionContext` まで自動的に降りる。したがってCollectorでは、`new`やメソッド呼び出しを記録した後に必ず子巡回を実行する。

```ts
class ReferenceCollector extends ApexParserBaseVisitor<void> {
    visitNewExpression = (ctx: NewExpressionContext): void => {
        collectCreatedName(ctx.creator().createdName());
        this.visitChildren(ctx);
    };

    visitMethodCallExpression = (ctx: MethodCallExpressionContext): void => {
        collectMethod(ctx.methodCall());
        this.visitChildren(ctx);
    };

    visitDotExpression = (ctx: DotExpressionContext): void => {
        if (ctx.dotMethodCall()) {
            collectDotMethod(ctx.expression(), ctx.dotMethodCall());
        }
        this.visitChildren(ctx);
    };
}
```

式だけを解析する場合は、CompilationUnit全体ではなく、任意の `ExpressionContext` を起点にする。

```ts
const collector = new ReferenceCollector();
collector.visit(variableDeclaratorCtx.expression());
```

これにより、ローカル変数の初期化、`for` の条件・更新式、`switch` の対象式、DMLの対象式、return/throw/while/ifの条件式へ同一Collectorを適用できる。

### 6.5 SOQL（型定義は豊富だが一部が未結線・バグ）

| 文法ルール                                                                                                | 実装                              | 状態                                                                           |
| --------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------ |
| `soqlLiteral`（`[ ... ]`）                                                                                | —                                 | ❌ 式が getText のため到達しない                                               |
| `query`（トップレベル）                                                                                   | `soql/index.ts#makeSubQueryField` | ❌ 呼び出し元ゼロ。かつ `groupBy`/`with` 欠落                                  |
| `subQuery` / `subFieldList` / `subFieldEntry`                                                             | `soql/subQuery/`                  | ⚠️ `typeOf` エントリ未処理                                                     |
| `selectList` / `selectEntry`                                                                              | `soql/select.ts`                  | ⚠️ 別名（`soqlId` alias）・`typeOf` 未処理                                     |
| `fieldName`                                                                                               | `soql/field.ts`                   | ✅（参照パス分解あり）                                                         |
| `fromNameList`                                                                                            | `soql/from.ts`                    | ⚠️ 別名・複数 FROM 名を無視（最後のみ）、検証ロジックが常に false              |
| `soqlFunction`                                                                                            | `soql/function/`                  | ⚠️ ネスト関数（`toLabel(convertCurrency(...))`, `format(...)`）で **無限再帰** |
| `dateFieldName` / `locationValue` / `coordinateValue` / `soqlFieldsParameter`                             | `soql/function/`                  | ✅                                                                             |
| `typeOf` / `whenClause` / `elseClause` / `fieldNameList`                                                  | —                                 | ❌ SELECT 内 `TYPEOF` 未対応                                                   |
| `usingScope`                                                                                              | `soql/usingScope.ts`              | ✅                                                                             |
| `whereClause` / `whereLogicalExpression` / `whereConditionalExpression` / `whereFieldExpression`          | `soql/where.ts`                   | ⚠️ `FORMULA('...')` 形の条件が未処理                                           |
| `fieldExpression` / `comparisonOperator` / `value` / `valueList`                                          | `soql/fieldExpression.ts`         | ✅                                                                             |
| `boundExpression`（bind 変数）                                                                            | `soql/fieldExpression.ts`         | ✅                                                                             |
| `signedNumber` / `signedInteger` / `dateFormula`（`LAST_N_DAYS:n` 等）                                    | —                                 | ⚠️ getText として取り込み                                                      |
| `logicalExpression` / `conditionalExpression`（HAVING 用）                                                | `soql/having.ts`                  | ⚠️ 定義済みだが `groupBy` 経由でのみ到達し、その `groupBy` が未結線            |
| `groupByClause` / `fieldGroupByList` / `fieldGroupBy`                                                     | `soql/groupBy.ts`                 | ⚠️ 実装済みだがトップレベル `query` に未結線                                   |
| `withClause` / `filteringExpression` / `dataCategorySelection` / `dataCategoryName` / `filteringSelector` | `soql/with.ts`                    | ⚠️ DATA CATEGORY まで実装済みだが `query` に未結線                             |
| `orderByClause` / `fieldOrderList` / `fieldOrder`                                                         | `soql/orderBy.ts`                 | ✅                                                                             |
| `limitClause` / `offsetClause` / `allRowsClause` / `forClauses`                                           | 各ファイル                        | ✅                                                                             |
| `updateList` / `updateType`（FOR UPDATE TRACKING/VIEWSTAT）                                               | `soql/update.ts`                  | ✅                                                                             |

### 6.6 SOSL（❌ 全面未対応）

`soslLiteral` / `soslLiteralAlt` / `soslClauses` / `soslWithClause` / `searchGroup` / `fieldSpecList` / `fieldSpec` / `fieldList` / `networkList` / `soslId` — 型・処理ともになし。

### 6.7 Trigger / 匿名 Apex（❌ 未対応）

`triggerUnit` / `triggerCase` / `triggerBlock` / `triggerBlockMember` / `triggerMemberDeclaration`、`anonymousUnit` / `anonymousBlock` / `anonymousBlockMember` — いずれも未対応（`compilationUnit` 経路のみ実装）。

---

## 7. 未対応項目と対応策（サマリー）

| #   | 未対応/問題                                                 | 影響                                     | 対応策                                                                                                                     |
| --- | ----------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | パース処理が未結線（`makeClsField` 未呼び出し）             | Apex を一切解析できない                  | `apex.ts` で `.cls` 読込 →`ApexParserFactory.createParser` →`compilationUnit()` →`makeClsField()` を実装                   |
| 2   | 式が全て getText                                            | 参照/依存抽出不可                        | 依存解析に必要な範囲で `methodCall`/`creator`/`DotExpression` を構造化（まずは型参照・メソッド呼び出しの抽出に限定）       |
| 3   | `soqlFunction` 無限再帰                                     | ネスト関数でスタックオーバーフロー       | `_makeSoqlFunctionField(ctx.soqlFunction(), ...)` と子コンテキストを渡すよう修正、`order` を参照渡し化                     |
| 4   | トップレベル `query` 未結線＋`groupBy`/`with`/`having` 欠落 | インライン SOQL を解析できない・句の欠落 | `soqlLiteral` 経由で `query` を呼ぶ導線を作り、`QueryField` に `groupBy`/`with` を追加。空の `soql/soql.ts` を実装 or 削除 |
| 5   | SELECT の別名・`TYPEOF`、`subFieldEntry` の `TYPEOF` 未処理 | 集計クエリ・多態参照が壊れる             | `selectEntry`/`subFieldEntry` に `typeOf()`・`soqlId()`（alias）分岐を追加                                                 |
| 6   | `whereFieldExpression` の `FORMULA('...')` 未処理           | 数式条件で例外                           | `where.ts` で `FORMULA` 分岐を追加                                                                                         |
| 7   | 型のジェネリクス取りこぼし                                  | 型情報の欠落                             | `typeName.typeArguments()` を汎用的に再帰処理する `generic` 種別を追加                                                     |
| 8   | `switch` の `when 型 変数` 未処理                           | 型スイッチが空条件になる                 | `whenValue.typeRef()`/`id()` 分岐を追加                                                                                    |
| 9   | upsert 外部 ID 未取得                                       | DML 情報の欠落                           | `dml.ts` で upsert 時の `qualifiedName()` を保持                                                                           |
| 10  | SOSL 未対応                                                 | 検索クエリを解析不可                     | フェーズを分け、`soslLiteral` 系の型・生成関数を新設（優先度低）                                                           |
| 11  | Trigger / 匿名 Apex 未対応                                  | `.trigger` を解析不可                    | `triggerUnit` 経路の生成関数を追加（第 2 フェーズ）                                                                        |
| 12  | タイプミス（`primititve`/`annotaition`/`modifer`）          | 出力キーの不整合                         | リネームし出力スキーマを確定                                                                                               |
| 13  | 位置情報・コメント欠落                                      | 差分表示/ジャンプに不足                  | 必要になった段階で `start/stop` トークン位置と `DOC_COMMENT` を保持                                                        |
