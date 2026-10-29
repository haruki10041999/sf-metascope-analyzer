# apex JSON 生成層 設計方針（案）

対象: [src/analyzer/types/apex](../src/analyzer/types/apex)（`converter/` を除く）

関連: [apex-json-layer-review.md](apex-json-layer-review.md)（レビュー）、[apex-commons-refactoring.md](apex-commons-refactoring.md)（commons の方針 A〜D）

このドキュメントは、JSON 生成層の「どのノードがキーを持つか」と「エラーをどこで除外するか」を決めるためのものです。

- 「方針」の節は、合意済み（または合意したい）内容です。
- 「未決事項」の節は、まだ決める必要がある内容です。

## 0. 決定事項（2026-10-29）

ここに書いた内容は、以降の節（3.4 / 3.5 の `delegate` 案、4 章の分類案、5 章の未決事項）より優先します。

| # | 決定 | 実装 |
| --- | --- | --- |
| 1 | **境界ノードは、[apex-json-boundary-inventory.md](apex-json-boundary-inventory.md) の一覧に、評価結果を受けて追加したもの（下記）を加えたもの**。それ以外はすべて非境界ノード。**追加（2026-10-29）**: 宣言（field / method / constructor / class / interface / interfaceMethod / enum / property）、enum の定数、trigger の条件、SOQL / サブクエリ / SOSL 全体、複合文（if / for / while / doWhile / switch / try / runAs）。**削除**: 内側の型（ジェネリクス・要素型）。経緯は [apex-json-output-evaluation.md](apex-json-output-evaluation.md) の 8〜9 章 | ― |
| 2 | **unit は境界ノードにしない**（unit ごとに JSON ファイルを保存するため） | [unit.ts](../src/analyzer/types/apex/unit.ts) |
| 3 | **境界ノードの検査範囲は、既定では部分木全体**。子の境界ノードでエラーが起きた場合も、親の境界ノードごと `ErrorJson` にする。**例外**: 本体を持つ宣言・複合文・SOQL / SOSL 全体はノード自身だけを検査し（`exclude: 'children'`）、catch 句は本体を検査対象外にする（`exclude: ['block']`）。本体ごとエラーにすると中身がすべて失われるため | [commons/convertValue.ts](../src/analyzer/types/apex/commons/convertValue.ts)（`options.exclude` / `options.record`） |
| 4 | **どの境界ノードの範囲にも入らないエラーノードは、その位置で `ErrorJson` にする**（キーはエラーノード自身のもの） | 下記 |

決定 4 の実装:

- 境界ノードの範囲外から呼ばれる非境界の関数（unit、宣言、複合文、`makeStatementJson`、式、primary、SOQL / SOSL の入れ物、`makeModifiersJson`）は、引数を `ConvertType<T>` / `ConvertWithError<T>` にした。子がエラーノード（`type === 'error'`）なら `makeErrorJson(子, kindType)` を置く。
  - `ConvertWithError<T>`（commons/excludeError.ts）: ノード自身はエラーではないが、子にエラーノードを含みうる型
  - `isErrorNode`（commons/excludeError.ts）: `type === 'error'` で判定する型ガード
  - `makeErrorJson`（commons/json.ts）: エラーノードのキーから `ErrorJson` を作る
- 境界ノードの中でしか呼ばれない関数（SOQL 関数、値、日付関数、typeof など）は `ConvertExcludeError<T>` のまま。
- `ErrorJson` を置けない位置（文字列の名前など）は、型を `string | ErrorJson` に広げた。
- 集約先がない位置のエラーは、近くの `error` 配列に集める。
  - クラス本体・メンバー宣言自体がエラー: `ClassDeclarationJson.error`
  - getter / setter がエラー: `PropertyDeclarationJson.error`
- ブロック自体がエラーノードの場合は、`[ErrorJson]` を返す（`makeBlockJson`）。

---

## 1. 前提

- converter が出力した `CommonType` ツリーは、`makeConvertType` で全ノードに `objectKey` / `sourceKey` を付けた `Convert<T>` になる。ソース位置は `SourceJson[]` に集約される。
- JSON 生成層は、その中から **意味のある単位のノードだけ** にキー（`sourceKeys`）を残す。全ノードに残すと、出力と `SourceJson[]` が大きくなりすぎるため。
- converter の段階で発生したエラーは、`type: 'error'` のノード（`ErrorType`）としてツリーの中に残っている。

## 2. 用語

