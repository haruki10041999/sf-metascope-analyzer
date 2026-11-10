# JSON がまだ持っていないもの（調査）

今の JSON（単位の種類ごとの `kind` の型）と、そこから作る定義・参照（依存関係のグラフ）が、まだ扱っていないものの一覧。追加の計画を立てるための調査で、コードは変えていない。

- 対象: [unitType.ts](../src/analyzer/unit/unitType.ts) の `UNIT_TYPES`（Apex・匿名 Apex・LWC・オブジェクト・オブジェクトの翻訳と、[folders.ts](../src/analyzer/parser/Metadata/folders.ts#L49-L84) の `METADATA_FOLDER_PARSERS` の 31 種類）、JSON の型（[types/](../src/analyzer/types/)）、定義・参照（[processor/dependency/](../src/analyzer/processor/dependency/)）。
- 2026-11-09 の作業ツリーを読んで確かめた。「確認」と書いたものは、グラフ（`buildDependencyGraph`）に小さな入力を渡して動きを確かめた。それ以外はコードを読んだ結果。確かめられなかったものは **未確認** と書く。
- すでに計画にあるもの（[analysis-plan.md](./analysis-plan.md) 3.3・8.1、[todo.md](./todo.md)）は、そちらへのリンクだけにする。
- **2026-11-10: 5 章の 1〜6 は対応済み**（6 章・7 章）。対応しなかったものは 7.4。0〜4 章の本文は調査した時点のまま残す。

## 0. まとめ

優先度は案。**高** = 誤った指摘が出る・グラフが切れる、**中** = 影響範囲の見落とし、**低** = あれば便利。

| 項目                                            | 種類                   | 今の状態                                                                                                                             | 影響                                                                   | 優先度の案 |
| ----------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ---------- |
| メッセージチャネル（`LightningMessageChannel`） | 参照先の定義がない     | LWC の import から参照は作るが、定義する単位がない。ノードは `unknown`                                                               | チャネルを使う LWC 同士がつながらない。チャネルの変更の影響が出ない    | 高         |
| `$CustomMetadata` のレコード                    | 参照と定義の名前の違い | 参照は `customMetadataRecord:<型>__mdt.<レコード>`、定義は `customMetadata:<型>.<レコード>`。突き合わない（確認）                    | 数式から使っているレコードが分からない                                 | 高         |
| Aura の部品を `lwc` として参照                  | 参照と定義の種類の違い | Aura のマークアップ・FlexiPage・Flow の画面の `c:<名前>` は `lwc` だけを探す。Aura なら `UNKNOWN_LWC`（確認）                        | 誤った指摘。Aura の被依存が出ない                                      | 高         |
| Flow の画面の標準の部品                         | 参照と定義の種類の違い | `forceContent:fileUpload` などを `aura` として探す。Aura が 1 つでもあると `UNKNOWN_AURA`（確認）                                    | 誤った指摘                                                             | 高         |
| カスタム設定（Custom Settings）                 | JSON・参照の穴         | `customSettingsType` を読まない（`skippedElements`）。Apex の `X__c.getInstance()` は項目 `X__c.getInstance`（標準）になる（確認）   | 普通のオブジェクトと区別できない。設定の項目の読み取りが取れない       | 高         |
| カスタムメタデータ型（`__mdt`）                 | 参照の穴               | 種類（`objectType: 'customMetadata'`）とレコードは読む。Apex の `getInstance('名前')` のレコード名、レコードの値の中の参照は取らない | 使っているレコード・レコードが指す項目・クラスが分からない             | 中         |
| 組織の設定（`settings/*.settings-meta.xml`）    | 単位がない             | 単位の種類がなく、読まない                                                                                                           | 組織の設定の差分が出ない。依存関係への影響は小さい                     | 低〜中     |
| 指定ログイン情報への参照（`callout:`）          | 参照の穴               | 指定ログイン情報は定義するが、Apex・Flow からの参照を作らない                                                                        | 指定ログイン情報の変更の影響が出ない                                   | 中         |
| Apex の動的な参照                               | 参照の穴               | `Page.X`・`Type.forName`・`Database.query`・`Flow.Interview.X`・`PageReference.forResource`・`sObject.get/put` などを取らない        | 影響範囲の見落とし。静的リソースが「使われていない」と誤って出る       | 中         |
| LWC の `js-meta.xml`・テンプレート              | 参照の穴               | `targetConfigs` の `objects`・`datasource`、式の値の属性、子の `@api` への属性、`apexContinuation` を参照にしない                    | 配置先のオブジェクト・`@api` の変更の影響が出ない                      | 中         |
| 権限の行の一部                                  | 参照の穴               | JSON にはあるが、`customSettingAccesses`・`customMetadataTypeAccesses`・`flowAccesses` などを参照にしない                            | 権限を与えている設定・Flow が分からない                                | 中         |
| Flow のアクション・条件                         | 参照の穴               | `actionCalls` は Apex・Flow だけ。条件の `$Permission`・`$Setup` は `globalVariable` になる                                          | メールアラート・通知・クイックアクション・カスタム権限の被依存が欠ける | 中         |
| まだ単位がないメタデータ                        | 単位がない             | 外部ログイン情報・カスタム通知・パス・レポートタイプ・割り当てルール・プラットフォームイベントのチャネル・Experience など            | 参照先の行き止まり・影響範囲の見落とし（3 章）                         | 中〜低     |
| プラットフォームイベント                        | JSON の穴              | `objectType: 'platformEvent'` はある。`eventType`・`publishBehavior` は読まない。`EventBus.publish` は区別しない                     | 発行と購読（トリガー・Flow）の対応が見えにくい                         | 低         |
| オブジェクトの翻訳                              | 参照の穴               | 定義・参照を作らない（空）                                                                                                           | 翻訳しているオブジェクト・項目の被依存が出ない                         | 低         |

## 1. 参照はあるが、定義する単位がないもの

[types.ts](../src/analyzer/processor/dependency/types.ts#L9-L29) の `DependencyTargetType` と、実際に作っている `refType` の一つずつについて、定義する単位があるかを確かめた。フォルダ単位のメタデータの定義の種類は `dataType`（[units.ts](../src/analyzer/processor/dependency/units.ts#L556-L563)）。名前が違うものは [graph.ts](../src/analyzer/processor/dependency/graph.ts#L64-L69) の `TARGET_ALIASES` で合わせる。

| refType                                                                                                                                                                                                                                                       | 参照を作るところ                                                                                                                                                                                                | 定義                                                                                            | 結果                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `messageChannel`                                                                                                                                                                                                                                              | LWC の `@salesforce/messageChannel/`（[units.ts](../src/analyzer/processor/dependency/units.ts#L265-L270)）                                                                                                     | なし（[folders.ts](../src/analyzer/parser/Metadata/folders.ts#L49-L84) にない）                 | **行き止まり**                            |
| `customMetadataRecord`                                                                                                                                                                                                                                        | 数式の `$CustomMetadata.<型>.<レコード>`（[formula.ts](../src/analyzer/processor/dependency/formula.ts#L129-L150)）                                                                                             | `customMetadata`（名前は `<型>.<レコード>`。`__mdt` なし）                                      | **種類も名前も違い、突き合わない**        |
| `lwc`（Aura・FlexiPage・Flow から）                                                                                                                                                                                                                           | Aura の `c:` の部品（[referenceAnalysis.ts](../src/analyzer/processor/Metadata/referenceAnalysis.ts#L290-L294)）、FlexiPage（[units.ts](../src/analyzer/processor/dependency/units.ts#L488-L501)）、Flow の画面 | `lwc`。Aura の部品なら `aura`                                                                   | **Aura の部品は `UNKNOWN_LWC`**           |
| `auraComponent`（Flow の `component`）                                                                                                                                                                                                                        | Flow の画面の `extensionName`（`c:` 以外。[flow.ts](../src/analyzer/types/metadata/flow.ts#L369-L379)）                                                                                                         | `aura`（別名）。標準の部品は定義がない                                                          | **標準の部品が `UNKNOWN_AURA`**           |
| `customPermission`                                                                                                                                                                                                                                            | LWC の import、数式の `$Permission`、Apex の `FeatureManagement.checkPermission`、権限セット                                                                                                                    | `customPermission`（[recordTypes.ts](../src/analyzer/types/metadata/recordTypes.ts#L146-L163)） | あり                                      |
| `staticResource`                                                                                                                                                                                                                                              | LWC の `@salesforce/resourceUrl/`、Visualforce・Aura・メールの `$Resource`                                                                                                                                      | `staticResource`（[recordTypes.ts](../src/analyzer/types/metadata/recordTypes.ts#L286-L291)）   | あり（ただし 4.1 の Apex からの参照なし） |
| `globalVariable`                                                                                                                                                                                                                                              | 数式・Flow の `$User` など                                                                                                                                                                                      | なし（標準として扱う。[graph.ts](../src/analyzer/processor/dependency/graph.ts#L299-L300)）     | 仕様どおり（穴ではない）                  |
| `apexType`・`apexTypeMember`                                                                                                                                                                                                                                  | Apex                                                                                                                                                                                                            | グラフでクラス・オブジェクトに決める                                                            | 決まらないものは標準のクラスとして扱う    |
| `visualforcePage`・`visualforceComponent`                                                                                                                                                                                                                     | 権限・タブ・レイアウトなど                                                                                                                                                                                      | `apexPage`・`apexComponent`（別名）                                                             | あり                                      |
| そのほか（`customLabel`・`flow`・`layout`・`flexiPage`・`customTab`・`customApplication`・`quickAction`・`globalValueSet`・`report`・`emailTemplate`・`role`・`group`・`queue`・`profile`・`permissionSet`・`mutingPermissionSet`・`recordType`・`listView`） | 各種類                                                                                                                                                                                                          | 同じ名前の種類                                                                                  | あり                                      |
| `lwcProperty`（定義だけ）                                                                                                                                                                                                                                     | —                                                                                                                                                                                                               | LWC の `@api`（[units.ts](../src/analyzer/processor/dependency/units.ts#L324-L338)）            | **参照する側がない**（4.2）               |

確認したこと（グラフに直接入力を渡した結果）:

- Aura の `myAura` があり、`lwc:myAura` を参照 → `lwc:myAura` が `missing`、指摘 `UNKNOWN_LWC`。
- Aura が 1 つでもあり、`auraComponent:forceContent:fileUpload` を参照 → `missing`、指摘 `UNKNOWN_AURA`。
- 定義 `customMetadata:Conf.Default` と参照 `customMetadataRecord:Conf__mdt.Default` は別のノード（参照は `unknown`）。
- `messageChannel:MyChannel` は `unknown`（定義の種類がないので「ない」とも言わない）。

なお、`analyzeMetadataReferences`（グラフの前からある突き合わせ）は Aura から `lwc` への参照を Aura の名前でも探す（[referenceAnalysis.ts](../src/analyzer/processor/Metadata/referenceAnalysis.ts#L596-L599)）。グラフには同じ扱いがない。

## 2. 設定（Settings）

「設定」には次の 2 つの意味がある。どちらの意味かは分からないので、両方を書く。

### 2.1 カスタム設定・カスタムメタデータ型

**カスタム設定**（`objects/X__c/`、`<customSettingsType>List` / `Hierarchy`）

- オブジェクトとして読む。`objectType` は API 名の接尾辞で決めるので `custom` になり、普通のカスタムオブジェクトと区別できない（[object.ts](../src/analyzer/types/metadata/object.ts#L33-L43)）。
- `customSettingsType` は `OBJECT_SCHEMA` にないので、値を持たず `skippedElements` に名前だけ残る（[object.ts](../src/analyzer/types/metadata/object.ts#L45-L61)）。保護（`visibility: Protected`）は読む。
- Apex の `X__c.getInstance()`・`getOrgDefaults()`・`getValues()`・`getAll()` は、型のメンバーの参照（`apexTypeMember X__c.getInstance`）になる。グラフでは `X__c` がオブジェクトなので、項目 `X__c.getInstance`（`standard`）という、実際にはない項目のノードになる（確認）。
- `X__c.getInstance().Field__c` のように、呼び出しの結果の項目は参照にならない（オブジェクトが変数名のときだけ見るため。[apex.ts](../src/analyzer/processor/dependency/apex.ts#L297-L309)）。設定の項目の読み取りが取れない。
- 数式の `$Setup.X__c.Field__c` はオブジェクト・項目の参照になる（[formula.ts](../src/analyzer/processor/dependency/formula.ts#L113-L128)）。ただし「設定の読み取り」とは区別しない。
- 権限セット・Profile の `customSettingAccesses` は JSON にある（[permission.ts](../src/analyzer/types/metadata/permission.ts#L50)）が、参照にしない（4.4）。

**カスタムメタデータ型**（`objects/X__mdt/` と `customMetadata/X.Rec.md-meta.xml`）

- 型は `objectType: 'customMetadata'` で区別する。レコードは `customMetadata` の単位（[recordTypes.ts](../src/analyzer/types/metadata/recordTypes.ts#L11-L25)）で、型と項目への参照を作る（[referenceAnalysis.ts](../src/analyzer/processor/Metadata/referenceAnalysis.ts#L182-L190)）。
- Apex の `X__mdt.getInstance('Rec')`・`getAll().get('Rec')` は、上と同じく項目 `X__mdt.getInstance` になる。どのレコードを使うかは取らない。SOQL（`FROM X__mdt`）はオブジェクト・項目の参照になる。
- レコードの値は値の木で持つが、値の中の名前（`MetadataRelationship` の項目が指すオブジェクト・項目、値に書いた Apex のクラス名など）は参照にしない。トリガーのフレームワークなどで、レコードがクラス名を持つことがある。
- 数式の `$CustomMetadata` のレコードは、1 章のとおり定義と突き合わない。
- 権限の `customMetadataTypeAccesses` は参照にしない（4.4）。

### 2.2 組織の設定（`settings/*.settings-meta.xml`）

- 単位の種類がなく、読まない（`UNIT_TYPES`・`METADATA_FOLDER_PARSERS` にない）。
- 依存関係のつながりは少ない。ただし差分のレポートでは役に立つ（共有の設定・Lightning Experience・セキュリティ・メールの設定など）。
- 一部はほかのメタデータを指す（例: `CaseSettings` の既定のメールテンプレート・キュー）。どこまで読むかは **未確認**（種類ごとに要素がかなり違う）。表の種類（`RecordSpec`）で、要素を全部値の木として持つのが簡単そう。

## 3. まだ単位がないメタデータ

依存関係・差分・レポートに関わるもので、単位の種類がないもの。すでにある種類（[metadata-implementation.md](./metadata-implementation.md) 10.1）は除く。

| メタデータ                                                                      | フォルダ（sfdx）                           | なぜ要るか                                                                                                                |
| ------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| LightningMessageChannel                                                         | `messageChannels/`                         | LWC・Aura・Visualforce の通信の要。チャネルの項目（`lightningMessageFields`）の変更の影響を出す。1 章の行き止まりをなくす |
| ExternalCredential                                                              | `externalCredentials/`                     | 指定ログイン情報（`namedCredentialParameters.externalCredential`）と権限（`externalCredentialPrincipalAccesses`）が指す   |
| CustomNotificationType                                                          | `notificationtypes/`                       | Flow の `customNotificationAction`、Apex の `Messaging.CustomNotification` が使う                                         |
| ReportType（カスタムレポートタイプ）                                            | `reportTypes/`                             | レポートの `reportType` が指す。中にオブジェクト・項目の一覧を持つので、項目の影響範囲に入る                              |
| PlatformEventChannel・PlatformEventChannelMember・PlatformEventSubscriberConfig | `platformEventChannels/` など              | 変更データキャプチャ・イベントの購読の設定。オブジェクトとイベントのつながり                                              |
| AssignmentRules・AutoResponseRules・EscalationRules                             | `assignmentRules/` など                    | 条件の項目と、割り当て先（キュー・ユーザー）・メールテンプレートを持つ。ワークフローと同じ扱いができる                    |
| DuplicateRule・MatchingRule                                                     | `duplicateRules/`・`matchingRules/`        | 条件の項目を持つ。項目の削除の影響に入る                                                                                  |
| PathAssistant                                                                   | `pathAssistants/`                          | 選択リスト項目（`fieldName`）と値に依存する                                                                               |
| ContentAsset                                                                    | `contentassets/`                           | LWC の `@salesforce/contentAssetUrl/`（今は参照も作らない。4.2）                                                          |
| ExperienceBundle・Network・CustomSite・NavigationMenu                           | `experiences/`・`networks/`・`sites/` など | LWC の配置先（`lightningCommunity__*`）。ページの中の部品・項目。大きいので優先度は低い                                   |
| ConnectedApp                                                                    | `connectedApps/`                           | カスタム権限の `connectedApp` が指す                                                                                      |
| ExternalDataSource                                                              | `dataSources/`                             | 外部オブジェクト（`__x`）と権限の `externalDataSourceAccesses` が指す                                                     |
| Letterhead・Document                                                            | `letterhead/`・`documents/`                | メールテンプレートの `letterhead`・`attachedDocuments` が指す                                                             |
| CspTrustedSite                                                                  | `cspTrustedSites/`                         | リモートサイトと同じく、外部への通信の許可。差分のレポートで見たい                                                        |

LWC・Aura のバンドルの中のファイル:

- LWC はバンドルの直下の JS / TS・HTML・CSS・`js-meta.xml` を読み、フォルダ（`__tests__/` など）は `skippedFiles` にする（[folder.ts](../src/analyzer/parser/Lwc/folder.ts#L41-L78)）。`.svg` などほかのファイルの扱いは **未確認**。
- Aura は JS の関数の名前だけを持つ（[metadata-implementation.md](./metadata-implementation.md) 10.3）。JS の中の `component.get('c.method')`（Apex のメソッドの呼び出し）・`$A.get('e.c:event')` は取らない。マークアップの `aura:handler` のイベントも参照にしない（`registerEvents` だけ。[referenceAnalysis.ts](../src/analyzer/processor/Metadata/referenceAnalysis.ts#L280-L307)）。

## 4. 今の JSON・参照の中の穴

「JSON にない」ものと、「JSON にはあるが参照にしていない」ものを分けて書く。

### 4.1 Apex

Apex の JSON は構文の木をそのまま持つので、多くは「JSON にはあるが参照にしていない」もの。参照の取り出しは [apex.ts](../src/analyzer/processor/dependency/apex.ts)。動的 SOQL はすでに [analysis-plan.md](./analysis-plan.md) 8.1 の「残り」にある。

| 書き方                                                                             | 今                                                                                                                  | 足りないもの                                                                                                                                              |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Label.X`・`System.Label.X`                                                        | `customLabel`（[apex.ts](../src/analyzer/processor/dependency/apex.ts#L75)）                                        | `System.Label.get(ns, 'X')`（文字列）                                                                                                                     |
| `Page.X`                                                                           | 参照なし（`Page` は変数でないので何も作らない）                                                                     | `visualforcePage` への参照                                                                                                                                |
| `new PageReference('/apex/X')`                                                     | 参照なし                                                                                                            | 文字列の中のページ名                                                                                                                                      |
| `PageReference.forResource('X')`、`FROM StaticResource WHERE Name = 'X'`           | 標準の型・オブジェクト `StaticResource` だけ                                                                        | `staticResource`。今は Apex だけで使う静的リソースが「使われていない」の候補に出る（[graph.ts](../src/analyzer/processor/dependency/graph.ts#L531-L538)） |
| `Type.forName('X')`                                                                | 標準の型 `Type` のメンバー                                                                                          | 文字列のクラス名                                                                                                                                          |
| `Database.query(str)`・`Database.queryWithBinds`                                   | 標準の型のメンバー                                                                                                  | 文字列の SOQL（計画済み）                                                                                                                                 |
| `Schema.getGlobalDescribe().get('X__c')`・`Schema.describeSObjects`                | 参照なし                                                                                                            | 文字列のオブジェクト名                                                                                                                                    |
| `rec.get('Field__c')`・`rec.put('Field__c', v)`                                    | 参照なし                                                                                                            | 文字列の項目名                                                                                                                                            |
| `X__c.getInstance()` など（カスタム設定）                                          | 項目 `X__c.getInstance`（2.1）                                                                                      | 「設定の読み取り」としての参照、続く項目の読み取り                                                                                                        |
| `X__mdt.getInstance('Rec')`                                                        | 項目 `X__mdt.getInstance`                                                                                           | レコード名                                                                                                                                                |
| `new Flow.Interview.MyFlow(params)`・`Flow.Interview.createInterview('MyFlow', …)` | 標準の型 `Flow.Interview.MyFlow`                                                                                    | `flow` への参照                                                                                                                                           |
| `req.setEndpoint('callout:Name/…')`                                                | 参照なし                                                                                                            | `namedCredential` への参照                                                                                                                                |
| `EventBus.publish(new X__e(...))`                                                  | オブジェクト `X__e` を `creates`                                                                                    | 「発行」の区別（`publishes` など）                                                                                                                        |
| `FeatureManagement.checkPermission('X')`                                           | `customPermission`（文字列のリテラルのときだけ。[apex.ts](../src/analyzer/processor/dependency/apex.ts#L236-L255)） | 変数・定数で渡したとき                                                                                                                                    |
| 呼び出しの結果のメンバー（`getAccount().Name`）                                    | 参照なし                                                                                                            | 計画済み（継承・戻り値の型。[analysis-plan.md](./analysis-plan.md) 8.1）                                                                                  |

### 4.2 LWC

| もの                                                                         | JSON                                                                                                  | 参照                                                                                                                             |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `js-meta.xml` の `targetConfigs` の `objects`                                | あり（[meta.ts](../src/analyzer/types/lwc/meta.ts#L46-L63)）                                          | なし。置けるオブジェクトへの参照がない                                                                                           |
| `targetConfigs` の `property` の `datasource`（`apex://Class`）              | あり                                                                                                  | なし。Apex のクラスへの参照がない                                                                                                |
| `targets`（配置先）・`isExposed`                                             | あり                                                                                                  | 参照ではない。FlexiPage の解析は使う（[metadata-implementation.md](./metadata-implementation.md) 10.5）                          |
| テンプレートの属性で、値が式のもの（`field-name={nameField}`）               | あり（`metadataRefs` の `expression`。[template.ts](../src/analyzer/types/lwc/template.ts#L94-L106)） | なし。静的な値だけを参照にする（[units.ts](../src/analyzer/processor/dependency/units.ts#L312-L322)）。import と合わせれば決まる |
| テンプレートの項目で、祖先のフォームのオブジェクトが分からないもの           | 項目名だけ（`Name`）                                                                                  | `field:Name` という、オブジェクトのない参照になる。グラフでの見え方は **未確認**                                                 |
| 子のコンポーネント（`<c-child foo={x}>`）の属性                              | あり（`attributes`）                                                                                  | 子のバンドルへの参照だけ。子の `@api` プロパティ（`lwcProperty`）への参照がない。`@api` の名前の変更の影響が出ない               |
| `@wire` の設定の文字列（`fields: ['Account.Name']`）                         | あり（`config` の `value`。[component.ts](../src/analyzer/types/lwc/component.ts#L58-L84)）           | なし（import した項目は参照になる）                                                                                              |
| `@salesforce/apexContinuation/`                                              | あり（`category: 'apex'`。[import.ts](../src/analyzer/types/lwc/import.ts#L51-L61)）                  | なし（パターンが `@salesforce/apex/` だけ。[units.ts](../src/analyzer/processor/dependency/units.ts#L229-L234)）                 |
| `@salesforce/contentAssetUrl/`                                               | あり                                                                                                  | なし（定義する単位もない。3 章）                                                                                                 |
| `@salesforce/label/<名前空間>.X`・`@salesforce/userPermission/X`             | あり（後者は `other`）                                                                                | なし                                                                                                                             |
| `lightning/navigation` の行き先（`standard__navItemPage` の `apiName` など） | JS の式の文字列                                                                                       | なし。タブ・ページへの参照がない                                                                                                 |

### 4.3 オブジェクト

- `customSettingsType`、プラットフォームイベントの `eventType`・`publishBehavior` は読まない（2.1）。ほかに `OBJECT_SCHEMA` にない要素は `skippedElements` に残るので、サンプルのリポジトリで洗い出せる（[todo.md](./todo.md) 6 章にある）。
- 参照にしていないもの（[units.ts](../src/analyzer/processor/dependency/units.ts#L74-L217)）: `actionOverrides` の `content`（Visualforce・FlexiPage・LWC）、`searchLayouts` の項目・ボタン、`webLinks` の URL・数式の中の項目、レコードタイプの選択リストの値。
- 項目の型（`type`）・`referenceTo`・`formula` などは JSON にある（[field.ts](../src/analyzer/types/metadata/field.ts#L37-L67)）。参照の確かめに足りないものは見つからなかった。
- オブジェクトの翻訳は定義・参照を作らない（[units.ts](../src/analyzer/processor/dependency/units.ts#L611-L612)）。組織全体の翻訳（`translations`）は参照を作る。

### 4.4 権限セット・Profile

JSON はすべての行を持つ（[permission.ts](../src/analyzer/types/metadata/permission.ts#L47-L90)）。参照にするのは、オブジェクト・項目・Apex クラス・Visualforce・レコードタイプ・レイアウトの割り当て・ログインフロー・カスタム権限・タブ・アプリだけ（[units.ts](../src/analyzer/processor/dependency/units.ts#L424-L432)、[referenceAnalysis.ts](../src/analyzer/processor/Metadata/referenceAnalysis.ts#L409-L425)）。参照にしていない行:

- `customSettingAccesses`・`customMetadataTypeAccesses`（2.1）
- `flowAccesses`（Flow を実行する権限）
- `externalCredentialPrincipalAccesses`・`externalDataSourceAccesses`（定義する単位もない。3 章）

### 4.5 Flow

- `actionCalls` は `actionType` が `apex` と `flow` のときだけ参照にする（[flow.ts](../src/analyzer/types/metadata/flow.ts#L360-L365)）。`emailAlert`（ワークフローのメールアラート）・`quickAction`・`customNotificationAction`・`submit`（承認プロセス）・`externalService` などは参照がない。
- 画面の部品の `c:<名前>` はいつも `lwc`、それ以外は `component`（Aura として探す）。1 章の誤った指摘のもと。
- 数式（`formula`・`expression`）の中は数式の解析で `$Permission`・`$Setup`・`$CustomMetadata` を取る。条件の左辺など、数式以外の `$Permission.X` は `global`（`globalVariable`）になり、カスタム権限への参照にならない（[flow.ts](../src/analyzer/types/metadata/flow.ts#L300-L310)）。今は Flow の条件だけで使うカスタム権限が「使われていない」の候補に出る。

## 5. 進め方の案

1. **済（2026-11-10）** 誤った指摘をなくす（小さい修正）: Aura の `c:` を `lwc` か `aura` のどちらかで探す、Flow の標準の部品を標準として扱う、`customMetadataRecord` の種類・名前を `customMetadata` に合わせる。
2. **済（2026-11-10）** カスタム設定: `OBJECT_SCHEMA` に `customSettingsType` を足し、`objectType` か別のプロパティで区別する。Apex の `getInstance` などを設定の読み取りとして参照にする。
3. **済（2026-11-10）** メッセージチャネル・外部ログイン情報・カスタム通知・レポートタイプの単位を、表の種類（`RecordSpec`）で足す。
4. **済（2026-11-10）** 文字列の引数（`Page.X`・`Type.forName`・`callout:`・`PageReference.forResource`・`Flow.Interview`）を参照にする。
5. **済（2026-11-10）** LWC の `js-meta.xml`・式の値の属性・子の `@api`、権限の残りの行、Flow のアクション。
6. **済（2026-11-10、一部）** 組織の設定（`settings/`）と、ほかの単位がない種類。

## 6. 対応したこと（2026-11-10）

5 章の 1〜3。テストは [graph-targets.test.ts](../test/dependency/graph-targets.test.ts)（グラフに小さな入力を渡すもの）と、[metadata-parse.test.ts](../test/parser/metadata-parse.test.ts)・[references.test.ts](../test/dependency/references.test.ts)・[metadata-bc.test.ts](../test/processor/metadata-bc.test.ts)（サンプル）。保存の形が変わったので `SAVE_FORMAT_VERSION` を 5 にした。

1. 誤った指摘
    - `c:<名前>` の部品: グラフ（[graph.ts](../src/analyzer/processor/dependency/graph.ts) の `resolveTarget`）で、`lwc` の定義がなければ `aura` の定義も探す。LWC の import・テンプレート（`via` が `import`・`template`）は LWC だけを探す（LWC は Aura を使えないため）。
    - Flow の画面の `c` 以外の名前空間の部品（`forceContent:fileUpload` など）は `standard` にする（`UNKNOWN_AURA` にしない）。
    - 数式の `$CustomMetadata.<型>__mdt.<レコード>` は `customMetadata:<型>.<レコード>`（定義と同じ種類・名前）にした（[formula.ts](../src/analyzer/processor/dependency/formula.ts)）。
2. カスタム設定
    - `OBJECT_SCHEMA` に `customSettingsType`（`List` / `Hierarchy`）・`customSettingsVisibility` を足した。`objectType` は接尾辞で決めるまま（`custom`）で、カスタム設定かは `customSettingsType` で分かる（`objectType` を変えると、暗黙の項目・解析など `objectType` を見るところに広がるため）。
    - Apex（[apex.ts](../src/analyzer/processor/dependency/apex.ts)）: `X__c.getInstance()`・`getOrgDefaults()`・`getValues()`・`getAll()` はオブジェクト `X__c` の `reads`（`via: customSetting`）。`X__c.getInstance().Field__c` のように 1 件を返す呼び出しに続く項目は、項目の `reads`。`X__mdt.getInstance()`・`getAll()` は型の `reads`（`via: customMetadata`）、`getInstance('Rec')`・`getAll().get('Rec')`（文字列のリテラル）はレコード `customMetadata:<型>.Rec` の `reads`。項目 `X__c.getInstance` のノードはできなくなった。
    - 権限の `customSettingAccesses`・`customMetadataTypeAccesses`（4.4）、レコードの値の中の参照（2.1）はまだ。
3. 単位の種類を 4 つ足した（[recordTypes.ts](../src/analyzer/types/metadata/recordTypes.ts) の表、[record.ts](../src/analyzer/parser/Metadata/record.ts)・[folders.ts](../src/analyzer/parser/Metadata/folders.ts)・Diff の一覧・package.xml の型名）。サンプルは `repository/{before,after}` の各フォルダ。
    - `messageChannel`（`messageChannels/<名前>.messageChannel-meta.xml`）。項目は子 `lightningMessageFields`（kind `messageChannelField`）。名前は `__c` なし（ファイル名）で、LWC の import の参照も `__c` を除くので突き合う。
    - `externalCredential`（`externalCredentials/`）。指定ログイン情報の `namedCredentialParameters.externalCredential` から参照を作る（`analyzeMetadataReferences` でも確かめる）。
    - `customNotificationType`（`notificationtypes/<名前>.notiftype-meta.xml`）。Flow・Apex は Id で使うので、名前の参照はまだない。
    - `reportType`（`reportTypes/`）。`join` は値の木、`sections` は子（列は値の木）。レポートの `reportType` が `<名前>__c` のとき `reportType:<名前>` を参照にする。レポートタイプの列の項目への参照はまだ。
    - 権限の `externalCredentialPrincipalAccesses`（4.4）はまだ。

ほかに見つけて直したもの: LWC の `@api` のプロパティの定義（`lwcProperty`）が、グラフに一度も作られていなかった。[units.ts](../src/analyzer/processor/dependency/units.ts) がデコレーターを `member.decorators` / `member.decorator` から探していたが、LWC の JSON では `modifier.decorator`（getter / setter は `getterContent` / `setterContent` の `modifier.decorator`）にある。そちらから探すようにした（4.2 の「子の `@api` への参照」はまだ）。

## 7. 対応したこと（2026-11-10、5 章の 4〜6）

保存の形が変わったので `SAVE_FORMAT_VERSION` を 6 にした。

### 7.1 Apex（5 章の 4。[apex.ts](../src/analyzer/processor/dependency/apex.ts)、テストは [apex-string-refs.test.ts](../test/dependency/apex-string-refs.test.ts)）

文字列はリテラルのときだけ参照にする（変数・連結・バインドは推測しない）。名前空間つきの呼び出し（パッケージのもの）は取らない。

| 書き方                                                                   | 参照（種類:名前、kind、via）                              |
| ------------------------------------------------------------------------ | --------------------------------------------------------- |
| `Page.X`・`System.Page.X`                                                | `visualforcePage:X`（`apexPage` に解決）、`uses`、`Page`  |
| `new PageReference('/apex/X')`                                           | `visualforcePage:X`、`uses`、`PageReference`              |
| `PageReference.forResource('X')`、`FROM StaticResource WHERE Name = 'X'` | `staticResource:X`、`uses`                                |
| `Type.forName('X')`                                                      | `apexType:X`（クラスがあれば `apexClass` に解決）、`uses` |
| `'callout:X/...'`                                                        | `namedCredential:X`、`uses`、`callout`                    |
| `new Flow.Interview.X(...)`・`Flow.Interview.createInterview('X', ...)`  | `flow:X`、`calls`（変数の型は `uses`）                    |
| `EventBus.publish(...)`（`X__e`）                                        | `object:X__e`、**`publishes`**（新しい kind）             |
| `Label.get('', 'X')`                                                     | `customLabel:X`、`uses`                                   |

### 7.2 LWC（5 章の 5 の LWC。[units.ts](../src/analyzer/processor/dependency/units.ts) の `getLwcDependencies`、テストは [lwc-refs.test.ts](../test/dependency/lwc-refs.test.ts)）

- `js-meta.xml`: `objects/object` → `object`、`datasource="apex://C"`・`type="apex://C"` → `apexClass`、`type="@salesforce/schema/X"` → `object`。
- テンプレートの `<c-child foo={x}>`（静的な値も）→ `lwcProperty:child.foo`（`writes`）。HTML 共通の属性（`title`・`aria-*` など）は除く。子のコンポーネント自体がないときは `UNKNOWN_LWC` だけを出し、`UNKNOWN_LWC_PROPERTY` は重ねない（[graph.ts](../src/analyzer/processor/dependency/graph.ts)）。
- `@salesforce/apexContinuation/Class.method` → `apexMethod`（`calls`）。
- `lightning/ui*` の `@wire` の設定の文字列: `fields`・`optionalFields` → `field`（`reads`）、`fieldApiName` → `field`、`objectApiName` → `object`。

### 7.3 メタデータ（5 章の 5・6 と、1〜3 で残したもの。テストは [metadata-refs.test.ts](../test/dependency/metadata-refs.test.ts)）

- 権限: `customSettingAccesses`・`customMetadataTypeAccesses` → `object`、`flowAccesses` → `flow`、`externalCredentialPrincipalAccesses` → `externalCredential`、`externalDataSourceAccesses` → `externalDataSource`（どれも `grants`）。
- Flow: `actionCalls` の `emailAlert` → `workflowAlert:<オブジェクト>.<名前>`、`quickAction`、`externalService` → `externalServiceRegistration`（定義する単位はない）。`CustomNotificationType` を `DeveloperName` で取る `recordLookups` → `customNotificationType`。条件などの `$Permission` → `customPermission`、`$Setup` → `object`・`field`、`$CustomMetadata` → `customMetadata`・`field`。ワークフローのアラートと `matchingRule` を定義にした。
- プラットフォームイベント: オブジェクトの JSON に `eventType`・`publishBehavior` を足した。
- レポートタイプ: `baseObject` → `object`、列（`table` が `.` を含まないもの）→ `field`。
- Aura: `lightning:messageChannel type="X__c"` → `messageChannel:X`（JSON に `messageChannels` を足した）。
- オブジェクトの翻訳: 定義 `objectTranslation:<id>` と、オブジェクト・項目・レコードタイプ・入力規則などへの参照（`uses`）。
- 単位の種類を 12 足した: `assignmentRules`・`autoResponseRules`・`escalationRules`・`pathAssistant`・`duplicateRule`・`matchingRules`・`platformEventChannel`・`platformEventChannelMember`・`platformEventSubscriberConfig`・`cspTrustedSite`・`externalDataSource`（表の種類）と `settings`（`settings/<名前>.settings-meta.xml`。JSON は `{ fullName, properties }`。[settings.ts](../src/analyzer/types/metadata/settings.ts)）。

### 7.4 対応しなかったもの

- Apex: 動的 SOQL（[analysis-plan.md](./analysis-plan.md) で計画済み）、`Schema.getGlobalDescribe().get('X')`、`rec.get/put('Field')`、変数で渡す `FeatureManagement.checkPermission`、`.` でつないだ型の参照（`Flow.Interview.X` 以外）。
- LWC: テンプレートの式の値の解決（`field-name={nameField}`）、`@salesforce/contentAssetUrl/`、名前空間つきの `@salesforce/label/`、`@salesforce/userPermission/`、`lightning/navigation` の行き先、`lightning/ui*` 以外のアダプターの設定。JS の式を JSON に持つ設計は [lwc-json-types.md](./lwc-json-types.md)。
- メタデータ: Flow の `submit`（承認プロセスの名前の形が合わない）、Id を直接書いたカスタム通知、レポートタイプの関係をたどった列、重複ルールの条件の項目、設定（settings）の中の参照、権限の `emailRoutingAddressAccesses` などの定義のない行、ConnectedApp・Letterhead・Document・ContentAsset・Experience（新しい parser の設計が要る）。
