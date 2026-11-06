# Apex JSON の解析と、kind ごとの Diff 型の方針

[src/analyzer/types/apex/](../src/analyzer/types/apex/) の JsonType / StructureJsonType（[apex-implementation.md](./apex-implementation.md) の全種類）について、次の 2 つをまとめる。

1. **解析**（2〜5 章）: Diff とは別に、1 つの時点の JSON から情報を取り出すコード。kind ごとに何を取り出すか。
2. **kind ごとの Diff 型**（6 章）: 今は文・式・SOQL / SOSL の差分が汎用の `GumTreeDiff` になっている。これを kind ごとの型にする。

Diff の方針は [apex-implementation.md](./apex-implementation.md)、[apex-implementation.md](./apex-implementation.md)、[apex-implementation.md](./apex-implementation.md) を参照。

## 1. 置き場所と全体の構成

```text
src/analyzer/processor/Apex/
├── analysis/          解析（新規）
│   ├── walker.ts      JSON を kind ごとに訪問する共通の走査
│   ├── context.ts     走査中の文脈（今いるクラス・メソッド・ループの中か など）
│   ├── declaration/   宣言の解析（class.ts、method.ts …）
│   ├── statement.ts   文の解析
│   ├── expression.ts  式の解析（呼び出し・参照）
│   ├── query.ts       SOQL / SOSL の解析
│   ├── project.ts     ファイルをまたぐ解析（呼び出しグラフ・依存関係）
│   └── impact.ts      Diff と解析の組み合わせ（影響範囲）
└── diff/
    └── types/         kind ごとの Diff 型（新規。6 章）
```

- 解析は Diff に依存しない（1 つの時点の JSON だけを入力にする）。Diff と組み合わせる処理は `impact.ts` に分ける（5 章）。
- 解析結果には、元のノードの `sourceKeys` を必ず持たせる。位置は `findSourceInfo` で後から引く（Diff と同じ）。

## 2. 解析の共通部品

### 2.1 走査（walker）

kind ごとの処理を登録して JSON を 1 回だけたどる。

```ts
type Visitor<C> = {
    [K in ApexKind]?: (node: JsonByKind<K>, context: C) => void;
} & {
    /** kind を持たない式（formula / cast など）。ラベルは getExpressionLabel で決める */
    expression?: (node: unknown, label: string, context: C) => void;
};

walkApexJson(unit, visitor, initialContext);
```

- kind を持たない式の種類分けは、GumTree の [tree.ts](../src/analyzer/processor/Apex/diff/gumtree/tree.ts) の `getExpressionLabel` を共通部品に移して使う（Diff と解析で同じ判定にする）。
- 1 回の走査で複数の解析を同時に行えるよう、Visitor は合成できるようにする（`composeVisitors`）。

### 2.2 文脈（context）

| 項目           | 内容                                                       | 使う解析                      |
| -------------- | ---------------------------------------------------------- | ----------------------------- |
| `typePath`     | 今いる型の入れ子（`Outer.Inner`）                          | シンボル名の解決              |
| `member`       | 今いるメソッド・コンストラクタ・プロパティ・初期化ブロック | 呼び出しグラフ、メトリクス    |
| `loopDepth`    | for / while / do の入れ子の深さ                            | ループ内の SOQL / DML の検出  |
| `nestingDepth` | if / for / while / try / switch の入れ子の深さ             | ネストの深さ                  |
| `scope`        | ローカル変数・パラメータ・フィールドの名前と型             | DML の対象の SObject 型の推定 |
| `isTest`       | `@IsTest` のクラス・メソッドの中か                         | テストの解析                  |

### 2.3 結果の形

```ts
type Located = { sourceKeys: ConvertKeys; filePath: string; member?: string };

type FileAnalysis = {
    filePath: string;
    symbols: SymbolInfo[]; // 宣言（3 章）
    references: Reference[]; // 型・メソッド・SObject・項目の参照（4 章）
    metrics: MemberMetrics[]; // メソッドごとの数値
    findings: Finding[]; // 注意点（ルール違反の候補）
};

type Finding = Located & { rule: string; severity: 'info' | 'warning' | 'error'; message: string };
```

