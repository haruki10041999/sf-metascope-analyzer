# メタデータ（優先度 A）の実装

[metadata-roadmap.md](./metadata-roadmap.md) の優先度 A（権限・カスタム表示ラベル・Flow・画面）の解析木（JSON）・Diff・解析の実装。**すべて実装済み**（10 章）。サンプルと出力は [examples/metadata/](./examples/metadata/README.md) の `run-folders.ts`。レポートでの使い方は [report-components-plan.md](./report-components-plan.md) 2.5〜2.8 章。

## 1. 対象と順番

| 順  | 種類                                       | フォルダ・ファイル                                                                                         | 理由                                                                                            |
| --- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | **PermissionSet**・**MutingPermissionSet** | `permissionsets/<名前>.permissionset-meta.xml`、`mutingpermissionsets/<名前>.mutingpermissionset-meta.xml` | 構造が平らで作りやすい。オブジェクト・項目・Apex との突き合わせ（誰が何をできるか）がすぐ使える |
| 2   | **Profile**                                | `profiles/<名前>.profile-meta.xml`                                                                         | 1 と同じ型に、Profile にしかない要素を足すだけ                                                  |
| 3   | **PermissionSetGroup**                     | `permissionsetgroups/<名前>.permissionsetgroup-meta.xml`                                                   | 1 の権限セットを合わせた「実際の権限」の計算（ミュートを含む）                                  |
| 4   | **CustomLabels**                           | `labels/CustomLabels.labels-meta.xml`                                                                      | 小さい。Apex・LWC からの参照（LWC は import が読めている）をつなぐ                              |
| 5   | **Flow**                                   | `flows/<名前>.flow-meta.xml`                                                                               | 自動化の変更はレビューで重要。要素と接続の図、項目・Apex・LWC への参照                          |
| 6   | **Layout**                                 | `layouts/<オブジェクト>-<名前>.layout-meta.xml`                                                            | 項目がどの画面に出ているか。Profile のレイアウトの割り当てとつなぐ                              |
| 7   | **FlexiPage**                              | `flexipages/<名前>.flexipage-meta.xml`                                                                     | LWC がどのページに置かれているか（LWC の `targetConfigs` と突き合わせる）                       |

## 2. 共通の方針

### 2.1 読み方と単位

- **XML の木から直接 JSON を作る**（オブジェクトと同じ。中間表現は作らない）。部品は `types/commons/xmlJson.ts`（`readXmlRoot`・`readProperties`・`makeMetadataJson`・`unknownChildNames`）。
- **読み込み（parser・worker）はフォルダ単位、保存・Diff はファイル単位**。worker のタスクは種類のフォルダ 1 つ（`permissionsets/` など）で、その中のファイルをまとめて読む。結果はファイルごとに 1 つ（1 ファイル = 1 単位 = 1 解析結果 = 1 保存ファイル）。
- parser は**種類（フォルダ）ごと**に用意し、共通の流れ（フォルダを探す・ファイルを並べる・XML を読む・保存・読み込み）は `MetadataFolderParser`（`parser/Metadata/folder.ts`）にまとめる。種類ごとの違いは設定（`MetadataFolderSpec`。ルート要素の確かめと JSON の作り方は `make`）だけで、種類ごとの parser はその設定で作ったインスタンス。

```ts
// parser/Metadata/permission.ts
export const PermissionSetParser = new MetadataFolderParser({
    type: 'permissionSet', // 解析結果の dataType、保存名・id の接頭辞 (permissionSet_)
    folder: 'permissionsets',
    suffix: '.permissionset-meta.xml',
    make: makePermissionSetJson, // types/metadata/permission.ts
});

// MetadataFolderParser の入口
PermissionSetParser.searchFolders(rootDir); // <パッケージ>/main/default/permissionsets など
PermissionSetParser.parseFolder(dir); // フォルダの中の *.permissionset-meta.xml すべて (ファイルごとの結果)
PermissionSetParser.parseAll(rootDir); // searchFolders + parseFolder
PermissionSetParser.parseSource(filePath, source); // ファイルを読まない入口 (git の before 側など)
PermissionSetParser.save(baseDir, result); // <baseDir>/permissionSet_<名前>.msgpack (saveForDevelopper は .json)
PermissionSetParser.read(baseDir, id); // readSaved(baseDir) はこの種類のものをすべて
```

