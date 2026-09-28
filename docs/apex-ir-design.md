# Apex 中間表現（IR）型設計案

## 目的と前提

`src/analyzer/types/apex` の型群は、ANTLR の `Context` を TypeScript の値へ変換し、後段の解析へ渡す中間表現である。ここでは Visitor の配置ではなく、**生成後のデータを読みやすくし、後続解析が安全に走査・拡張できる形**を提案する。

設計の基本方針:

1. ANTLR の文法ルール名ではなく、Apex の概念（クラス、メソッド、文、式、型）を表す。
2. discriminator を全ノードに残し、union の分岐を型で判別できるようにする。
3. 構文情報と、型解決・シンボル解決などの解析結果を別レイヤーにする。
4. 意味が同じ形は正規化しつつ、解析に必要な構文差・ソース位置は失わない。

これはコンパイラの完全な意味解析済み AST ではなく、**ソースから得た構造化 IR** を想定する。ANTLR の `Context` や Visitor インスタンスは出力に含めない。

## 推奨する全体構成

```text
ApexSource
  └─ CompilationUnit
       ├─ declarations: Declaration[]
       ├─ source: SourceInfo
       └─ diagnostics: Diagnostic[]

Declaration / Statement / Expression / TypeRef / Query
  └─ 各ノードに kind と必要な SourceSpan

SemanticModel（別工程で作成）
  ├─ resolvedTypes
  ├─ symbolReferences
  └─ dependencies
```

パーサー層は `CompilationUnit` までの構文 IR を作り、名前解決や依存関係は別の `SemanticModel` に蓄積する。構文ノード自体へ `resolvedType` などを直接詰め込まないことで、構文解析と解析結果の責務を分けられる。

## 共通型

```ts
export type SourcePosition = {
    offset: number;
    line: number;
    column: number;
};

export type SourceSpan = {
    start: SourcePosition;
    end: SourcePosition;
};

export type NodeBase<K extends string> = {
    kind: K;
    span: SourceSpan;
};

export type Identifier = NodeBase<'Identifier'> & {
    text: string;
};

export type CompilationUnit = NodeBase<'CompilationUnit'> & {
    declarations: Declaration[];
};
```

- `type` は型名・戻り値型などの通常フィールドにも使われるため、ノード種別は `kind` と呼ぶ。
- `span` は行・列だけでなく offset も持たせる。offset は編集差分、診断位置、ソース抜粋に使える。
- 全ノードへの `span` 追加は段階導入でよいが、最終 IR では一貫させる。
- Identifier は単なる string ではなくノードとして保持し、定義箇所や参照箇所を後から結び付けられるようにする。用途によっては `Name` を複数 Identifier の配列として表す。

## 宣言の型

宣言は `Declaration` union として一つにまとめ、メンバー位置に応じた不要なラッパー（`memberDeclaration.declaration`）を作らない。

```ts
export type Declaration =
    | ClassDeclaration
    | InterfaceDeclaration
    | EnumDeclaration
    | MethodDeclaration
    | ConstructorDeclaration
    | FieldDeclaration
    | PropertyDeclaration;

export type ClassDeclaration = NodeBase<'ClassDeclaration'> & {
    name: Identifier;
    modifiers: Modifier[];
    typeParameters: TypeParameter[];
    extends?: TypeRef;
    implements: TypeRef[];
    members: ClassMember[];
};

export type ClassMember =
    | ClassDeclaration
    | InterfaceDeclaration
    | EnumDeclaration
    | MethodDeclaration
    | ConstructorDeclaration
    | FieldDeclaration
    | PropertyDeclaration
    | InitializerBlock;

export type MethodDeclaration = NodeBase<'MethodDeclaration'> & {
    name: Identifier;
    modifiers: Modifier[];
    parameters: Parameter[];
    returnType: TypeRef | VoidType;
    body?: BlockStatement;
};
```

`modifiers`、`implements`、`members`、`parameters` は、0 件でも空配列にする。存在するかどうかが構文上重要な単独値だけを optional にする。abstract/interface method のように本体を持たない可能性は `body?` で表現する。

フィールド宣言のように一つの構文から複数の変数が作られる場合、IR では次のどちらかを明示する。

- 各変数を独立した `FieldDeclaration` とする（後段の依存解析・参照が簡単。推奨）。
- `FieldGroup` と `FieldDeclarator[]` を持ち、共有修飾子・型・元の宣言範囲を保持する（ソース再生成や構文忠実性が要件なら選ぶ）。