- `findings` のルールは ID（`soql-in-loop` など）で管理し、有効・無効を設定で切り替えられるようにする。

## 3. kind ごとの解析 — 宣言・ユニット

| kind / 型         | 取り出す情報（symbols / metrics）                                                                                                                            | findings の候補                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `class`           | 名前・入れ子のパス、`extends` / `implements`、共有設定（with / without / inherited sharing）、abstract / virtual、アノテーション、メンバー数、テストクラスか | 共有設定がない、`without sharing` の公開クラス、メンバー数が多すぎる                    |
| `interface`       | 名前、`extends`、メソッドのシグネチャ一覧                                                                                                                    | -                                                                                       |
| `interfaceMethod` | シグネチャ（名前・戻り値・パラメータ型）                                                                                                                     | -                                                                                       |
| `enum`            | 名前、定数の一覧                                                                                                                                             | -                                                                                       |
| `enumConstant`    | 名前、並び順（ordinal）                                                                                                                                      | -                                                                                       |
| `method`          | シグネチャ、可視性、static、アノテーション（`@AuraEnabled` / `@Future` / `@InvocableMethod` / `@TestVisible` / `@IsTest`）、本体の有無、メトリクス（下表）   | 長すぎる・複雑すぎる、公開 API（global / `@AuraEnabled`）の変更、テストに assert がない |
| `constructor`     | シグネチャ、`this(...)` / `super(...)` の呼び出し先、メトリクス                                                                                              | -                                                                                       |
| `property`        | 型、get / set の有無と可視性、自動実装か                                                                                                                     | setter だけのプロパティ                                                                 |
| `field`           | 変数名・型、static / final（定数か）、初期値の有無                                                                                                           | 公開された非 final の static 変数                                                       |
| `initializer`     | static か、文の数                                                                                                                                            | static 初期化ブロックの中の SOQL / DML                                                  |
| `notSet`          | 数（空の宣言 `;`）                                                                                                                                           | 空の宣言                                                                                |
| `triggerCase`     | イベント（before insert など）の一覧。トリガーの対象 SObject と組にする                                                                                      | 同じ SObject に複数のトリガー、トリガー本体に処理が直接書かれている（ハンドラーがない） |
| `error`           | 解析できなかった位置と `kindType`                                                                                                                            | 構文エラーで解析できなかった範囲（解析結果の欠けとして明示する）                        |

メソッド・コンストラクタ・アクセサ・初期化ブロックのメトリクス:

| メトリクス           | 数え方                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| 文の数               | 本体の文（入れ子を含む）                                                                                      |
| 循環的複雑度         | 1 + if の分岐 + for / while / do + catch + switch の when（else を除く）+ 条件式の `&&` / `\|\|` + 三項演算子 |
| 最大のネストの深さ   | 2.2 の `nestingDepth` の最大値                                                                                |
| SOQL / SOSL / DML 数 | 4 章の各 kind の数。ループの中のものは別に数える                                                              |
| 呼び出し数           | `memberAccess`（`type: 'method'`）の数と、呼び出し先の一覧                                                    |

## 4. kind ごとの解析 — 修飾子・型・文・式・SOQL / SOSL

### 4.1 修飾子・パラメータ・型

| kind / 型    | 取り出す情報                                                                                              | findings の候補        |
| ------------ | --------------------------------------------------------------------------------------------------------- | ---------------------- |
| `modifier`   | アクセス修飾子・宣言修飾子の集計、公開範囲（global / webservice）                                         | -                      |
| `annotation` | アノテーションの一覧と引数（`@RestResource(urlMapping)`、`@Future(callout)` など）。公開 API の一覧に使う | 非推奨のアノテーション |
| `parameter`  | 名前・型・数                                                                                              | パラメータが多すぎる   |
| `type`       | 参照する型（カスタム型・SObject 型・コレクションの要素型）。クラスの依存関係（`references`）にする        | -                      |

### 4.2 文