種類ごとの parser: `PermissionSetParser`・`MutingPermissionSetParser`・`ProfileParser`・`PermissionSetGroupParser`（`permission.ts`）、`CustomLabelsParser`（`customLabels.ts`）、`FlowParser`（`flow.ts`）、`LayoutParser`・`FlexiPageParser`（`page.ts`）。一覧は `folders.ts` の `METADATA_FOLDER_PARSERS`（フォルダ名・保存名から parser を選ぶ `findParserByFolder` / `findParserBySaveId`）。

| 項目               | 方針                                                                                                                                                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 解析結果           | `MetadataFileParseResult`（`{ filePath, resolvedError, dataType: <種類> \| 'error', result: { id, base, sourceObject } }`）。読めない・ルート要素が違うときは `error`                                                                                                           |
| id・保存名         | `<種類>_<名前>`（`permissionSet_Sales`、`flow_Invoice_Approval`、`layout_Account-Account Layout`）。オブジェクトの `readSavedObjects` が除く接頭辞にも足す                                                                                                                      |
| worker             | `WorkerTaskType` に `'MetadataFolder'` を足した。タスクは種類のフォルダのパスで、種類はフォルダ名で決める。parse の結果・保存の要約はファイルごとの並び。`MetadataFolderWorker`（種類ごとに worker のクラスは作らない）。`loadAll` はフォルダ単位のメタデータの保存名だけを読む |
| Diff               | 単位は `makeIdUnitDiffs`（id で対応付け）。中は種類ごとの `make*Diff`                                                                                                                                                                                                           |
| 文字列からの parse | ファイルを読まない入口 `parseSource(filePath, source)`（git の before 側を読むため）                                                                                                                                                                                            |
| 種類をまたぐ参照   | 解析で確かめる。共通の部品は `processor/Metadata/references.ts`（`MetadataContext`・`makeReferenceChecker`・LWC の `lwcContextOf`）                                                                                                                                             |

### 2.2 JSON の約束

- 値は XML の要素名をプロパティ名にし、ファイルにないものは持たない。真偽値・数値は型をそろえる（`readProperties` のスキーマ）。
- 子の行（権限の 1 行、Flow の要素、レイアウトの項目など）は `kind` と `sourceKeys` を持つ JSON ノードにする（Diff・レポートでその行の位置を示すため）。
- **objectKey・sourceKey の作り方は Apex・LWC と同じ**（`makeSpanJson` の既定: objectKey = `<kind>_<hash(sortKeys(sourceKeys を除いた中身))>`、sourceKey = `<kind>_<hash(ファイルのパス + 位置)>`。配列は書いた順のまま）。オブジェクト（`makeXmlJson` は書いた順のまま hash）には合わせない。新しい種類用に `makeMetadataJson`（`makeSpanJson` を XML の要素の位置で呼ぶもの）を `xmlJson.ts` に足す。
- 子の並びは XML の順のまま持つ（並べ替えない。Apex・LWC と同じ）。並び順に意味がないものの順序の変化は Diff の側で出さない（2.3）。
- スキーマにない要素（Salesforce が新しく足した要素など）は、**名前を `skippedElements` に残す**（何を見ていないかが分かるように。LWC の `skippedFiles` と同じ考え方）。

### 2.3 Diff・解析の約束

- 子は名前（下の各章の「キー」）で対応付ける（D）。値は `makePropertiesDiff`。並び順に意味がないもの（XML の順はツールが決める）は順序の変化を出さない。
- 種類をまたぐ突き合わせ（権限 → オブジェクト・項目・Apex、Flow → 項目・Apex・LWC、FlexiPage → LWC）は保存する JSON に入れず、**解析**（`processor/Metadata/<種類>Analysis.ts`）で行う（LWC の `analyzeLwcBundles` と同じ。ほかの単位の変更で結果が変わるため）。
- 標準オブジェクト・標準項目はリポジトリにファイルがないのが普通なので、「ない」とは言わない（LWC の解析と同じ。カスタムのものだけ確かめる）。