| 用語 | 意味 |
| --- | --- |
| **境界ノード** | `sourceKeys` を持つ JSON ノード（`JsonType` / `StructureJson`）。`convertValue` を通り、中でエラーが起きたときは `ErrorJson` に置き換わる単位。 |
| **値ノード** | `sourceKeys` を持たない JSON ノード。境界ノードの中身として出力される。 |
| **担当範囲** | 境界ノードの下で、子の境界ノードの手前までの部分。その境界ノードがエラーを検査する範囲。 |
| **委譲プロパティ** | 境界ノードのプロパティのうち、子の変換関数に処理を任せるもの。担当範囲には含めない。 |

---

## 3. 方針

### 3.1 境界ノードの 4 つの役割を一致させる

境界ノードは、次の 4 つを同時に満たすノードと定義する。どれか 1 つでも当てはまるなら、残りもすべて満たすようにする。

1. `sourceKeys` を持つ（ソース上の位置へジャンプできる）
2. `convertValue` を通る
3. 担当範囲でエラーが起きたとき、自分が `ErrorJson` に置き換わる
4. `regenerateSourceObjects` で `SourceJson` を再生成する対象になる

`ErrorJson` は置き換える元のノードの `sourceKeys` を引き継ぐ。そのため「エラーの置き換え単位」と「キーを持つノード」は必ず一致する。

### 3.2 判別キーと sourceKeys を分ける

値ノードにも判別キーを持たせる。現在は `JsonType` が `kind` と `sourceKeys` をセットにしているため、キーを外すと判別キーも失われている。

```ts
// 判別キーだけ（値ノード）
export type KindJson<TKind extends string> = { kind: TKind };

// 判別キー + 位置（境界ノード）
export type JsonType<TKind extends string> = KindJson<TKind> & { sourceKeys: ConvertKeys };
```

- 判別は `kind` に一本化する。`type` は、同じ `kind` の中の細分類（例: `LimitJson` の `literal` / `bind`）に限って使う。
- 値ノードと境界ノードは `sourceKeys` の有無で見分ける（`_gatherSourceKeys` は今の `isJsonType` の判定のままで済む）。

これで `BaseExpressionJson` を `kind` で絞り込めるようになり、`a.b`（フィールド参照）と `a.b()`（引数なしの呼び出し）も区別できる。

### 3.3 `JsonType` と `StructureJson` の使い分け

| 型 | 使う場面 | `sourceKeys` |
| --- | --- | --- |
| `JsonType` | ノード全体の位置だけ分かればよい（単文、条件、句、修飾子など） | `{ objectKey, sourceKey }` |
| `StructureJson` | 構成要素の位置も必要だが、その構成要素自体は境界ノードにしない（catch 句の例外名・型、if / for のキーワード部分など） | `{ base, <プロパティ名>: ConvertKeys \| ConvertKeys[] }` |

- `StructureJson` の `sourceKeys` には、**自分自身の位置を `base` として必ず含める**。`ErrorJson` に置き換えるときにも、ジャンプ先としても必要なため。
- 構成要素のキーは **プロパティ名** をキーにする（現在は型名をキーにしているため、同じ型の子が 2 つあると上書きされる）。
- 集めるのは、指定したプロパティの直下にあるノードのキー。配列なら `ConvertKeys[]` にする。
- 構成要素がすでに境界ノードなら、子自身が `sourceKeys` を持っているので、親で集める必要はない。

### 3.4 エラーの検査は `convertValue` の中で行う（実装済み）

```
return（境界）── 式 ── 式 ── [error]                      → return が ErrorJson になる
groupBy（境界）── having ── singleCondition（境界）── [error]  → groupBy ごと ErrorJson になる（部分木全体を検査）
method（境界、ノード自身だけ検査）── 本体の文（境界）── [error]   → 文だけが ErrorJson になり、method は残る
```

- 入口（unit）で `convertExcludeError` をまとめて呼ぶ処理は **廃止した**。エラーが記録なしに消えるため。
- typia の浅い検査による近道（`isSpicifyConvertExcludeError`）は **削除した**（レビュー B1）。
- 検査範囲は **既定で部分木全体**（0 章の決定 3）。子の境界ノードのエラーでも、親の境界ノードごと `ErrorJson` になる。
- **例外**: 本体を持つノードは、本体ごとエラーにすると中身がすべて失われるため、検査範囲を `options.exclude` で狭める。
  - 宣言（method / constructor / class / interface / interfaceMethod / enum / property）、複合文、SOQL / サブクエリ / SOSL 全体: `exclude: 'children'`（ノード自身だけを検査）
  - catch 句: `exclude: ['block']`（catch 本体だけを対象外にする）
  - 対象外にしたプロパティのエラーは、子の変換関数がその位置で `ErrorJson` にする。