| kind                                                             | 取り出す情報                                                                                                      | findings の候補                                                |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `if` / `ifCondition`                                             | 分岐の数（複雑度）、条件式の `&&` / `\|\|` の数                                                                   | 深すぎるネスト、条件が常に真・偽（リテラルだけの条件）         |
| `switch` / `switchVariant` / `switchCondition`                   | when の値の一覧。対象が enum なら網羅しているか                                                                   | `when else` がなく enum を網羅していない                       |
| `for` / `forCondition`                                           | ループの範囲（2.2 の `loopDepth`）、拡張 for の対象（SOQL for ループか）                                          | -                                                              |
| `while` / `whileCondition` / `doWhile` / `doWhileCondition`      | ループの範囲                                                                                                      | 条件がリテラルの `true`（終了条件が本体にしかない）            |
| `try` / `catchCondition`                                         | catch する例外型の一覧、finally の有無                                                                            | 空の catch、`Exception` をそのまま catch して握りつぶす        |
| `insert` / `update` / `upsert` / `delete` / `undelete` / `merge` | DML の種類、対象の SObject 型（2.2 の `scope` から推定）、`accessLevel`（USER / SYSTEM）、`upsert` の外部 ID 項目 | ループの中の DML、`accessLevel` のない DML（実行モードの確認） |
| `runAs` / `runAsCondition`                                       | テストの実行ユーザーの切り替え                                                                                    | テスト以外での `runAs`                                         |
| `localVariable`                                                  | 変数名と型（`scope` に登録）                                                                                      | 使われていない変数                                             |
| `return` / `throw`                                               | throw する例外型                                                                                                  | -                                                              |
| `expression`                                                     | 式の解析（4.3）に渡す                                                                                             | `System.debug` の数                                            |
| `break` / `continue`                                             | 数                                                                                                                | -                                                              |

### 4.3 式

| kind / 形                             | 取り出す情報                                                                                                     | findings の候補                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `memberAccess`（`DotMethodCallJson`） | メソッド呼び出し（`Class.method`、`obj.method`）→ 呼び出しグラフ。項目参照（`acc.Name`）→ SObject 項目の読み書き | `Database.query` などの動的 SOQL、ループの中の呼び出し |
| `memberAccess`（`MethodCallJson`）    | 同じクラスのメソッド呼び出し、`this(...)` / `super(...)`                                                         | -                                                      |
| kind のない式: `new`                  | 生成する型（依存関係）、SObject の生成（`new Account(Name = ...)` の項目）                                       | -                                                      |
| kind のない式: `cast` / `instanceof`  | 参照する型                                                                                                       | -                                                      |
| kind のない式: `literal`              | 文字列リテラル                                                                                                   | ハードコードされた ID（15 / 18 桁）・URL・ユーザー名   |
| kind のない式: `formula`              | 代入（左辺がフィールドなら書き込み）                                                                             | -                                                      |

### 4.4 SOQL / SOSL

| kind                                                       | 取り出す情報                                                                           | findings の候補                                           |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `soql` / `subQuery`                                        | 対象の SObject、読む項目、条件の項目、バインド変数、ループの中か、`LIMIT` の有無       | ループの中の SOQL、`LIMIT` も `WHERE` もないクエリ        |
| `selectEntry`                                              | 項目（リレーションのパス `Account.Owner.Name` を含む）、集計関数、`TYPEOF`、エイリアス | -                                                         |
| `fromField`                                                | SObject 名とエイリアス、リレーションのクエリ                                           | -                                                         |
| `singleCondition`                                          | 条件の項目・演算子・値（バインド変数か）                                               | 先頭が `%` の `LIKE`、`!=` / `NOT IN`（選択性が低い条件） |
| `groupBy` / `orderField`                                   | 集計・並べ替えの項目、`ROLLUP` / `CUBE`、`NULLS`                                       | -                                                         |
| `limitClause` / `offsetClause`                             | 値（リテラルかバインドか）                                                             | `OFFSET` が 2000 を超えるリテラル                         |
| `forClause` / `updateClause`                               | `FOR UPDATE`（ロック）/ `FOR VIEW` / `UPDATE TRACKING` など                            | ループの中の `FOR UPDATE`                                 |
| `allRowsClause` / `usingScopeClause` / `categoryCondition` | オプションの一覧                                                                       | -                                                         |
| `sosl` / `soslField`                                       | 検索語（リテラルかバインドか）、`RETURNING` の SObject と項目                          | ループの中の SOSL                                         |