## 3. 権限（PermissionSet / MutingPermissionSet / Profile）

### 3.1 JSON

PermissionSet・MutingPermissionSet・Profile は**同じ型**（`PermissionsJson`）で読み、Profile にしかない要素を足す。

| kind（子の行）                                     | XML の要素                                             | キー                               | 値                                                                                                                  |
| -------------------------------------------------- | ------------------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `objectPermission`                                 | `objectPermissions`                                    | `object`                           | `allowCreate` / `allowRead` / `allowEdit` / `allowDelete` / `viewAllRecords` / `modifyAllRecords` / `viewAllFields` |
| `fieldPermission`                                  | `fieldPermissions`                                     | `field`（`Account.Tier__c`）       | `readable` / `editable`                                                                                             |
| `classAccess`                                      | `classAccesses`                                        | `apexClass`                        | `enabled`                                                                                                           |
| `pageAccess`                                       | `pageAccesses`                                         | `apexPage`                         | `enabled`                                                                                                           |
| `flowAccess`                                       | `flowAccesses`                                         | `flow`                             | `enabled`                                                                                                           |
| `customPermissionAccess`                           | `customPermissions`                                    | `name`                             | `enabled`                                                                                                           |
| `customMetadataTypeAccess` / `customSettingAccess` | `customMetadataTypeAccesses` / `customSettingAccesses` | `name`                             | `enabled`                                                                                                           |
| `tabSetting`                                       | `tabSettings`（Profile は `tabVisibilities`）          | `tab`                              | `visibility`                                                                                                        |
| `applicationVisibility`                            | `applicationVisibilities`                              | `application`                      | `visible` / `default`                                                                                               |
| `recordTypeVisibility`                             | `recordTypeVisibilities`                               | `recordType`（`Account.Business`） | `visible` / `default` / `personAccountDefault`                                                                      |
| `userPermission`                                   | `userPermissions`                                      | `name`（`ModifyAllData` など）     | `enabled`                                                                                                           |
| `layoutAssignment`（Profile）                      | `layoutAssignments`                                    | `layout` + `recordType`            | —                                                                                                                   |

- ルート（`permissionSet` / `mutingPermissionSet` / `profile`）の値: `label`、`description`、`license` / `userLicense`、`hasActivationRequired`、`custom`（Profile）。
- **Profile はすべての要素を読む**。上の表に加えて、次の要素も JSON にする（PermissionSet にもある要素は PermissionSet でも読む）:

| kind（子の行）                                       | XML の要素                            | キー                                                             | 値                                                                      |
| ---------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `loginIpRange`（Profile）                            | `loginIpRanges`                       | `startAddress` + `endAddress`                                    | `description`                                                           |
| `loginHours`（Profile。1 つ）                        | `loginHours`                          | —                                                                | `mondayStart` / `mondayEnd` … `sundayEnd`（分）                         |
| `loginFlow`（Profile）                               | `loginFlows`                          | `flow` / `vfFlowPage`                                            | `flowType` / `friendlyName` / `uiLoginFlowType` / `useLightningRuntime` |
| `profileActionOverride`（Profile）                   | `profileActionOverrides`              | `pageOrSobjectType` + `recordType` + `formFactor` + `actionName` | `content`（FlexiPage の名前）/ `type`                                   |
| `categoryGroupVisibility`（Profile）                 | `categoryGroupVisibilities`           | `dataCategoryGroup`                                              | `visibility` / `dataCategories`（集合）                                 |
| `externalDataSourceAccess`                           | `externalDataSourceAccesses`          | `externalDataSource`                                             | `enabled`                                                               |
| `externalCredentialPrincipalAccess`（PermissionSet） | `externalCredentialPrincipalAccesses` | `externalCredentialPrincipal`                                    | `enabled`                                                               |
| `emailRoutingAddressAccess`                          | `emailRoutingAddressAccesses`         | `emailRoutingAddress`                                            | `enabled`                                                               |
| `servicePresenceStatusAccess`                        | `servicePresenceStatusAccesses`       | `servicePresenceStatus`                                          | `enabled`                                                               |
| `agentAccess` など、`<名前>Accesses` の形の要素      | `*Accesses`                           | 対象の名前                                                       | `enabled`                                                               |

