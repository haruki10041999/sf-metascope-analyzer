# LWC の JS / TS の parser の比較（SWC と Babel）

LWC の `.js` / `.ts` を parse するライブラリを、`@swc/core`（1.16.21）と `@babel/parser`（8.0.7）で比べた結果。観点の中心は **情報の欠けがないこと**。あわせて、JSON（`JsonType` / `StructureJsonType`）を Apex とそろえやすいか、LWC Compiler との相性、速度を見た。

- 比べたソース: [docs/examples/lwc/verify-erase-types.ts](./examples/lwc/verify-erase-types.ts) のコンポーネント（TS の型の構文をひととおり、日本語のコメント・絵文字・型の語を含む文字列を含む）と、観点ごとの小さなソース。
- 型を空白にする処理（[lwc-parse-plan.md](./lwc-parse-plan.md) 3.2）は、両方の parser で実装して同じ検証をした（`eraseTypesSwc` / `eraseTypesBabel`）。

## 1. 結論

> **決定: JS / TS の解析は `@babel/parser` にする**（`@swc/core` は削除した）。方針は [lwc-parse-plan.md](./lwc-parse-plan.md) に反映済み。この文書は決定の根拠として残す。なお、**コメントは今回は対象外**にした（2 章の「コメント」の差は、将来コメントを扱うときの判断材料として残す）。

**`@babel/parser` を推奨した**（JS と TS の両方。`plugins: ['typescript', ['decorators', { decoratorsBeforeExport: true }]]`、TS のときだけ `typescript` を付ける）。

| 理由                       | 内容                                                                                                                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 情報の欠けがない           | **コメント（JSDoc を含む）を保持し、ノードに付ける**（SWC の JS の API はコメントを返さない）。`?` / `!` / 修飾子の位置が**トークン**で取れる（SWC は span を持たない）                         |
| 位置が Apex と同じ形       | `loc` が `{ line（1 始まり）, column（0 始まり）, index（文字位置） }` で、Apex の `SourcePosition` と同じ。**変換が要らない**（SWC は 1 始まりの UTF-8 バイト位置で、変換表が要る）            |
| LWC Compiler と同じ parser | `@lwc/compiler` は内部で Babel（`@babel/core` 7.29、`decorators: { decoratorsBeforeExport: true }`）を使う。受け付ける構文が近い（`using` 宣言は LWC Compiler と Babel が OK、SWC は既定で NG） |
| 検出できるエラーが多い     | `errorRecovery: true` で、1 ファイルの複数のエラーを報告できる場合がある（同じ名前の `let`、クラスの外の `super` など。SWC はこれらをエラーにしない）                                           |
| 依存関係                   | すでに `dependencies` にある。`@swc/core` は不要になった（削除した）                                                                                                                            |

SWC を選ぶ理由になるのは速度だが、JS から呼ぶ場合は差がなかった（4 章）。

## 2. 情報の欠け