## 5. ファイルをまたぐ解析と、Diff との組み合わせ

### 5.1 プロジェクト全体（`project.ts`）

| 解析                 | 作り方                                                                                  | 用途                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| シンボル表           | 全ファイルの `symbols` を、名前（`Outer.Inner.method(型)`）で引けるようにする           | 参照の解決                                                                                                                                 |
| 呼び出しグラフ       | `memberAccess` の呼び出し先をシンボル表で解決する（解決できないものは未解決として残す） | 影響範囲、使われていないメソッド                                                                                                           |
| クラスの依存関係     | `extends` / `implements` / 型の参照 / `new`                                             | 依存関係の図（[processor/Metadata/analysis.ts](../src/analyzer/processor/Metadata/analysis.ts) の getObjectDependencies と同じ形で可視化） |
| SObject の利用表     | SObject × 項目 × 読み（SOQL・参照）/ 書き（代入・DML）/ 条件                            | メタデータ（オブジェクト・項目）の解析との接続                                                                                             |
| トリガーとハンドラー | トリガー本体から呼ばれるクラス                                                          | トリガーの処理の流れ                                                                                                                       |
| テストの対応         | テストクラスから呼ばれるクラス・メソッド                                                | テストのない変更の検出                                                                                                                     |

### 5.2 Diff との組み合わせ（`impact.ts`）

before / after をそれぞれ解析し、Diff の結果と組み合わせる。

| 組み合わせ                     | 内容                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| メトリクスの増減               | 変わったメソッドの複雑度・文の数・SOQL / DML 数の before → after                               |
| 公開 API の変更                | global / `@AuraEnabled` / `@RestResource` などのメソッドの追加・削除・シグネチャ変更           |
| SOQL の項目・条件の変更        | 変わった `soql` の、読む項目・条件の項目の増減                                                 |
| 影響範囲                       | 変わったメソッドを呼び出しグラフで逆にたどり、影響を受けるメソッド・トリガー・テストを列挙する |
| メタデータの変更との突き合わせ | メタデータの Diff で削除・変更された項目を、SObject の利用表で使っている Apex を列挙する       |
| 新しく出た findings            | after にだけある findings（変更で入り込んだ問題の候補）                                        |

## 6. kind ごとの Diff 型

### 6.1 今の状態

| 対象                                                                                                                      | Diff の型                                                                         | kind ごとの型か |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------- |
| 宣言（class / interface / interfaceMethod / enum / enumConstant / method / constructor / property / field / initializer） | `ClassDiff` / `InterfaceDiff` / … / `InitializerDiff`（`NodeDiff<K, T, Fields>`） | はい            |
| `modifier` / `annotation`                                                                                                 | `ModifierDiff`（annotation の引数の変化を含む）                                   | 2 つで 1 つ     |
| `parameter` / `type`                                                                                                      | `ParameterDiff` / `TypeDiff`                                                      | はい            |
| `triggerCase`                                                                                                             | `NodeDiff<'triggerCase', TriggerCaseJson, undefined>`（fields なし）              | 形だけ          |
| `notSet` / `error`                                                                                                        | クラス本文の中の `added` / `removed` / `unchanged` だけ                           | いいえ          |
| 文・文の補助ノード・式・SOQL / SOSL                                                                                       | `GumTreeDiff`（`label` / `role` の文字列と、`fields: Record<string, …>`）         | **いいえ**      |

`GumTreeDiff` は型からは「どの kind の、どのプロパティが変わったか」が分からない（`fields` は `Record<string, …>`、子は `children` の配列）。利用側が `label` の文字列で分岐する必要がある。

### 6.2 方針