- `*Accesses`（対象の名前 + `enabled`）は形が同じなので、要素名と対象のキーの表（スキーマ）で読む。Salesforce が新しく足したものはその表に 1 行足せばよい。表にない要素は `skippedElements`（2.2）。
- 解析では、`loginFlows` は Flow へ、`profileActionOverrides` は FlexiPage（8 章）への参照として扱う。

- SFDX で取り出した Profile は、リポジトリにあるメタデータに関係する部分だけを持つことが多い。**ファイルに書いてあるものだけを比べ、書いていない権限を「なし」とは扱わない**（レポートでもそう表示する）。

### 3.2 Diff

ルートの値は `makePropertiesDiff`、子の配列はキーで D。キーを持つ子の値は `makePropertiesDiff`（`allowEdit: false → true` のように 1 つずつ出る）。

### 3.3 解析（`processor/Metadata/permissionAnalysis.ts` の `analyzePermissions`）

| 解析                   | 内容                                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 権限の表               | 権限セット・Profile × オブジェクト（CRUD）・項目（参照・編集）・Apex クラス・カスタム権限。レポートの `ObjectAccessMatrix` / `FieldAccessMatrix` のもと                  |
| 実際の権限（グループ） | 権限セットグループ = 含む権限セットの和 − ミュート権限セット（4 章）                                                                                                     |
| 参照先の確認           | カスタムのオブジェクト・項目・Apex クラス・カスタム権限・レコードタイプ・レイアウトが、リポジトリの解析結果にあるか（標準のものは確かめない）                            |
| 矛盾                   | 参照なしの編集（`editable` で `readable` でない）、オブジェクトの参照権限なしの項目権限、`modifyAllRecords` で `allowEdit` でないなど（Salesforce がデプロイで弾くもの） |
| 強い権限               | `ModifyAllData`・`ViewAllData`・`ManageUsers`・`AuthorApex`・`CustomizeApplication` など、レビューで目立たせる `userPermission` の一覧（表で持つ）                       |

## 4. PermissionSetGroup

| 要素                             | JSON                                                                 |
| -------------------------------- | -------------------------------------------------------------------- |
| `label`・`description`・`status` | 値                                                                   |
| `permissionSets`                 | 含む権限セットの名前の集合（B）                                      |
| `mutingPermissionSets`           | ミュート権限セットの名前の集合（B）。MutingPermissionSet は 3 章の型 |

解析: 含む権限セット・ミュート権限セットがリポジトリにあるか。実際の権限の計算（3.3）。

## 5. CustomLabels

| 要素（`labels` の 1 件）                             | JSON（kind `customLabel`。キー `fullName`） |
| ---------------------------------------------------- | ------------------------------------------- |
| `fullName`                                           | 名前                                        |
| `value`・`language`・`protected`・`shortDescription` | 値                                          |
| `categories`                                         | カンマで分けた集合（B）                     |

- **単位はファイル 1 つ**（`customLabels_CustomLabels`）、ラベルは子（D）にする。Diff はラベルごとに出るので、ラベルごとの単位にしなくても粒度は同じ。保存ファイルが 1 ラベル 1 ファイルになるのを避ける。
- 解析（`processor/Metadata/labelAnalysis.ts`）: ラベルの使用箇所（LWC の `@salesforce/label/c.<名前>`、Apex の `System.Label.<名前>` / `Label.<名前>`、Flow の `$Label.<名前>`）、使われていないラベル、ないラベルへの参照。Apex は式の JSON（`memberAccess` の名前の並び）から探す。