| 情報                                                                       | Babel                                                                                                        | SWC                                                                             | IR・JSON で使う場面                                                                          |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **コメント**                                                               | ○ `ast.comments` と、各ノードの `leadingComments` / `trailingComments`                                       | **×** `parseSync` の結果にコメントがない（`comments: true` を渡しても返らない） | JSDoc の型（`@type` / `@param` / `@returns`）、`@api` の説明、`// eslint-disable` などの指示 |
| **省略可能・確定代入の `?` / `!`**                                         | ○ フラグ（`optional` / `definite`）と、`tokens: true` のトークンの位置                                       | △ フラグだけ（位置は、隣のノードの間の文字列から探す）                          | 型を空白にする処理、`sourceKeys` の範囲                                                      |
| **修飾子**（`private` / `readonly` / `declare` / `abstract` / `override`） | ○ フラグとトークンの位置                                                                                     | △ フラグだけ（同上）                                                            | 同上                                                                                         |
| `this` パラメーター                                                        | ○ `params` の最初の `Identifier`（`name: 'this'`）として持つ                                                 | ○ `thisParam`（`TsThisParameter`）として別に持つ                                | 型を空白にする処理                                                                           |
| 括弧                                                                       | ○ `createParenthesizedExpressions: true` で `ParenthesizedExpression`（既定では `extra.parenthesized` だけ） | ○ `ParenthesisExpression`                                                       | 型を空白にする処理（`(x) as T`）、式の文字列                                                 |
| リテラルの元の書き方                                                       | ○ `extra.raw`（`0x1F`）、テンプレートの `raw`、正規表現の `pattern` / `flags`                                | ○ `raw`、`pattern` / `flags`                                                    | 式の文字列、objectKey                                                                        |
| 位置                                                                       | ○ 文字位置（`start` / `end`）と行・列（`loc`）                                                               | △ 1 始まりの UTF-8 バイト位置だけ（行・列は自分で計算する）                     | `sourceKeys`、`SourcePosition`、診断の位置                                                   |
| TS の型のノード                                                            | ○（`TSTypeAnnotation` など。Babel 8 では型引数は `typeArguments`）                                           | ○（`TsTypeAnnotation` など）                                                    | 型の情報（[lwc-parse-plan.md](./lwc-parse-plan.md) 3.1.4）                                   |
| トークンの一覧                                                             | ○ `tokens: true`                                                                                             | ×                                                                               | 型を空白にする処理（`implements` / `abstract` の語の位置など）                               |

**欠けるのは SWC のコメントだけで、これは後から補えない**（SWC の span からは、コメントの位置も中身も分からない。ソースを自前で走査すれば取り出せるが、文字列・テンプレート・正規表現の中を正しく読み飛ばす字句解析が必要になる）。

## 3. 型を空白にする処理の検証（両方で実装）

[verify-erase-types.ts](./examples/lwc/verify-erase-types.ts) を両方の parser で実行し、**全項目が成功した**。空白にした結果の JS は、SWC 版と Babel 版で**1 文字も違わない**。

| 確かめたこと                                                           | SWC                             | Babel          |
| ---------------------------------------------------------------------- | ------------------------------- | -------------- |
| 長さ・改行の位置が元と同じで、空白にした文字以外は変わらない           | OK                              | OK             |
| 文字列の中・絵文字を消していない                                       | OK                              | OK             |
| 空白にした JS が JavaScript として parse できる（SWC・Babel の両方で） | OK                              | OK             |
| 空白にした JS が `@lwc/compiler` を通る                                | OK                              | OK             |
| LWC の仕様違反（`LWC1093`）の位置が元の TS と一致する                  | OK                              | OK             |
| 空白にできない構文（`enum` など）を報告する                            | OK                              | OK             |
| 位置（メンバー名・行・列）                                             | OK（バイト → 文字の変換が要る） | OK（そのまま） |

実装の手間の違い:

|                    | SWC                                      | Babel                                                                                                                                    |
| ------------------ | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `?` / `!` / 修飾子 | 隣のノードの間の文字列を探す             | トークンの位置をそのまま使う                                                                                                             |
| 位置               | バイト → 文字の変換表                    | 不要                                                                                                                                     |
| 気をつけること     | `this` パラメーターは `thisParam` にある | 括弧をノードにする（`createParenthesizedExpressions: true`）。これを付けないと `<T>(x as U)` の `(` まで消してしまうことを検証で見つけた |

## 4. 速度

同じ TS のコンポーネント（約 2,200 文字）を 300 回 parse した平均。

|                         | 1 回あたり |
| ----------------------- | ---------- |
| Babel                   | 0.97 ms    |
| Babel（`tokens: true`） | 0.89 ms    |
| SWC                     | 0.93 ms    |

SWC は parse 自体は速いが、結果を Rust から JS のオブジェクトにする受け渡しで差がなくなる。LWC のファイルは大きくないので、どちらでも問題にならない。

## 5. 受け付ける構文（JS）と LWC Compiler との差