- **全 kind に名前付きの Diff 型を作る**（`IfStatementDiff`、`SoqlDiff`、`SingleConditionDiff` など）。宣言と同じく、`kind` と、プロパティごとの差分を持つ `fields` を持つ形にする。
- **型は JSON の型から機械的に作る**。プロパティの型に応じて差分の型を決める型関数 `DiffOf<T>` を用意し、kind ごとの型はその別名にする。JSON の型を変えれば Diff の型も追従する。
- **対応付けは GumTree のまま**にし、GumTree の結果（`GumTreeDiff`）を kind ごとの型に変換する関数を作る。`GumTreeDiff` の `role` は親のプロパティ名なので、`children` を `fields` のプロパティに振り分けられる。

### 6.3 型関数

```ts
/** JSON の値の型から、その差分の型を決める */
type DiffOf<T> =
    // ノード（JsonType / StructureJsonType）: kind ごとの NodeDiff
    T extends JsonNode
        ? KindDiff<T>
        : // 配列: 要素の差分の列（分類は 6.4 の表で kind ごとに決める）
          T extends (infer E)[]
          ? ListItemDiff<E>[]
          : // kind のない入れ物・式（if の branch、formula など）: プロパティごとの差分
            T extends object
            ? { status: 'unchanged'; value: T } | { status: 'changed'; fields: FieldsOf<T> }
            : // プリミティブ
              ValueDiff<T>;

/** プロパティごとの差分。任意項目は OptionalDiff */
type FieldsOf<T> = {
    [P in keyof Body<T>]-?: undefined extends T[P]
        ? OptionalDiff<NonNullable<T[P]>, DiffOf<NonNullable<T[P]>>>
        : DiffOf<T[P]>;
};

type KindDiff<T extends JsonNode> = NodeDiff<T['kind'], T, FieldsOf<T>> & {
    /** 別の親から移動してきたもの（GumTree）。移動元を持つ */
    moved?: MovedFrom;
};
```

- `T | ErrorJson` のプロパティは、`NodeDiff` の「値を丸ごと before / after に持つ」形（apex-implementation.md 3.2）で表す。
- 親をまたいで移動したノード（GumTree の `moved`）は、移動先の `fields` の中に `status: 'moved'` と `from` を持たせて出す。移動元には出さない（apex-implementation.md 5.3 と同じ）。
- 再帰する型（`StatementJson` の中の `StatementJson`）は、TypeScript の型の深さの上限に当たらないよう、文の型は `interface` で切る（[declaration.ts](../src/analyzer/processor/Apex/diff/declaration.ts) の `ClassFields` と同じやり方）。

### 6.4 kind ごとの Diff 型の一覧

型名は JSON の型名の `Json` を `Diff` に置き換えたものにする。配列のプロパティの分類（B / C / D）は apex-implementation.mdに従う。