## 6. Flow

### 6.1 JSON

| 部分         | XML の要素                                                                                                                                                                                                                                         | JSON                                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| ルート       | `label`・`apiVersion`・`processType`・`status`・`description`・`runInMode`                                                                                                                                                                         | kind `flow`。値                                                                                                                        |
| 起動         | `start`（`object`・`triggerType`・`recordTriggerType`・`filterLogic`・`filters`・`schedule`・`scheduledPaths`・`connector`）                                                                                                                       | kind `flowStart`。レコードトリガーの対象と条件、スケジュール                                                                           |
| 要素         | `actionCalls`・`apexPluginCalls`・`assignments`・`collectionProcessors`・`customErrors`・`decisions`・`loops`・`recordCreates`・`recordDeletes`・`recordLookups`・`recordUpdates`・`recordRollbacks`・`screens`・`subflows`・`transforms`・`waits` | kind は要素の種類ごと（`flowDecision`・`flowRecordUpdate` など）。共通: `name`（キー）・`label`・`description`。種類ごとの値（下の表） |
| 資源         | `variables`・`constants`・`formulas`・`textTemplates`・`choices`・`dynamicChoiceSets`                                                                                                                                                              | kind `flowVariable` など。`name`（キー）・`dataType`・`objectType`・`isInput` / `isOutput`・`isCollection`・数式の `expression`        |
| 接続         | 各要素の `connector`・`defaultConnector`・`faultConnector`・`nextValueConnector`・`noMoreValuesConnector`・決定の `rules[].connector`・`start` の `connector` / `scheduledPaths`                                                                   | ルートの `edges`（kind なしの値 `{ from, to, edgeType }` の集合）。要素の中には持たない                                                |
| 読まないもの | 各要素の `locationX`・`locationY`（Flow Builder の画面上の位置）、`processMetadataValues` の `CanvasMode` などの画面の設定                                                                                                                         | 持たない（`skippedElements` にも入れない。要素を動かしただけの変更を出さないため）                                                     |

要素の種類ごとに読む値（主なもの）:

| 要素                                                                  | 値                                                                                                                                                                                                       |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `recordLookups` / `recordUpdates` / `recordCreates` / `recordDeletes` | `object`・`filterLogic`・`filters`（`field`・`operator`・`value`）・`inputAssignments` / `outputAssignments`（`field`・値）・`queriedFields`・`inputReference` / `outputReference`・`getFirstRecordOnly` |
| `decisions`                                                           | `rules`（`name`・`label`・`conditionLogic`・`conditions`（`leftValueReference`・`operator`・`rightValue`））・`defaultConnectorLabel`                                                                    |
| `assignments`                                                         | `assignmentItems`（`assignToReference`・`operator`・`value`）                                                                                                                                            |
| `loops`                                                               | `collectionReference`・`iterationOrder`                                                                                                                                                                  |
| `actionCalls`                                                         | `actionType`（`apex` / `emailSimple` / `flow` など）・`actionName`・`inputParameters` / `outputParameters`                                                                                               |
| `subflows`                                                            | `flowName`・`inputAssignments` / `outputAssignments`                                                                                                                                                     |
| `screens`                                                             | `fields`（`name`・`fieldType`・`extensionName`（`c:accountList` などの LWC）・`dataType`・`isRequired`・`visibilityRule`・入れ子の `fields`）                                                            |

- **画面上の位置は読まない**。図は `edges` から並べる（レポート側で自動配置）。
- **接続は要素の外に出す**: 要素の中に持つと、つなぎ替えただけで要素の objectKey が変わり、中身の変更と区別できなくなる。外に出すと、要素の中身の変更と接続の変更が別々に出る。
- 値（`value`・`rightValue`）は `stringValue` / `numberValue` / `booleanValue` / `elementReference` のどれか 1 つの要素なので、`{ type, value }` の 1 つの値にする。
- **参照の取り出し**: 各要素・資源について、使っている項目（`$Record.Amount__c`、レコードの操作の `object` + `field`）・変数（`{!var}`、`elementReference`）・Apex（`actionType: apex` の `actionName`）・サブフロー・LWC（画面の `extensionName`）・ラベル（`$Label.X`）を `references` に入れる（数式の中は `{!...}` の差し込みだけを取り出す。数式そのものの解析は [metadata-roadmap.md](./metadata-roadmap.md) 3 章）。