| 構文                                                                       | Babel | SWC                  | `@lwc/compiler`                               |
| -------------------------------------------------------------------------- | ----- | -------------------- | --------------------------------------------- |
| private の項目・メソッド（`#a`）                                           | OK    | OK                   | NG（`Class private methods are not enabled`） |
| static ブロック                                                            | OK    | OK                   | NG                                            |
| `accessor` キーワード                                                      | NG    | NG                   | NG                                            |
| import attributes（`with { type: 'json' }`）                               | OK    | OK                   | OK                                            |
| `using` 宣言                                                               | OK    | **NG**（既定の設定） | OK                                            |
| `export` の後のデコレーター                                                | OK    | OK                   | NG（`before the 'export' keyword`）           |
| 括弧付きのデコレーター（`@(api)`）                                         | OK    | OK                   | OK                                            |
| optional chaining / `??` / `**=` / 正規表現の `v` フラグ / top-level await | OK    | OK                   | OK                                            |

- parse（構文解析）は広めに受け付け、LWC で使えない構文は LWC Compiler の検証（resolvedError）で報告する、という分担はどちらの parser でも同じ。
- SWC だけが NG にする構文（`using`）があると、LWC では正しいファイルが「構文エラー」になり JSON を作れない。Babel ではこれが起きにくい。

## 6. エラーの報告

| ソース                       | Babel（`errorRecovery: true`） | SWC          |
| ---------------------------- | ------------------------------ | ------------ |
| 同じ名前の `let` を 2 回 × 2 | 回復して 2 件                  | エラーなし   |
| 代入できない左辺 × 2         | 回復して 2 件                  | 例外（2 件） |
| クラスの外の `super` × 2     | 回復して 2 件                  | エラーなし   |
| 式の欠け（`let a = ;`）× 2   | 例外（1 件）                   | 例外（1 件） |

- Babel は、回復できるエラーなら JSON も作れる（エラーのある AST が返る）。回復できない構文エラー（式の欠けなど）は、どちらも 1 件目で止まる。

## 7. JSON（`JsonType` / `StructureJsonType`）を Apex とそろえる

|                                                            | Babel                                                                                                              | SWC                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| `SourcePosition`（`offset` / `line` / `column`）           | `loc.start` / `loc.end` の `{ index, line, column }` をそのまま使える（Apex と同じく行は 1 始まり、列は 0 始まり） | バイト位置を変換し、行・列を計算する |
| `sourceKey`（ファイルと位置のハッシュ）                    | `start` / `end` から作る                                                                                           | 変換した位置から作る                 |
| `StructureJsonType` の `sourceKeys`（`{ base, name, … }`） | クラス・メソッド・プロパティは、ノード（`base`）と名前のノード（`key` / `id`）の位置から作れる                     | 同じ（変換後）                       |
| `ErrorJson`                                                | `errorRecovery` の `errors`（位置付き）から作れる                                                                  | 例外のメッセージから位置を取り出す   |

どちらでも Apex と同じ形の JSON は作れるが、Babel の方が変換がなく、位置の取り違えが起きにくい。

## 8. 方針（[lwc-parse-plan.md](./lwc-parse-plan.md)）で変えたこと

- 1 章の表と 3.1.1: `@babel/parser`（JS は `decorators`、TS は `typescript` と `decorators`。`tokens: true`、`createParenthesizedExpressions: true`、`errorRecovery: true`）。
- 2.2: SWC 用の `makeUtf8OffsetMap` / `fromSwcSpan` は不要。`fromBabelLocation` だけを足す。
- 3.1.2: `lwc_IR/fromSwc.ts` → `lwc_IR/fromBabel.ts`。JS と TS で 1 つの変換にする方針は同じ。
- 3.1.4: JSDoc の型も読める（JS の型の情報を足すかどうかは「決めること」のまま）。
- 3.2: 型を空白にする処理は `eraseTypesBabel`（トークンを使う版）を使う。
- 依存関係: `@swc/core` を削除した。検証スクリプト（[verify-erase-types.ts](./examples/lwc/verify-erase-types.ts)）も Babel 版だけにした（SWC 版と結果が同じだったことは 3 章に記録）。
