# Apex IR TypeClass リファレンス

[src/analyzer/types/apex_IR](../../src/analyzer/types/apex_IR) の各 TypeClass が保持する情報（変数・型・役割）を、Visitor フォルダ単位でまとめたもの。

## 共通事項

- IR は `new UnitVisitor().visit(ctx)` の結果を `JSON.stringify` したもの。JSON のキーは各クラスの private フィールド名と一致する。
- 全ノードは `type`（ノード種別の文字列）と `span`（ソース上の範囲）を持つ。JSON では `span` は `type` の直後に出力される。
- `span` は `CommonVisitor.visit()` が Visitor 経由で生成された全ノードに自動設定する。
- 各フォルダは `base.ts`（基底クラス）、`index.ts`（re-export と `XxxVisitor`）、TypeClass ごとのファイルで構成される。
- 子ノードのフィールドは、変換に失敗した場合 `ErrorTypeClass` になり得る（型表記の `| ErrorTypeClass`）。
- 文法上省略可能な要素は `null` になる（型表記の `| null`）。

## commonVisitor.ts

### `CommonTypeClass`

全 TypeClass の基底。

| 変数   | 型                   | 内容                                             |
| ------ | -------------------- | ------------------------------------------------ |
| `type` | `string`             | ノード種別                                       |
| `span` | `SourceSpan \| null` | ソース上の範囲（`CommonVisitor.visit()` が設定） |

ゲッター: `getType()`, `getSpan()`

セッター: `setSpan()`

### `SourceSpan` / `SourcePosition`

```ts
type SourceSpan = { start: SourcePosition; end: SourcePosition };
type SourcePosition = { offset: number; line: number; column: number };
```

- `line` は 1 始まり、`column` は 0 始まり。
- `end.offset` は排他的（範囲の最終文字の次の位置）。
- 空のルール（例: 次元 0 の `arraySubscripts`）は `start` と `end` が同じ位置になる。

### `ErrorTypeClass`（type: `'AnalyzerError'`）

変換に失敗したノードの代わりに置かれるエラーノード。解析全体を止めずに部分結果を残すために使う。

| 変数           | 型                | 内容                                                        |
| -------------- | ----------------- | ----------------------------------------------------------- |
| `type`         | `'AnalyzerError'` | 継承                                                        |
| `code`         | `ErrorCode`       | エラー種別                                                  |
| `contextType`  | `string`          | 失敗した Context のクラス名（null 子要素の場合は `'null'`） |
| `context`      | `string`          | 失敗した箇所のソーステキスト                                |
| `errorMessage` | `string`          | エラー内容                                                  |

ゲッター: `getCode()`, `getContextType()`, `getContext()`, `getParseErrorMessage()`

生成は `ErrorTypeClass.create(code, contextType, context, errorMessage)` で行う（コンストラクタは private）。

`ErrorCode = 'NULL_CHILD' | 'UNSUPPORTED_CONTEXT' | 'TYPE_MISMATCH' | 'EXCEPTION'`

| コード                | 発生条件                                                              |
| --------------------- | --------------------------------------------------------------------- |
| `NULL_CHILD`          | `visit(null)`（任意の子要素が無い）。`span` は `null`                 |
| `UNSUPPORTED_CONTEXT` | Visitor に対応する `visitXxx` が無い                                  |
| `TYPE_MISMATCH`       | `isValidClass` の型不一致（置き換え元の子ノードの `span` を引き継ぐ） |
| `EXCEPTION`           | `create()` 内で例外が発生した                                         |

### 関数・Visitor

| 名前                                          | 内容                                                                                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `isErrorType(target)`                         | `ErrorTypeClass` かどうかの型ガード                                                                                           |
| `isValidClass(target, guard, type)`           | `target` が `guard` を満たせばそのまま返す。満たさなければ `ErrorTypeClass`（`TYPE_MISMATCH`）に置き換える                    |
| `isValidClassList(ctxs, create, guard, type)` | Context 配列を変換し、各要素に `isValidClass` を適用する                                                                      |
| `getSourceSpan(ctx)`                          | Context の開始・終了トークンから `SourceSpan` を求める                                                                        |
| `CommonVisitor<T>`                            | 全 Visitor の基底。`visit()` は null・例外・未対応 Context をすべて `ErrorTypeClass` に変換し、結果ノードに `span` を設定する |

## フォルダ一覧

| フォルダ                                    | 扱う文法要素                                                               |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| [unitVisitor](unitVisitor.md)               | ファイル単位（クラス / トリガー / 匿名 Apex）とトリガーケース              |
| [declarationVisitor](declarationVisitor.md) | クラス・インターフェース・enum・メソッド・フィールド・プロパティなどの宣言 |
| [bodyVisitor](bodyVisitor.md)               | クラス本体・インターフェース本体                                           |
| [memberVisitor](memberVisitor.md)           | 匿名 Apex / トリガー本体のメンバー                                         |
| [blockVisitor](blockVisitor.md)             | ブロック、finally、プロパティの getter / setter                            |
| [modifierVisitor](modifierVisitor.md)       | 修飾子・アノテーション                                                     |
| [parameterVisitor](parameterVisitor.md)     | 仮引数、`FIELDS()` の引数                                                  |
| [variableVisitor](variableVisitor.md)       | 変数宣言子、配列初期化子                                                   |
| [typeVisitor](typeVisitor.md)               | 型参照、配列次元                                                           |
| [argumentsVisitor](argumentsVisitor.md)     | 実引数、型引数                                                             |
| [callVisitor](callVisitor.md)               | メソッド呼び出し                                                           |
| [controlVisitor](controlVisitor.md)         | for / switch の制御部                                                      |
| [statementVisitor](statementVisitor.md)     | 文（制御構文・DML・runAs など）                                            |
| [expressionVisitor](expressionVisitor.md)   | Apex 式、SOQL の条件式                                                     |
| [primaryVisitor](primaryVisitor.md)         | 一次式（this / super / リテラル / SOQL / SOSL など）                       |
| [restVisitor](restVisitor.md)               | `new` 式の生成部分                                                         |
| [literalVisitor](literalVisitor.md)         | リテラル（Apex / SOQL / SOSL / when）                                      |
| [idVisitor](idVisitor.md)                   | 識別子                                                                     |
| [pairVisitor](pairVisitor.md)               | `key => value`、`name = value` などの対                                    |
| [queryVisitor](queryVisitor.md)             | SOQL クエリ本体、サブクエリ、関数、比較演算子、日付式、SOSL の検索対象     |
| [clauseVisitor](clauseVisitor.md)           | SOQL / SOSL の各句、catch 句                                               |
| [entryVisitor](entryVisitor.md)             | SELECT 項目                                                                |
| [listVisitor](listVisitor.md)               | 各種リスト（式・型・SELECT・FROM など）                                    |
| [nameVisitor](nameVisitor.md)               | 修飾名・型名・フィールド名など                                             |
| [valueVisitor](valueVisitor.md)             | SOQL の値、アノテーションの値、when の値、位置情報                         |