### 6.2 Diff

| 対象               | 分類 | キー                                                  |
| ------------------ | ---- | ----------------------------------------------------- |
| 要素・資源         | D    | `name`（要素の種類が変われば値ごとの変更）            |
| `edges`            | B    | `from` + `to` + `edgeType`                            |
| 決定の `rules`     | C    | 上から順に評価されるので順序付き（`name` で組にする） |
| 条件・割り当ての行 | C    | 書いた順（`conditionLogic` の番号が順序に依る）       |

### 6.3 解析（`processor/Metadata/flowAnalysis.ts` の `analyzeFlows`）

- Flow の一覧（種類・起動条件・対象オブジェクト・状態）。オブジェクトごとの自動化（レコードトリガーフロー・Apex トリガー・入力規則）の一覧（`automation.byObject`）。
- 参照の確認: カスタムの項目・Apex クラス（`@InvocableMethod` を持つか）・サブフロー・LWC（`lightning__FlowScreen` が `targets` にあるか）。
- 図: `edges` から `Graph` に渡すノードとエッジ。到達できない要素、`faultConnector` のない DML（レビューの指摘の候補）。
- Flow の有効なバージョンは別のメタデータ（`flowDefinitions/`）。SFDX のソースは最新の 1 版だけを持つので、まずは `status` だけを見る。

## 7. Layout

### 7.1 JSON

ファイル名 `<オブジェクト>-<名前>.layout-meta.xml` の最初の `-` までがオブジェクト（kind `layout` の `objectApiName`）。

| 部分               | XML の要素                                                                                                                      | JSON                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| セクション         | `layoutSections`（`label`・`style`・`editHeading`・`detailHeading`・`layoutColumns`）                                           | kind `layoutSection`。`label`・`style`・見出しの表示                                                                                |
| 項目               | `layoutColumns` の `layoutItems`（`field`・`behavior`・`customLink`・`page`・`canvas`・`emptySpace`）                           | kind `layoutItem`。`field` / `customLink` など、`behavior`（`Edit` / `Required` / `Readonly`）、**位置 `{ section, column, row }`** |
| 関連リスト         | `relatedLists`（`relatedList`・`fields`・`sortField`・`sortOrder`・`buttons`・`customButtons`）                                 | kind `layoutRelatedList`                                                                                                            |
| ボタン・アクション | `platformActionList` の `platformActionListItems`（`actionName`・`actionType`・`sortOrder`）、`excludeButtons`・`customButtons` | kind `layoutAction`                                                                                                                 |

- セクション・列を入れ子にせず、**項目は位置付きの平らな並び**にする。項目を別のセクションに動かすと、入れ子なら削除 + 追加になるが、平らにして `field` で対応付ければ位置（`section`）の変更として出る。

### 7.2 Diff・解析

- セクションは C（表示順。`label` で組にする）、項目は D（`field`。空白・リンクは `customLink` / `page` / 位置で）、関連リストは C（`relatedList`）、アクションは C（`sortOrder` の順）。
- 解析（`processor/Metadata/layoutAnalysis.ts`）: レイアウトにある項目がオブジェクトにあるか（カスタムのみ）、項目の必須（`required`）とレイアウトの `Required` の食い違い、どのレイアウトにもない項目、Profile のレイアウトの割り当て（3 章）とのつながり。

## 8. FlexiPage

### 8.1 JSON

