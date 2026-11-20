# Apex JSON の型と Apex 構文の対応

`src/analyzer/types/apex/` の定義・変換処理をもとに、Apex の構文や関連するメタデータがどの JSON 型になるかをまとめる。作成時の作業ツリーを対象とする。

| 分類 | 一覧 | 直接定義された型別名 |
| --- | --- | --- |
| 単位・宣言・修飾子・メタデータ | [宣言など](./apex-json-types-declarations.md) | 18 |
| 型・基本式・式 | [型と式](./apex-json-types-expressions.md) | 29 |
| 文 | [文](./apex-json-types-statements.md) | 22 |
| SOQL / SOSL | [クエリ](./apex-json-types-queries.md) | 18 |
| 合計 | | 87 |

件数は `JsonType<...>` または `StructureJsonType<...>` を直接含む型別名の数。非公開の型別名、同じ `kind` を共有する型、生成時に使う別名もそれぞれ数える。`kind` は 81 種類。共用体・入れ物も、読み方に必要なものを各一覧で補足するが、件数には含めない。

## 共通の形

| 種類 | `sourceKeys` | 主な用途 |
| --- | --- | --- |
| `JsonType<K>` | `{ objectKey, sourceKey }` | 式・文・句などのノード全体の位置 |
| `StructureJsonType<K, R>` | `{ base: { objectKey, sourceKey }, ...R }` | 宣言全体に加え、名前などの位置も持つノード。Apex の対象型は `base` と `name` を持つ |

いずれも `kind` を持つ。キーから元の位置を探せるが、キーの値自体は位置の行番号ではない。定義は [commons/json.ts](../src/analyzer/types/commons/json.ts)。

一方、`TypeContentJson`、`WhereJson`、`IfConditionBlockJson` などは **`kind` と `sourceKeys` を持たない入れ物**。内側に位置付きノードがある場合もある。ファイル全体の `AnonymousUnitJson` / `TriggerUnitJson` も境界ノードではない。

## 読み方

- 表の「主な属性」では共通の `kind`・`sourceKeys` を省略。`?` は省略可能を表す。
- 構文例は対応を示すための抜粋で、単独では Apex として完結しないものもある。実際に出力されるプロパティは定義・生成処理が正。
- `type` は `kind` とは別の判別子。例えば `memberAccess.type` の `object` / `method` と、型ノードの `type` の `primitive` / `custom` などは意味が異なる。
- この一覧は JSON の型と構文の対応であり、型解決・依存先の実在を保証するものではない。
