# メタデータ（優先度 B・C）の実装

[metadata-roadmap.md](./metadata-roadmap.md) の優先度 B・C のメタデータの解析木（JSON）と Diff。読み込み・保存・worker は優先度 A と同じフォルダ単位の仕組み（[metadata-a-plan.md](./metadata-a-plan.md) 2 章）を使う。サンプルと出力は [examples/metadata/](./examples/metadata/README.md) の `run-folders.ts`。

**種類をまたぐ参照**（タブ → LWC、Visualforce → Apex、差し込み `{!...}` の項目・ラベルなど）は、この段階では取り出さない。すべての種類を読めるようになってから、参照の取り出しと突き合わせ（`MetadataContext`）をまとめて対応する。参照の確かめは、すべてを parse したあとに解析で行うので、parse の順番には依らない（確かめられるかどうかは、参照先の種類を読んでいるかで決まる）。

## 1. 対象

| 優先度 | 種類                               | フォルダ・ファイル                                                                                               | id（保存名）                                                        | 名前で対応付ける子（kind）                                                                                                                              |
| ------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B      | カスタムメタデータのレコード       | `customMetadata/<型>.<レコード>.md-meta.xml`                                                                     | `customMetadata_<型>.<レコード>`                                    | `values`（`customMetadataValue`。キー `field`）                                                                                                         |
| B      | CustomTab                          | `tabs/<名前>.tab-meta.xml`                                                                                       | `customTab_<名前>`                                                  | —                                                                                                                                                       |
| B      | CustomApplication                  | `applications/<名前>.app-meta.xml`                                                                               | `customApplication_<名前>`                                          | `actionOverrides`・`profileActionOverrides`                                                                                                             |
| B      | GlobalValueSet / StandardValueSet  | `globalValueSets/` / `standardValueSets/`                                                                        | `globalValueSet_<名前>` / `standardValueSet_<名前>`                 | `customValue` / `standardValue`（キー `fullName`）                                                                                                      |
| B      | CustomPermission                   | `customPermissions/<名前>.customPermission-meta.xml`                                                             | `customPermission_<名前>`                                           | `requiredPermission`（キー `customPermission`）                                                                                                         |
| B      | QuickAction                        | `quickActions/<名前>.quickAction-meta.xml`                                                                       | `quickAction_<名前>`                                                | `fieldOverrides`（キー `field`）                                                                                                                        |
| B      | 共有ルール                         | `sharingRules/<オブジェクト>.sharingRules-meta.xml`                                                              | `sharingRules_<オブジェクト>`                                       | `sharingCriteriaRules`・`sharingOwnerRules`・`sharingGuestRules`・`sharingTerritoryRules`（キー `fullName`）                                            |
| B      | Visualforce ページ・コンポーネント | `pages/<名前>.page-meta.xml` + `.page`、`components/<名前>.component-meta.xml` + `.component`                    | `apexPage_<名前>` / `apexComponent_<名前>`                          | 本体の `apex:attribute`（`visualforceAttribute`）                                                                                                       |
| B      | Aura                               | `aura/<名前>/`（バンドル）                                                                                       | `aura_<名前>`                                                       | `aura:attribute`・`aura:registerEvent`・`aura:handler`・`aura:method`（キー `name`）                                                                    |
| C      | 静的リソース                       | `staticresources/<名前>.resource-meta.xml`                                                                       | `staticResource_<名前>`                                             | —（中身のファイルは読まない）                                                                                                                           |
| C      | メールテンプレート                 | `email/<フォルダ>/<名前>.email-meta.xml` + `.email`                                                              | `emailTemplate_<フォルダ>.<名前>`                                   | —（本文はそのままの文字列）                                                                                                                             |
| C      | レポート・ダッシュボード           | `reports/<フォルダ>/<名前>.report-meta.xml`、`dashboards/<フォルダ>/…`                                           | `report_<フォルダ>.<名前>` / `dashboard_…`                          | レポートの `columns`（キー `field`）                                                                                                                    |
| C      | 組織全体の翻訳                     | `translations/<言語>.translation-meta.xml`                                                                       | `translations_<言語>`                                               | `customLabels`・`customTabs`・`customApplications`・`quickActions`・`reportTypes`・`customPageWebLinks`（キー `name`）、`flowDefinitions`（`fullName`） |
| C      | 指定ログイン情報・リモートサイト   | `namedCredentials/` / `remoteSiteSettings/<名前>.remoteSite-meta.xml`                                            | `namedCredential_<名前>` / `remoteSiteSetting_<名前>`               | `namedCredentialParameters`（キー `parameterName` + `parameterType`）                                                                                   |
| C      | ワークフロールール・承認プロセス   | `workflows/<オブジェクト>.workflow-meta.xml`、`approvalProcesses/<オブジェクト>.<名前>.approvalProcess-meta.xml` | `workflow_<オブジェクト>` / `approvalProcess_<オブジェクト>.<名前>` | `alerts`・`fieldUpdates`・`outboundMessages`・`rules`・`tasks`（`fullName`）/ `approvalStep`（`name`）                                                  |
| C      | キュー・グループ・ロール           | `queues/` / `groups/` / `roles/`                                                                                 | `queue_<名前>` / `group_<名前>` / `role_<名前>`                     | キューの `queueSobject`（キー `sobjectType`）                                                                                                           |