| 部分       | XML の要素                                                                                                                                  | JSON                                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ルート     | `masterLabel`・`type`（`RecordPage` / `AppPage` / `HomePage` など）・`sobjectType`・`template`（`name`・`properties`）・`parentFlexiPage`   | kind `flexiPage`                                                                                                                                                                                       |
| リージョン | `flexiPageRegions`（`name`・`type`（`Region` / `Facet`）・`itemInstances`）                                                                 | kind `flexiPageRegion`。`name`（キー）                                                                                                                                                                 |
| 部品       | `itemInstances` の `componentInstance`（`componentName`・`identifier`・`componentInstanceProperties`（`name`・`value`）・`visibilityRule`） | kind `flexiPageComponent`。`identifier`（キー）・`componentName`（`c:accountList` は LWC、`force:` / `flexipage:` は標準）・`properties`（D: `name`）・`visibilityRule`（`booleanFilter`・`criteria`） |
| 項目       | `itemInstances` の `fieldInstance`（`fieldItem`（`Record.Tier__c`）・`identifier`・`fieldInstanceProperties`・`visibilityRule`）            | kind `flexiPageField`                                                                                                                                                                                  |

- タブなどの部品は、プロパティの値に Facet のリージョン名を持ち、その中に部品が入る（入れ子）。JSON は平らなまま持ち、入れ子は解析で組み立てる（表示用の木）。

### 8.2 Diff・解析

- リージョンは D（`name`）、部品・項目は D（`identifier`。リージョンをまたいで動いたものは `region` の変更）、部品のプロパティは D（`name`）。
- 解析（`processor/Metadata/flexiPageAnalysis.ts`）: LWC の部品（`c:<名前>` → `c/<名前>` のバンドル）があるか、`isExposed` か、ページの種類に合う `targets`（`lightning__RecordPage` など）を持つか、渡しているプロパティが `targetConfigs` の `property` にあるか。項目・表示条件（`{!Record.Field__c}`）の参照。LWC の配置先の一覧（`lwc.placements`）。

## 9. ファイル構成

```text
src/analyzer/
├── types/commons/xmlJson.ts      makeMetadataJson・unknownChildNames (新しい種類用)
├── types/metadata/
│   ├── permission.ts             PermissionSet / MutingPermissionSet / Profile (行の表) / PermissionSetGroup
│   ├── customLabels.ts
│   ├── flow.ts                   ルート・起動・要素・資源・edges・references
│   ├── layout.ts
│   └── flexiPage.ts
├── parser/Metadata/
│   ├── folder.ts                 MetadataFolderParser (共通の流れ) と MetadataFileParseResult
│   ├── permission.ts  customLabels.ts  flow.ts  page.ts   種類ごとの parser
│   └── folders.ts                METADATA_FOLDER_PARSERS・保存名の接頭辞・フォルダ名 / 保存名から parser を選ぶ
├── processor/Metadata/
│   ├── diff/permission.ts  customLabels.ts  flow.ts  page.ts
│   ├── diff/metadataFile.ts      種類ごとの単位の差分 (make<種類>UnitDiffs)
│   ├── references.ts             MetadataContext・makeReferenceChecker・lwcContextOf
│   └── permissionAnalysis.ts  labelAnalysis.ts  flowAnalysis.ts  pageAnalysis.ts
└── worker/metadataFolderWorker.ts   タスク = 種類のフォルダ
docs/examples/metadata/
├── samples/{before,after}/force-app/main/default/
│   permissionsets/  mutingpermissionsets/  profiles/  permissionsetgroups/  labels/  flows/  layouts/  flexipages/
└── scripts/run-folders.ts        JSON・Diff・解析の出力 (output/json/folders.md、output/diff/folders.md・folder-diff.json)
test/processor/metadata-folders.test.ts
```

## 10. 実装の状況

