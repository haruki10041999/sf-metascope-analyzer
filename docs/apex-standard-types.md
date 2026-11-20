# Apex 標準型一覧

[標準 API 調査の目次](./apex-standard-reference.md)

Salesforce の公式 [Apex Reference Guide PDF](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf)（Winter '27、Version 68.0、2026-10-28 更新）を 2026-11-20 に参照した一覧。クラス・インターフェース・enum・例外を名前空間ごとに記録する。PDF のリンク先は最新公開版に更新されるため、将来はページ番号が変わる場合がある。

**未完成:** 81 名前空間を対象に 2504 個の異なる完全修飾名、2506 行（クラス 2019、インターフェース 70、enum 347、例外 69、種別未確認 1）を収録した。公式 PDF のしおり・本文の一部を機械抽出したもので、全標準型の完全な一覧ではない。掲載がないことを非標準の根拠にしない。

| 一覧 | 行数 |
| --- | ---: |
| [A–D（ConnectApi を除く）](./apex-standard-types-a-d.md) | 294 |
| [E–M](./apex-standard-types-e-m.md) | 165 |
| [N–R](./apex-standard-types-n-r.md) | 160 |
| [S–Z（System を除く）](./apex-standard-types-s-z.md) | 88 |
| [System](./apex-standard-types-system.md) | 156 |
| [ConnectApi：通常の型・enum・例外](./apex-standard-types-connectapi.md) | 339 |
| [ConnectApi：Input クラス](./apex-standard-types-connectapi-input.md) | 358 |
| [ConnectApi：Output クラス](./apex-standard-types-connectapi-output.md) | 946 |

## 抽出方法と制約

- PDF の各名前空間直下にあるクラス・インターフェース・enum のしおりを抽出した。ConnectApi の Input / Output クラスは配下のしおりを抽出し、enum は本文の見出し、例外は各名前空間の例外表から抽出した。型名中の表示用ゼロ幅文字を除き、同じ完全修飾名・種別の重複は 1 行にまとめた。ページ番号が異なる場合は併記する。
- 次の 26 名前空間には個別型のしおりがなく、PDF 本文の型見出しなどから確認できたものだけを追加した。これらの型の PDF ページ番号は名前空間の開始ページを示し、型名は次ページ以降に記載される場合がある。本文のすべての参照や外部文書は網羅していない：`CommerceOrders`、`commonserviceexcellence`、`ComplianceMgmt`、`Context`、`DataRetrieval`、`ExternalService`、`Flowtesting`、`disputemanagement`、`fsccashflow`、`fsccomplaintmanagement`、`fschousehold`、`fscserviceprocesses`、`fscwmgen`、`industriespersonalizedfinance`、`IssueCreditMemo`、`ind_mfg_sample_mgmt_apex`、`IndustriesDigitalLending`、`InvoiceWriteOff`、`PlaceQuote`、`renew_assets_summary`、`RevSignaling`、`RevSalesTrxn`、`RulesAppln`、`runtime_industries_cpq`、`runtime_industries_insurance`、`Slack`。
- このうち `CommerceOrders`、`ExternalService`、`Flowtesting`、`PlaceQuote`、`runtime_industries_cpq` は名前を収録していない。`ExternalService` と `Flowtesting` の型は動的生成される。`CommerceOrders`、`PlaceQuote`、`runtime_industries_cpq` は PDF から別資料への参照があるが、そちらの型は未収録。`Slack` の複数形のグループ見出し以下も未網羅。
- `Slack.AppClient` と `Slack.UserMappingService` は PDF 以外の Salesforce 公式 Slack SDK 資料でも確認した。PDF には種別が明記されない `System.RemoteObjectController` は「型（種別未確認）」とした。
- `ConnectApi.ManagedContentCloneStatus` と `ConnectApi.ManagedContentNodeType` は PDF にクラスと enum の両方の記載があるため両方残した。実際の解決に使う前に要確認。
- PDF で Retired と記された ConnectApi クラス、Pilot と記されたクラス、および Developer Preview の見出しは備考に記録した。その他の利用制限、導入・廃止バージョン、非推奨情報は全件調査していない。組織・権限・機能・API バージョンによって実際の利用可否は異なる。
- 標準オブジェクト・項目、個々のメソッドや enum 値はこの一覧の対象外。

## 依存関係解析での使い方

- `Schema.SObjectType` のような名前空間付きの型名を照合できる。照合時は大文字・小文字を区別せず、出力には公式表記を保持する。
- `List<Account>` の walker 出力にある `path: ['list']` はコレクションの構造であり、`list.Account` という名前空間付き型名ではない。型の構造と名前空間を区別して解決する。
- 名前空間を省略した型名は、この表への単純一致だけで標準型と決めず、スコープ・名前衝突などを解決する。該当がない名前や、生成型・表の未調査部分は `unknown` として扱う。