| kind                                                     | JSON の型                                                       | Diff の型（案）                                                     | 配列のプロパティと分類                                                | 状態                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------- |
| `class`                                                  | `ClassDeclarationJson`                                          | `ClassDiff`                                                         | `implement`: B、`block`: D                                            | 済                                                            |
| `interface`                                              | `InterfaceDeclarationJson`                                      | `InterfaceDiff`                                                     | `extend`: B、`block`: D                                               | 済                                                            |
| `interfaceMethod`                                        | `InterfaceMethodJson`                                           | `InterfaceMethodDiff`                                               | `param`: C                                                            | 済                                                            |
| `enum` / `enumConstant`                                  | `EnumDeclarationJson` / `EnumConstantJson`                      | `EnumDiff` / `EnumConstantDiff`                                     | `members`: C                                                          | 済                                                            |
| `method` / `constructor`                                 | `MethodDeclarationJson` / `ConstructorDeclarationJson`          | `MethodDiff` / `ConstructorDiff`                                    | `param`: C、`block`: 文の Diff                                        | 済（`block` は `GumTreeDiff[]` → `StatementDiff[]` に変える） |
| `property`                                               | `PropertyDeclarationJson`                                       | `PropertyDiff`                                                      | `error`: B                                                            | 済（同上）                                                    |
| `field`                                                  | `FieldDeclarationJson`                                          | `FieldDiff`                                                         | `variants`: D                                                         | 済（`init` は `GumTreeDiff[]` → `ExpressionDiff` に変える）   |
| `notSet`                                                 | `NotSetBlockJson`                                               | `NotSetDiff`                                                        | -                                                                     | 未                                                            |
| `triggerCase`                                            | `TriggerCaseJson`                                               | `TriggerCaseDiff`                                                   | -（`actionType` / `timing` を `fields` に持たせる）                   | 未                                                            |
| `modifier` / `annotation`                                | `ModifierJson` / `AnnotationJson`                               | `ModifierDiff` / `AnnotationDiff` に分ける                          | annotation の `arg`: D（キー: `key`）                                 | 一部                                                          |
| `parameter` / `type`                                     | `ParameterJson` / `TypeJson`                                    | `ParameterDiff` / `TypeDiff`                                        | 型の `generic`: C                                                     | 済                                                            |
| `if`                                                     | `IfStatementJson`                                               | `IfStatementDiff`                                                   | `conditionBlock`: C                                                   | 未                                                            |
| `ifCondition` / `whileCondition` / `doWhileCondition`    | `IfConditionJson` など                                          | `IfConditionDiff` など                                              | -                                                                     | 未                                                            |
| `for` / `forCondition`                                   | `ForStatementJson` / `ForConditionJson`                         | `ForStatementDiff` / `ForConditionDiff`                             | 通常 for の `update`: C。拡張 for と通常 for の違いは丸ごと `changed` | 未                                                            |
| `while` / `doWhile`                                      | `WhileStatementJson` / `DoWhileStatementJson`                   | `WhileStatementDiff` / `DoWhileStatementDiff`                       | `body`: 文の Diff                                                     | 未                                                            |
| `switch` / `switchVariant` / `switchCondition`           | `SwitchStatementJson` / `WhenVariantJson` / `WhenConditionJson` | `SwitchStatementDiff` / `WhenVariantDiff` / `WhenConditionDiff`     | `block`: C、when のリテラル: B                                        | 未                                                            |
| `try` / `catchCondition`                                 | `TryStatementJson` / `CatchConditionJson`                       | `TryStatementDiff` / `CatchConditionDiff`                           | `block`（try / catch / finally の節）: C、catch の `modifier`: B      | 未                                                            |
| `runAs` / `runAsCondition`                               | `RunAsStatementJson` / `RunAsConditionJson`                     | `RunAsStatementDiff` / `RunAsConditionDiff`                         | `field`: C                                                            | 未                                                            |
| `insert` / `update` / `upsert` / `delete` / `undelete`   | `InsertStatementJson` など                                      | `InsertStatementDiff` など                                          | `upsert.key`: 値                                                      | 未                                                            |
| `merge`                                                  | `MergeStatementJson`                                            | `MergeStatementDiff`                                                | `field`: 位置のスロット（[0] マスター / [1] 重複）                    | 未                                                            |
| `localVariable`                                          | `LocalVariableStatementJson`                                    | `LocalVariableStatementDiff`                                        | `variants`: D（キー: 変数名）                                         | 未                                                            |
| `return` / `throw` / `expression` / `break` / `continue` | `ReturnStatementJson` など                                      | `ReturnStatementDiff` など                                          | -                                                                     | 未                                                            |
| `memberAccess`                                           | `DotMethodCallJson` / `MethodCallJson`                          | `DotMethodCallDiff` / `MethodCallDiff`（`type` で分ける）           | `memberArg`: C                                                        | 未                                                            |
| kind のない式                                            | `FormulaJson` / `CastJson` / … / `NewInstanceJson`              | `ExpressionDiff`（`getExpressionLabel` のラベルで判別できる union） | `new` の初期化子: C（set は B）                                       | 未                                                            |
| `soql` / `subQuery`                                      | `SoqlJson` / `SubQueryJson`                                     | `SoqlDiff` / `SubQueryDiff`                                         | 各句: A（句の有無は OptionalDiff）                                    | 未                                                            |
| `selectEntry`                                            | `SelectEntryJson`                                               | `SelectEntryDiff`                                                   | SELECT の並び: B                                                      | 未                                                            |
| `fromField`                                              | `FromFieldJson`                                                 | `FromFieldDiff`                                                     | FROM の並び: C                                                        | 未                                                            |
| `singleCondition`                                        | `SingleConditionJson` / `WhereSingleConditionJson`              | `SingleConditionDiff`                                               | AND / OR の項: B                                                      | 未                                                            |
| `groupBy` / `orderField`                                 | `GroupByJson` / `FieldOrderJson`                                | `GroupByDiff` / `FieldOrderDiff`                                    | `groupBy.field`: C、ORDER BY の並び: C                                | 未                                                            |
| `limitClause` / `offsetClause`                           | `LimitJson` / `OffsetJson`                                      | `LimitDiff` / `OffsetDiff`                                          | `type`（literal / bind）が違えば丸ごと `changed`                      | 未                                                            |
| `forClause` / `updateClause`                             | `ForJson` / `UpdateListJson`                                    | `ForClauseDiff` / `UpdateClauseDiff`                                | `value`: B                                                            | 未                                                            |
| `allRowsClause` / `usingScopeClause`                     | `AllRowsJson` / `UsingScopeJson`                                | `AllRowsDiff` / `UsingScopeDiff`                                    | -                                                                     | 未                                                            |
| `categoryCondition`                                      | `DataCategorySelectionJson`                                     | `DataCategorySelectionDiff`                                         | `category`: B                                                         | 未                                                            |
| `sosl` / `soslField`                                     | `SoslJson` / `SoslFieldJson`                                    | `SoslDiff` / `SoslFieldDiff`                                        | `fieldSpec`: C、`with`: B                                             | 未                                                            |
| `error`                                                  | `ErrorJson`                                                     | `ErrorDiff`                                                         | -                                                                     | 未                                                            |