## 2. 共通の仕組み

### 2.1 種類ごとの型（`types/metadata/record.ts`・`recordTypes.ts`）

XML の種類は、**種類ごとの表（`RecordSpec`）を書き、JSON と型の両方を表から作る**。型は表から導く（`RecordJson<typeof 表>`。`GlobalValueSetJson`・`SharingRulesJson` など、種類ごとに名前を付けて公開する）。

```ts
// types/metadata/recordTypes.ts
export const GLOBAL_VALUE_SET_SPEC = {
    kind: 'globalValueSet',
    root: 'GlobalValueSet', // ルート要素
    schema: { masterLabel: 'string', description: 'string', sorted: 'boolean' }, // 値の要素
    children: {
        // 名前で対応付ける子 (D)
        customValue: { kind: 'globalValue', key: ['fullName'], schema: VALUE_SCHEMA },
    },
} as const satisfies RecordSpec;
export type GlobalValueSetJson = RecordJson<typeof GLOBAL_VALUE_SET_SPEC>;
// → { kind: 'globalValueSet'; sourceKeys; fullName: string; masterLabel?: string; sorted?: boolean;
//     customValue?: { kind: 'globalValue'; sourceKeys; fullName?: string; label?: string; default?: boolean; ... }[];
//     skippedElements?: string[] }
```