| 段階 | 内容                                                                                                                                                                                                                                                                     | 状況 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| 1    | 土台: `MetadataFolderParser`（文字列からの入口を含む）・`makeMetadataJson`・単位の Diff・`MetadataFolderWorker`・`skippedElements`                                                                                                                                       | 済   |
| 2    | 権限: PermissionSet・MutingPermissionSet・Profile・PermissionSetGroup の JSON・Diff、権限の解析（表・実際の権限・参照先・矛盾・強い権限）                                                                                                                                | 済   |
| 3    | CustomLabels: JSON・Diff、LWC・Apex・Flow からの使用箇所                                                                                                                                                                                                                 | 済   |
| 4    | Flow: JSON（要素・資源・`edges`・`references`）・Diff・解析（一覧・自動化・図・到達できない要素・失敗時の経路・参照先）                                                                                                                                                  | 済   |
| 5    | Layout・FlexiPage: JSON・Diff、項目・LWC との突き合わせ                                                                                                                                                                                                                  | 済   |
| 6    | サンプル（`run-folders.ts`）とテスト（`metadata-folders.test.ts`）。サンプルの差分に、すべての kind が現れる（`applicationVisibility`・`customPermissionAccess`・`profileActionOverride`・`tabSetting`・`flowActionCall`・`flexiPageRegion`・`error` は unchanged のみ） | 済   |

続けて対応したもの:

| 内容                                                                                             | 実装                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 項目の必須とレイアウトの食い違い                                                                 | `ObjectFieldInfo.required`（`required` または主従関係）。`analyzeLayouts` の `REQUIRED_FIELD_NOT_ON_LAYOUT`（必須の項目がレイアウトにない）・`REQUIRED_FIELD_READONLY`（必須の項目が参照のみ）・`LAYOUT_ONLY_REQUIRED`（レイアウトでだけ必須。API・データの取り込みでは必須にならない） |
| オブジェクトごとの自動化                                                                         | `processor/Metadata/automation.ts` の `analyzeAutomation`（レコードトリガーフロー・Apex トリガー（`getApexTriggers`。対象オブジェクト・イベント・status）・入力規則）                                                                                                                   |
| Apex アクションの `@InvocableMethod`                                                             | `apexContextOf`（`MetadataContext.invocableApexClasses`）。`analyzeFlows` の `APEX_NOT_INVOCABLE`（`actionCalls` だけ。`apexPluginCalls` は見ない）                                                                                                                                     |
| Lightning ページの並び順                                                                         | リージョンの `items`（中の部品・項目の identifier を表示順に）。リージョンの差分で C（同じ identifier 同士だけを組にし、順序の変化は moved）                                                                                                                                            |
| レポートの provider（[report-components-plan.md](./report-components-plan.md) 2.5〜2.8・3.2 章） | `src/analyzer/report/`（`permission.*`・`flow.*`・`automation.byObject`・`layout.detail`・`flexiPage.detail`・`lwc.placements`・`crossRef.labels`・`metadata.findings`）。テストは `test/processor/report-providers.test.ts`、サンプルの出力は `output/report/`                         |

残り: レポートの画面の部品（`PermissionDiffTable` など）。レポートの仕組み（仕様の型・ビルド・汎用の部品・MCP ツール。[report-components-plan.md](./report-components-plan.md) 3.3・3.4・4 章の 1〜2）が先に要る。

## 11. 決めたこと

| 項目                  | 決定                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| parser・worker の単位 | フォルダ単位で読む（worker のタスク = 種類のフォルダ）。parser は種類ごとのクラス + 共通の基底クラス。保存・Diff はファイル単位                   |
| CustomLabels の単位   | ファイル 1 つ（ラベルは子。D）                                                                                                                    |
| Profile で読む要素    | すべて（3.1）。スキーマにない要素だけ `skippedElements`                                                                                           |
| MutingPermissionSet   | 扱う（PermissionSet と同じ型。権限セットグループの計算に使う）                                                                                    |
| Flow の画面上の位置   | 読まない（`locationX` / `locationY` は持たない。図は `edges` から自動で並べる）                                                                   |
| Layout の項目の持ち方 | 位置付きの平らな並び（セクションをまたぐ移動を位置の変更として出す）                                                                              |
| 新しい種類のキー      | Apex・LWC と同じ（`makeSpanJson` の既定。objectKey は `sortKeys` してから hash、子の並びは XML の順のまま）。オブジェクトは保存済みのため今のまま |