まとめの union:

```ts
/** 文の Diff。BlockDiff はこの配列にする */
type StatementDiff = IfStatementDiff | ForStatementDiff | … | ErrorDiff;
/** すべての kind の Diff。kind で絞り込める */
type ApexNodeDiff = ClassDiff | … | SoslFieldDiff | ErrorDiff;
```

### 6.5 実装の手順

1. `diff/types/` に `DiffOf` / `FieldsOf` / `KindDiff` を作り、6.4 の型を別名として定義する（置き場所は types/apex と同じ分け方: declaration.ts / statement.ts / expression.ts / query/*.ts）。
2. `GumTreeDiff` → kind ごとの型に変換する `toTypedDiff` を作る。`role` で `fields` に振り分け、配列のプロパティは 6.4 の分類どおりに並べる。
3. `BlockDiff` を `StatementDiff[]` に、field の `init` を `ExpressionDiff` に差し替える。宣言側の呼び出しは変えない。
4. `triggerCase` / `notSet` / `error` / `annotation` の Diff を、6.4 の型に揃える。
5. テスト: [docs/examples/apex/](./examples/apex/README.md) のサンプルの全 Diff を `typia.is<ApexNodeDiff>` で検査し、実行時の値が型どおりであることを確かめる（[test/processor/diff-samples.test.ts](../test/processor/diff-samples.test.ts) に追加）。

### 6.6 解析との関係

- 5.2 の「Diff との組み合わせ」は、6.4 の型を使って kind で分岐する（`diff.kind === 'soql'` で `SoqlDiff` に絞り込み、`fields.select` を見る）。
- 解析結果（`FileAnalysis`）の差分も、同じ `DiffOf` で型を作れる（メトリクスは `ValueDiff<number>`、findings は B）。

## 7. 未決事項

- 解析の対象範囲の優先順位。まずは「SObject の利用表」「呼び出しグラフ」「ループの中の SOQL / DML」から始めるか。
- 型の解決の精度。ローカル変数・フィールドの型までは JSON から分かるが、メソッドの戻り値の型をたどる（`getAccounts()[0].Name`）かどうか。
- 標準クラス（`System` / `Database` / `Schema` など）の一覧を持つか。持たないと、標準クラスの呼び出しが「未解決」として残る。
- findings のルールの持ち方（コードに書くか、設定ファイルにするか）と、既存の静的解析ツール（PMD など）との役割分担。
- `DiffOf` で作った型が深くなりすぎる場合（式の入れ子）に、どこで `GumTreeDiff` のままにするか。
- 解析結果の保存先と形式（[todo.md](./todo.md) の保存データの版に合わせる）。