| 表の項目         | JSON                                                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema`         | 値の要素。XML の要素名をプロパティ名にし、真偽値・数値は型をそろえる（優先度 A と同じ `readProperties`）。ファイルにないものは持たない              |
| `lists`          | 繰り返す値の要素（アプリのタブなど）。1 つでも文字列の配列                                                                                          |
| `trees`          | 入れ子の構造の要素（共有先・条件の行・クイックアクションのレイアウトなど）。値の木（`types/commons/valueTree.ts`）のまま持つ。`'many'` はいつも配列 |
| `children`       | 名前で対応付ける子。要素名のプロパティに子の並び（`kind`・`sourceKeys` を持つ JSON ノード）。子も同じ形の表（`key` は対応付けのキー）               |
| （表にない要素） | `skippedElements` に名前を残す（ルート・子それぞれ）。読む要素を足すときは表に 1 行足す                                                             |

- ファイルの名前は `fullName`（ファイル名から接尾辞を除いたもの。入れ子のフォルダは `<フォルダ>/<名前>`）。レポート・メールテンプレート・キュー・グループ・ロールは XML の `<name>`（表示名）を持つので、優先度 A の `name` とは分けた。
- キーの作り方は Apex・LWC・優先度 A と同じ（`makeMetadataJson`）。子の並びは XML の順のまま。
- 値の木の値: 子のない要素は文字列（`true` / `false` は真偽値）、属性があれば `{ '#text', '@属性名' }`（カスタムメタデータの値の `xsi:type` / `xsi:nil`）。

### 2.2 parser（`parser/Metadata/folder.ts`・`record.ts`）

`MetadataFolderSpec` に、フォルダの中の並びと、一緒に読むファイルを足した。

| 設定               | 内容                                                                                                                                                                                                 | 使う種類                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `layout: 'file'`   | 直下のファイルが 1 単位（既定）                                                                                                                                                                      | ほとんど                                                              |
| `layout: 'nested'` | `<フォルダ>/<サブフォルダ>/` のファイルが 1 単位。名前は `<サブフォルダ>/<名前>`、id・保存名は `/` を `.` にする。フォルダ自体の `-meta.xml`（`reports/<フォルダ>.reportFolder-meta.xml`）は読まない | レポート・ダッシュボード・メールテンプレート                          |
| `layout: 'bundle'` | サブフォルダが 1 単位。`bundleMain` の拡張子（`<バンドル名>.cmp` など）がメインのファイルで、ほかのファイルはすべて `extras`                                                                         | Aura                                                                  |
| `companions`       | 単位のファイルと一緒に読むファイルの接尾辞（`suffix` を置き換えた名前）。`make` の 4 つめの引数（`extras`）に渡す                                                                                    | Visualforce（`.page` / `.component`）、メールテンプレート（`.email`） |

worker・保存・読み込みは優先度 A と同じ（`MetadataFolderWorker`。種類はフォルダ名・保存名の接頭辞で決める。`METADATA_FOLDER_PARSERS` に足した）。

### 2.3 Diff（`processor/Metadata/diff/record.ts`）

差分も表から作る（`makeRecordDiff(表)`）。型は `RecordJsonDiff<typeof 表>`。

| 対象              | 分類                                                          |
| ----------------- | ------------------------------------------------------------- |
| `schema` の値     | 値ごと（`makePropertiesDiff`）                                |
| `lists`           | 書いた順（C）                                                 |
| `trees`           | `'one'` は値として、`'many'` は書いた順（C）                  |
| `children`        | 要素名ごとに `key` で対応付ける（D）。キーがない子は集合（B） |
| `skippedElements` | 集合（B）                                                     |

種類ごとの単位の差分は `diff/metadataFile.ts` の `make<種類>UnitDiffs`（`makeGlobalValueSetUnitDiffs` など）。種類 → 単位の差分の一覧は `METADATA_UNIT_DIFFS`（優先度 A の種類も含む。`run-folders.ts` とテストはこの一覧で回す）。

parser の一覧（`METADATA_FOLDER_PARSERS`）と単位の差分の一覧の型は、どの種類も入る型に広げている。種類ごとの parser の型の共用体にすると、`map` などで「複雑すぎて表現できない共用体型」（TS2590）になるため。種類ごとの型が要るときは、種類ごとの parser（`GlobalValueSetParser` など）と `make<種類>UnitDiffs` を直接使う。

## 3. 本体のファイルを伴う種類・バンドル（`types/metadata/markup.ts`）

本体のマークアップは**構造だけ**を JSON にする（差し込み `{!...}` などの参照は、参照の対応でまとめて扱う）。

| 種類               | JSON                                                                                                                                                                                                                                                                                                                                                                                                   | Diff                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Visualforce        | `-meta.xml` の値（表 `APEX_PAGE_META_SPEC` / `APEX_COMPONENT_META_SPEC`。型は `ApexPageJson` / `ApexComponentJson`）と `markup`（kind `visualforceMarkup`: ルートのタグ・属性（`controller`・`standardController`・`extensions` など）、使っている部品のタグ（`components`）、`apex:attribute`）。本体が XML として読めなければ `markup` は `error`（`-meta.xml` の値は読む）                          | 属性は名前ごと、部品は集合（B）、`apex:attribute` は名前で D         |
| メールテンプレート | `-meta.xml` の値（件名・種類など）と本文（`body`。そのままの文字列）                                                                                                                                                                                                                                                                                                                                   | 本文は値として比べる                                                 |
| Aura               | kind `auraBundle`: バンドルの種類（`cmp` / `app` / `evt` / `intf` / `tokens`）、ルートの属性（`controller`・`implements`・`extends`・`access`）、宣言（`aura:attribute` など。名前と属性）、`aura:dependency`、使っている部品のタグ、JS（`Controller.js` / `Helper.js` / `Renderer.js`）の関数の名前、バンドルの中のファイル、`-meta.xml` の値。メインのマークアップが読めなければバンドルごと `error` | 宣言は名前で D、部品・ファイルは集合（B）、関数の名前は書いた順（C） |

## 4. 決めたこと・方針から変えたこと

| 項目                               | 内容                                                                                                                                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| カスタムメタデータのレコードの単位 | ロードマップの案（型ごと）ではなく、**レコード（ファイル）ごと**にした。フォルダ単位の仕組み（1 ファイル = 1 単位）のままにするため。型ごとにまとめた表示は、解析・レポートで組み立てる |
| 種類ごとの JSON の型               | 種類ごとに表を書き、型も表から作る（2.1）。入れ子の構造（共有先・条件の行など）は値の木のまま                                                                                           |
| Visualforce・Aura の本体           | 構造だけ（ルートの属性・部品・宣言）。文やテンプレートの中身の木は作らない（Apex・LWC のような詳しい解析は、必要になったら）                                                            |
| Aura の JS                         | 関数の名前だけ（LWC の JS の解析は使わない。Aura の JS はオブジェクトリテラルの関数の並びなので）                                                                                       |
| 静的リソース                       | `-meta.xml` だけ（中身はバイナリ・zip のことが多いので読まない）                                                                                                                        |
| レポート・ダッシュボードのフォルダ | フォルダの `-meta.xml`（`reportFolder` など）は読まない                                                                                                                                 |

## 5. ファイル構成

```text
src/analyzer/
├── types/commons/valueTree.ts     値の木 (toValueTree)
├── types/metadata/
│   ├── record.ts                  種類の表 (RecordSpec) から JSON・型を作る部品 (makeRecordJson・RecordJson)
│   ├── recordTypes.ts             種類ごとの表と型 (GLOBAL_VALUE_SET_SPEC・GlobalValueSetJson など)
│   └── markup.ts                  Visualforce・メールテンプレート・Aura
├── parser/Metadata/
│   ├── folder.ts                  layout (file / nested / bundle)・companions
│   ├── record.ts                  種類ごとの parser (GlobalValueSetParser・ApexPageParser・AuraParser など)
│   └── folders.ts                 METADATA_FOLDER_PARSERS (すべての種類)
└── processor/Metadata/diff/
    ├── record.ts                  表から差分を作る部品 (makeRecordDiff・RecordJsonDiff)・マークアップの差分
    └── metadataFile.ts            種類ごとの単位の差分 (make<種類>UnitDiffs)・METADATA_UNIT_DIFFS
test/processor/metadata-bc.test.ts
```

## 6. 残り

- **参照の取り出しと突き合わせ**（すべての種類が読めたので、次の段階）: タブ・アプリ → オブジェクト・LWC・Visualforce・Lightning ページ、Visualforce → Apex（コントローラー・拡張）・項目・ラベル・部品、Aura → Apex（`controller`）・LWC / Aura の部品・ラベル、クイックアクション → オブジェクト・項目・LWC・Flow、共有ルール → ロール・グループ・項目、ワークフロー・承認 → 項目・メールテンプレート、カスタムメタデータのレコード → 型の項目、組織全体の翻訳 → ラベル・タブ・アプリ（翻訳の網羅）、グローバル値セット → それを使う項目。あわせて、優先度 A の解析で今は確かめられない参照（カスタム権限・タブ・アプリ・クイックアクション）を確かめる。
- オブジェクトの読んでいない子（ビジネスプロセス・検索レイアウトなど）と、オブジェクト・翻訳の文字列からの parse（[metadata-roadmap.md](./metadata-roadmap.md) 3 章）。
