# Apex 標準 API と標準オブジェクトの調査

依存関係解析で標準の名前とユーザー定義の名前を区別するための資料。公開されている Salesforce の公式資料を基準とし、特定の Salesforce 組織には接続していない。調査日: 2026-11-20。

**未完成:** この文書は全クラス・メソッド・オブジェクト・項目や全バージョンの一覧ではない。型一覧には未調査の領域があるため、未掲載の名前を「標準に存在しない」と判定してはいけない。

| 資料 | 内容 | 網羅状況 |
| --- | --- | --- |
| [名前空間の目次](./apex-standard-namespaces.md) | 公式 Apex Reference Guide に掲載された名前空間と各公式ページへのリンク | 確認時点の目次。各名前空間の型・メソッドはリンク先 |
| [標準型一覧](./apex-standard-types.md) | 名前空間別のクラス・インターフェース・enum・例外 | 公式資料からの抽出。一部未収録、利用条件は未網羅 |
| [確認例と依存関係への適用](./apex-standard-examples.md) | 型・メソッド・標準オブジェクト・項目とバージョン情報の確認例 | 一部のみ |

## 公式資料

| 対象 | 資料 | 注意 |
| --- | --- | --- |
| 標準のクラス・インターフェース・enum・例外 | [Apex Reference Guide](https://developer.salesforce.com/docs/platform/apex-ref/references) | 名前空間別。動的に生成される型や利用条件がある |
| 標準オブジェクト・項目 | [Standard Objects](https://developer.salesforce.com/docs/platform/object-reference/references/standard-objects/sforce-api-objects-list.html) | 公式資料にも掲載されない項目がある。実際に見える範囲は組織・ユーザーによって変わる |
| システム項目 | [System Fields](https://developer.salesforce.com/docs/platform/object-reference/guide/system-fields.html) | 標準オブジェクトの個別ページだけでは全項目を確認できない |
| 組織で見えるオブジェクト | [Describe Global の説明](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/asociatapi_rest/using_resources_getting_info_about_my_org.htm) | 組織とログインユーザーに依存する |
| 各オブジェクトの項目 | [sObject Describe](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/object_reference/resources_sobject_describe.htm) | 特定組織・ユーザー・API バージョンでの結果 |
| バージョンごとの挙動 | [Apex Versioned Behavior Changes](https://developer.salesforce.com/docs/platform/apex-ref/references/apex-ref/versioned-behavior-changes.html) | 主な変更の非網羅的な一覧 |
| 過去の資料 | [Apex Developer Guide の PDF アーカイブ](https://developer.salesforce.com/docs/platform/apex-dev/references/apex-dev/apex-pdf-archive.html) | Apex Reference は API 51.0 以前には Developer Guide 内に掲載。各版の比較は未実施 |

2026-11-20 の公式資料では Winter '27 / API 68.0 が最新として表示されている（[Apex Release Notes](https://developer.salesforce.com/docs/platform/apex-ref/references/apex-ref/apex-releasenotes.html)）。これは参照資料の版であり、ここに挙げた各名前が過去のすべての API バージョンで使用可能であるという意味ではない。

## 残る調査

- 型一覧の未収録領域と各型の公開条件を調査し、必要に応じてメソッド名、非推奨・導入版を確認する。
- 標準オブジェクトと項目を収集する。公式資料の不足分と、組織設定・権限で変わる部分を区別する。
- 過去の公式資料を版ごとに比較する。記載が見つからないだけでは「その版で利用不可」と断定しない。
- 将来の型解決に必要なら、名前だけでなくオーバーロード・引数・戻り値の型も別途記録する。

既存の [Apex JSON の解析計画](./apex-json-analysis.md) は標準クラスをよく使うものに絞る方針を記録しており、この一覧の網羅目標とは異なる。実装方針はこの文書だけでは変更しない。