ANTLR の `FieldDeclarationContext` をそのまま表すか、意味解析しやすい単位へ分解するかは用途に合わせる。両方必要なら `sourceGroupId` などで元宣言との対応を保持する。

## 型参照

型引数、配列、修飾名を個別に保持し、`List` / `Set` / `Map` の特別扱いを避ける。

```ts
export type TypeRef = NodeBase<'TypeRef'> & {
    name: Identifier[];
    arguments: TypeRef[];
    arrayDimensions: number;
};

export type VoidType = NodeBase<'VoidType'>;
```

例: `Map<String, List<Account[]>>` は `name: [Map]`、`arguments: [String, List<Account[]>]`、内側 `Account[]` の `arrayDimensions: 1` として表す。`System.Type` のような修飾名は `name` の複数要素で表せる。配列の次元数を区別する必要がなければ `isArray: boolean` でもよいが、多次元構文を落とさない。

## Statement と Expression

文と式は別々の tagged union にする。文の制御構造や式の演算子を、文字列化したソースに押し込まない。

```ts
export type Statement =
    | BlockStatement
    | IfStatement
    | ForStatement
    | ReturnStatement
    | ExpressionStatement
    | VariableDeclarationStatement
    | TryStatement
    | DmlStatement;

export type Expression =
    | IdentifierExpression
    | LiteralExpression
    | MemberExpression
    | CallExpression
    | AssignmentExpression
    | BinaryExpression
    | UnaryExpression
    | ConditionalExpression
    | NewExpression
    | ArrayAccessExpression
    | SoqlExpression;

export type BinaryExpression = NodeBase<'BinaryExpression'> & {
    operator: BinaryOperator;
    left: Expression;
    right: Expression;
};

export type CallExpression = NodeBase<'CallExpression'> & {
    callee: Expression;
    arguments: Expression[];
};

export type IfStatement = NodeBase<'IfStatement'> & {
    condition: Expression;
    then: Statement;
    else?: Statement;
};
```

`Arth1Expression` / `Arth2Expression` のような文法由来の名前は外部 IR には出さず、演算の意味に従って `BinaryExpression` / `UnaryExpression` 等へ正規化する。演算子は `operator` に保持する。親子の `Expression` にすべての `kind` を残すので、consumer は `switch (expr.kind)` で処理できる。

複合代入、前置/後置インクリメント、`instanceof`、型キャストなど、解析上区別が必要な構文は別 kind にするか、専用フィールドで区別する。安易にすべての演算を同じ `BinaryExpression` に畳まず、後段処理が必要とする意味を基準に選ぶ。

## Modifier、Parameter、Initializer

```ts
export type Modifier = NodeBase<'Modifier'> & {
    name:
        | 'public'
        | 'private'
        | 'protected'
        | 'global'
        | 'static'
        | 'final'
        | 'virtual'
        | 'abstract'
        | 'override'
        | 'transient'
        | 'webservice'
        | 'with sharing'
        | 'without sharing'
        | 'inherited sharing'
        | 'testmethod';
};

export type Parameter = NodeBase<'Parameter'> & {
    name: Identifier;
    type: TypeRef;
    modifiers: ParameterModifier[];
};

export type VariableDeclarator = NodeBase<'VariableDeclarator'> & {
    name: Identifier;
    initializer?: Expression;
};
```

Annotation は modifier へ無理に混ぜず `Annotation` として宣言の `annotations: Annotation[]` に置く案を推奨する。修飾子とアノテーションは文法上の並び・意味・複数性が異なるため、表現を分けた方が読みやすい。

## SOQL / SOSL

クエリは Apex expression の中に出るため、`SoqlExpression` から専用の `Query` union へつなぐ。クエリの句を汎用 `ClauseType` union に一括して平坦化せず、Query のフィールドとして置く。

```ts
export type SoqlExpression = NodeBase<'SoqlExpression'> & {
    query: SoqlQuery;
};

export type SoqlQuery = NodeBase<'SoqlQuery'> & {
    select: SelectItem[];
    from: FromSource[];
    where?: QueryExpression;
    groupBy: QueryExpression[];
    having?: QueryExpression;
    orderBy: OrderByItem[];
    limit?: Expression;
    offset?: Expression;
    forClauses: ForClause[];
};
```

SOQL と SOSL は共通化しすぎず、各々の固有構文を専用型にする。`where` や field filter が Apex の通常式と違う演算子・フィールド解決ルールを持つ場合、`QueryExpression` を独立させる。サブクエリも `Query` ノードとして再帰的に保持する。

## Source fidelity と解析結果の分離