### 3.5 `convertValue` の API（実装済み）

実装: [commons/convertValue.ts](../src/analyzer/types/apex/commons/convertValue.ts)

```ts
export type ConvertValueOptions = {
    /** エラー検査の対象外にするプロパティ。'children' はノード自身だけを検査する */
    exclude?: readonly string[] | 'children';
    /** StructureJson の sourceKeys に集める子ノード。{ JSON 側の名前: 変換元のプロパティ名 } */
    record?: Readonly<Record<string, string>>;
};

export const convertValue = <TName extends string, TCommonType extends CommonType<TName>, TResult>(
    target: ConvertType<TCommonType> & ConvertKeys,
    kind: string, // 成功時の kind と同じ値。ErrorJson の kindType になる
    process: (target: ConvertExcludeError<TCommonType>, targetRecords: StructureSourceKeys) => TResult,
    options: ConvertValueOptions = {},
): TResult | ErrorJson;
```

- `targetRecords` は `{ base, ...record で指定した子のキー }`。`JsonType` は `targetRecords.base`、`StructureJson` は `targetRecords` をそのまま `sourceKeys` にする。
- 利用例（宣言）:

```ts
return convertValue<'methodDeclaration', MethodDeclarationType, MethodDeclarationJson>(
    target,
    'method',
    (method: ConvertWithError<MethodDeclarationType>, targetRecords) =>
        makeStructureJson('method', targetRecords, { name: ..., block: makeBlockJson(method.block) }),
    { exclude: 'children', record: { name: 'value' } },
);
```

- `exclude` を使う場合、`process` の `target` には対象外のプロパティにエラーが残りうる。上の例のように、引数の型を `ConvertWithError<T>` と宣言して受け取る。

### 3.6 型の扱い

- **すべての `makeXxxJson` は `ConvertType<T>` を受け取る**。公開シグネチャから `ConvertExcludeError` をなくす。
- `process` の `target` は `ConvertExcludeError<T>` のままにする（妥協案）。
  - 実際には、委譲プロパティにはエラーが残りうる。
  - 子の変換関数は `ConvertType` を受け取って自分でエラーを処理するので、実行時の動作は正しい。
  - 型の上で、委譲プロパティが実際より少し狭く見えるだけ。正確に表そうとすると型の計算が重くなる（方針 A〜B で避けた TS2589 の再発につながる）ため、そこまではしない。

### 3.7 境界ノードでない関数（ディスパッチャ・値ノード）

- `makeStatementJson` や `makeExpressionJsonConvert` のように、種類で振り分けるだけの関数も `ConvertType` を受け取る。
- 受け取ったノード自体が `type === 'error'` の場合は、そのノードのキーから `ErrorJson` を作る。エラーノードも変換後は自分の `objectKey` / `sourceKey` を持っている。

```ts
if (target.type === 'error') {
    return makeErrorJson('statement', { objectKey: target.objectKey, sourceKey: target.sourceKey }, [target]);
}
```

- 値ノードを作る関数は、境界ノードの担当範囲の中でしか呼ばれない（エラーは事前に検査済み）。そのため `ConvertExcludeError` を受け取ってよい。

### 3.8 `ErrorJson`（一部実装）

実装済み: `kindType` を成功時の `kind` と一致させた。JSON 層の `throw` をなくした。未実装: 原因（`errors`）を持たせること。現在の `ErrorJson` は `kind` / `sourceKeys` / `kindType` だけ。

```ts
export type ErrorJson = JsonType<'error'> & {
    kindType: string; // 本来出力されるはずだった kind
    errors: { errorCode: string; contextType: string; sourceKeys: ConvertKeys }[];
};
```

- `kindType` は、成功時の `kind` と同じ値にする（`convertValue` の `kind` 引数を共有する）。
- 原因（`errorCode` / `contextType`）と、エラーノード自身の位置を残す。現在は `errorInfos` を捨てている。
- JSON 層では `throw` しない（`makeValueJson` の throw を廃止する）。

### 3.9 子の JSON は剥がさない

`Omit<…, 'kind' | 'sourceKeys'>` で子の `kind` / `sourceKeys` を剥がす処理（type.ts の要素型、catch 句の modifier、`FORMAT` の arg など）は廃止する。

- 子が境界ノードなら、そのまま持つ。
- 位置が不要なら、最初から値ノード（`KindJson`）として作る。
- 剥がすと `ErrorJson` が `{ kindType }` だけになり、エラーかどうか判別できなくなる。

