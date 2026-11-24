# Apex 標準 API・標準オブジェクトの確認例

[目次・調査条件](./apex-standard-reference.md)。以下は公式資料で確認した**一部の例**であり、名前やバージョンの完全な一覧ではない。導入版・非推奨が未確認の場合は推測しない。

## 型とメソッド

| 標準型               | 確認したメソッド名の例                                                                                                   | 出典                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `System.String`      | `valueOf`, `trim`, `toUpperCase`, `equals`                                                                               | [String Class](https://developer.salesforce.com/docs/platform/apex-ref/references/apex-ref/apex-methods-system-string.html)               |
| `System.Database`    | `convertLead`, `countQuery`, `delete`                                                                                    | [Database Class](https://developer.salesforce.com/docs/platform/apex-ref/references/apex-ref/apex-methods-system-database.html)           |
| `System.Assert`      | `areEqual`, `areNotEqual`, `fail`, `isTrue`, `isFalse`, `isNull`, `isNotNull`, `isInstanceOfType`, `isNotInstanceOfType` | [Assert Class](https://developer.salesforce.com/docs/platform/apex-ref/references/apex-ref/apex-class-system-assert.html)                 |
| `Database.Batchable` | `start`, `execute`, `finish`                                                                                             | [Batchable Interface](https://developer.salesforce.com/docs/platform/apex-ref/references/apex-ref/apex-interface-database-batchable.html) |

`System.String.equals` には複数の形があり、公式資料は `equals(secondString)` を非推奨としている。`equals` という名前全体が非推奨という意味ではない。非推奨や戻り値を正しく扱うには、メソッド名だけでなく個々のオーバーロードの情報が必要。

## オブジェクトと項目

| オブジェクト | 項目の例                                                          | バージョンについて確認できたこと                                  | 出典                                                                                                                       |
| ------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `Account`    | `AccountNumber`, `AccountScore`, `AccountSource`, `AnnualRevenue` | `AccountScore`: API 61.0 で導入。`AccountSource`: API 24.0 で導入 | [Account](https://developer.salesforce.com/docs/platform/object-reference/references/standard-objects/object-account.html) |

導入版は公式資料に明記されたものだけを掲載している。掲載した項目であっても組織や権限による利用可否は別途確認が必要。

## 依存関係解析での使い方

例えば `String.valueOf(123).trim().toUpperCase()` では、公式資料上 `String.valueOf`、`trim`、`toUpperCase` は `String` を返す。呼び出しの結果型を順に解決できれば、後続の `trim` と `toUpperCase` も `System.String` のメソッドとして扱える。

ただし、現在の [Apex walker](../../src/analyzer/processor/Apex/walker.ts) の名前抽出だけではメソッド呼び出しをまたげない。利用者が定義したクラス・変数との名前衝突、オーバーロード、動的な型、組織固有のオブジェクトや API バージョンも解決が必要。未解決の参照を、一覧に載っていないという理由だけで欠落としない。