AST/IR は正規化をしてよいが、必要なソース情報を消さない。

- source map: `span` と元ファイル識別子を保持。
- diagnostics: parse error、unsupported syntax、warning をノードに埋めず `CompilationUnit.diagnostics` に収集。
- unsupported node: 解析を止めず `UnsupportedSyntax` を作り、`span` と必要な raw text を保持する。正常ノードを `unknown` に広げない。
- semantic result: 解決済み型、参照先 symbol、依存 edges は `SemanticModel` 側で node ID をキーに管理する。
- raw text: 全ノードへ複製せず、unsupported 構文やソース再生成で必要な箇所に限定する。

```ts
export type Diagnostic = {
    severity: 'error' | 'warning' | 'info';
    code: string;
    message: string;
    span: SourceSpan;
};

export type UnsupportedSyntax = NodeBase<'UnsupportedSyntax'> & {
    rule: string;
    rawText: string;
};
```

## 現行 IR からの主な変更点

| 現行の表現                                                     | 推奨表現                                    | 理由                                        |
| -------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------- |
| `type` を子ノードから `Omit` する                              | `kind` を全ノードに保持                     | union 判別・visitor 不要な pattern matching |
| 文法規則由来の名前を node kind にする                          | Apex 概念名へ正規化                         | parser 実装から consumer を独立させる       |
| `memberDeclaration: { declaration: ... }` のような単一ラッパー | `ClassMember` union を直接配列に格納        | JSON の階層と実際の概念を一致させる         |
| 任意個の配列を `?` にする                                      | 0 件は `[]`、単独で省略可能な値のみ `?`     | consumer の null/undefined 分岐を減らす     |
| `implements` や parameters を opaque な汎用 List にする        | `TypeRef[]` / `Parameter[]`                 | 要素の意味を型で明示する                    |
| 演算式を文法レベル別の多数の node にする                       | semantic kind + `operator/left/right`       | 実装詳細を隠し、横断処理を簡潔にする        |
| annotation を modifier union の一要素にする                    | annotation と modifier を別フィールドにする | 構文・意味・複数性を明確化する              |
| parse context の異常を例外で処理全体へ伝播                     | diagnostic + `UnsupportedSyntax`            | 部分解析結果を活用できる                    |

## 推奨する型ファイル構成

ファイル構成は型モデルの責務に沿わせる。Visitor の配置とは独立にし、公開型は `ir/index.ts` から export する。

```text
src/analyzer/ir/apex/
  index.ts
  common.ts          # NodeBase, SourceSpan, Identifier, Diagnostic
  compilationUnit.ts
  declaration.ts     # ClassDeclaration, MethodDeclaration, FieldDeclaration...
  typeRef.ts
  statement.ts
  expression.ts
  query.ts           # SOQL/SOSL
  modifier.ts
  semanticModel.ts   # parse IR とは別レイヤー
```

規模が大きくなったら `declaration/`, `statement/`, `expression/`, `query/` に分割する。現行 Visitor はパーサー内部の変換器として残し、公開データ型を `ir` と分離する。consumer は Visitor や ANTLR package を import しない。

## 導入順

1. **公開 IR の枠を作る**: `NodeBase`, `SourceSpan`, `CompilationUnit`, `Declaration` を定義する。
2. **境界を一つ選んで変換**: まず Class/Method/TypeRef を新 IR へ変換し、JSON fixture で出力を確認する。
3. **再帰型を移す**: Statement と Expression を移行し、kind の網羅性を `switch` で型チェックする。
4. **Query を独立させる**: インライン SOQL/SOSL、サブクエリ、各句の fixture を追加する。
5. **consumer を段階移行**: 既存型から新 IR へ一時 adapter を置き、利用箇所ごとに切り替える。
6. **互換層を削除**: 全 consumer が新 IR を使い、JSON 契約が固まってから旧型と adapter を削除する。

各段階で、少なくとも正常な小規模 Apex サンプル、ネストした型・式・クエリ、unsupported syntax の診断を fixture として比較する。`ApexParserBaseVisitor` の union 型や実装都合は IR 契約に含めない。

## 結論

推奨するのは、**全ノードが `kind` と source span を持つ、概念中心の再帰 tagged union** である。Declaration / Statement / Expression / TypeRef / Query を明確に分け、空配列・optional・構文情報・意味解析結果の扱いを統一する。こうすると JSON を読んだ人には Apex 構造が直接伝わり、TypeScript consumer には exhaustiveness checking が効き、ANTLR 文法変更の影響も IR 境界で止めやすくなる。