---

## 4. ノードの分類（2026-10-29 時点の実装）

| 分類 | ノード（kind） | 種別 | 検査範囲 / `sourceKeys` |
| --- | --- | --- | --- |
| unit | anonymous / trigger / cls | 非境界（U1） | unit ごとに JSON ファイルを保存する |
| trigger の条件 | `triggerCase` | 境界 `JsonType` | 部分木全体 |
| 宣言 | `method` / `constructor` / `class` / `interface` / `interfaceMethod` / `enum` / `property` | 境界 `StructureJson` | ノード自身だけ。`base` と `name` |
| 宣言 | `field` | 境界 `JsonType` | 部分木全体（初期値を含む） |
| enum の定数 | `enumConstant` | 境界 `JsonType` | 部分木全体 |
| 宣言の部品 | 引数（`parameter`） | 境界 `JsonType` | 部分木全体 |
| 宣言の部品 | ローカル変数の宣言 | 非境界（`localVariable` 文の中） | ― |
| 修飾子 | `modifier` / `annotation` | 境界 `JsonType` | 部分木全体 |
| 単文 | `break` / `continue` / `return` / `throw` / `insert` / `update` / `upsert` / `delete` / `undelete` / `merge` / `expression` / `localVariable` | 境界 `JsonType` | 部分木全体 |
| 複合文 | `if` / `for` / `while` / `doWhile` / `switch` / `try` / `runAs` | 境界 `JsonType` | ノード自身だけ |
| 条件 | `ifCondition` / `whileCondition` / `doWhileCondition` / `forCondition` / `runAsCondition` / `whenVariant` / `switchCondition` | 境界 `JsonType` | 部分木全体 |
| catch 句 | `catchCondition` | 境界 `StructureJson` | catch 本体以外。`base` / `exception` / `exceptionType` |
| 式・primary・literal | すべて | 非境界（判別キーなし） | ― |
| 型 | `type`（最上位） | 境界 `JsonType` | 部分木全体 |
| 型 | ジェネリクス・要素型 | 非境界（`TypeContentJson`、U2） | ― |
| SOQL / SOSL | `soql` / `subQuery` / `sosl` | 境界 `JsonType` | ノード自身だけ |
| SOQL 句 | `selectEntry` / `fromField` / `singleCondition` / `orderField` / `groupBy` / `limitClause` / `offsetClause` / `forClause` / `usingScopeClause` / `allRowsClause` / `updateClause` / `categoryCondition` / `soslField` | 境界 `JsonType` | 部分木全体 |
| SOQL 部品 | select / from / where / orderBy / with の入れ物、フィールド名、SOQL 関数、値、日付関数、typeof | 非境界 | ― |

---

## 5. 未決事項 → 決定

| # | 内容 | 決定 |
| --- | --- | --- |
| U1 | unit を境界ノードにするか | 境界にしない（unit ごとに JSON ファイルを保存するため） |
| U2 | 型の内側を境界にするか | 最上位だけ境界にする（X1） |
| U3 | 引数・ローカル変数の宣言子を境界にするか | 引数は境界（`parameter`）。ローカル変数の宣言子は `localVariable` 文の一部 |
| U4 | SOQL / SOSL 全体を境界にするか | 境界にする（J4。ノード自身だけ検査） |
| U5 | 順序を保持するか | **未決**。評価で順序の消失を確認した（[apex-json-output-evaluation.md](apex-json-output-evaluation.md) 10.2）。改善案 E3 / E4 |
| U6 | `process` の `target` の型 | `ConvertExcludeError<T>` のまま。`exclude` 使用時は `ConvertWithError<T>` で受け取る |

---

## 6. 移行の状況

| 手順 | 状況 |
| --- | --- |
| commons（`convertValue` の置き換え、B3 / B4 の修正） | 済み |
| 入口のエラー一括除外の廃止、`ConvertType` へのそろえ | 済み |
| 振り分け関数でエラーノードを `ErrorJson` にする | 済み |
| 境界ノードの追加（宣言・複合文・SOQL / SOSL・trigger 条件・enum 定数） | 済み |
| 剥がす処理の廃止（3.9） | 一部（SOQL 関数の `FORMAT` の `arg` が残る） |
| `ErrorJson` に原因を持たせる（3.8） | 未 |
| 式などに `kind` を付ける（3.2 の `KindJson`） | 未。評価 10.3 の改善案 E1 / E2 |
| 検証（出力比較・テスト） | 済み（`docs/examples/apex-json`、`test/converter/json-error-handling.test.ts`） |
