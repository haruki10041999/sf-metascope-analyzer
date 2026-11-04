# オブジェクトの翻訳（objectTranslation）

オブジェクトの翻訳（`force-app/main/default/objectTranslations/<オブジェクト>-<言語>/`）を、オブジェクトと同じ流れ（XML → `kind` / `sourceKeys` 付き JSON → 解析 → Diff）で扱う。方針は [report-components-plan.md](./report-components-plan.md) 4 章、オブジェクトの実装は [metadata-implementation.md](./metadata-implementation.md)。

- 翻訳はオブジェクトとは別のファイルなので、**解析結果も保存も別にする**（Apex のソースと `-meta.xml` と同じ考え方）。
- 翻訳だけでは判断できないこと（未翻訳・削除された項目の翻訳など）は、同じ時点のオブジェクトと突き合わせて解析する（4 章）。

## 1. ファイル構成

| 層        | ファイル                                                                                                                                                                      | 役割                                                                                                                               |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| JSON の型 | [types/metadata/objectTranslation.ts](../src/analyzer/types/metadata/objectTranslation.ts)                                                                                    | kind ごとの型、`make*Json`、名前で識別する翻訳の表 `TRANSLATION_MEMBERS`、フォルダ全体をまとめる `makeCustomObjectTranslationJson` |
| parse     | [parser/Metadata/objectTranslation.ts](../src/analyzer/parser/Metadata/objectTranslation.ts)                                                                                  | `ObjectTranslationParser`。フォルダを探して読み、保存・読み込みする                                                                |
| Diff      | [processor/Metadata/diff/objectTranslation.ts](../src/analyzer/processor/Metadata/diff/objectTranslation.ts)、[diff/unit.ts](../src/analyzer/processor/Metadata/diff/unit.ts) | kind ごとの `*JsonDiff` と、翻訳単位の `makeObjectTranslationUnitDiffs`                                                            |
| 解析      | [processor/Metadata/translation.ts](../src/analyzer/processor/Metadata/translation.ts)                                                                                        | オブジェクトとの突き合わせ（翻訳の網羅）                                                                                           |
| まとめ役  | [processor/Metadata/metadata.ts](../src/analyzer/processor/Metadata/metadata.ts)                                                                                              | `MetadataProcessor` が、オブジェクトと一緒に翻訳も読み、保存し、差分と網羅を返す                                                   |
| ワーカー  | [worker/objectTranslationWorker.ts](../src/analyzer/worker/objectTranslationWorker.ts)                                                                                        | `ObjectTranslationWorker`（`WorkerTaskType` の `'ObjectTranslation'`）                                                             |

## 2. parse

### 2.1 読むファイル

| ファイル                                                                                 | ルート要素                | JSON                |
| ---------------------------------------------------------------------------------------- | ------------------------- | ------------------- |
| `<オブジェクト>-<言語>.objectTranslation-meta.xml`                                       | `CustomObjectTranslation` | `objectTranslation` |
| `<項目>.fieldTranslation-meta.xml`（翻訳のフォルダの直下。`fields/` に置いたものも読む） | `CustomFieldTranslation`  | `fieldTranslation`  |

- フォルダ名を最後の `-` で分け、`objectApiName` と `locale` にする（API 名は `-` を含まない）。
- メタデータ API の形式（`<fields>` を objectTranslation-meta.xml の中に書く）も読む。項目の並びは、objectTranslation-meta.xml の中のもののあとに、ファイル名の順。
- 改行コードは LF にそろえてから読む（CRLF でも sourceKey は変わらない）。
- 組織全体の `translations/<言語>.translation-meta.xml`（タブ・アプリ・カスタムラベル）は対象外。

### 2.2 JSON の型

| kind                                                                                                                              | 型                              | 持つもの                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `objectTranslation`                                                                                                               | `CustomObjectTranslationJson`   | `objectApiName`、`locale`（必ず持つ）。`nameFieldLabel` / `gender` / `startsWith`、子の配列 `fields` / `caseValues` / `recordTypes` / `validationRules` / `webLinks` / `quickActions` / `fieldSets` / `sharingReasons` / `standardFields` / `layouts` |
| `fieldTranslation`                                                                                                                | `CustomFieldTranslationJson`    | `name`（必ず持つ）。`label` / `help` / `relationshipLabel` / `description`、`picklistValues`、`lookupFilter`（`errorMessage` / `informationalMessage`）                                                                                               |
| `picklistValueTranslation`                                                                                                        | `PicklistValueTranslationJson`  | `masterLabel`（翻訳元の値のラベル。必ず持つ）、`translation`                                                                                                                                                                                          |
| `recordTypeTranslation`                                                                                                           | `RecordTypeTranslationJson`     | `name`、`label`、`description`                                                                                                                                                                                                                        |
| `validationRuleTranslation`                                                                                                       | `ValidationRuleTranslationJson` | `name`、`errorMessage`                                                                                                                                                                                                                                |
| `webLinkTranslation` / `quickActionTranslation` / `fieldSetTranslation` / `sharingReasonTranslation` / `standardFieldTranslation` | `*TranslationJson`              | `name`、`label`                                                                                                                                                                                                                                       |
| `layoutTranslation`                                                                                                               | `LayoutTranslationJson`         | `layout`（レイアウト名）、`layoutType`、`sections`（`{ section, label }[]`）                                                                                                                                                                          |

- ファイルにないものは持たない（値のプロパティも子の配列も。オブジェクトと同じ）。
- `caseValues`（名詞の格）は名前を持たないので、kind のない値の配列にする。
- 名前で識別する翻訳を増やすときは、`TRANSLATION_MEMBERS` に 1 行足す（parse と Diff は表を見る）。

### 2.3 解析結果と保存

| 型                                        | `dataType`                                           | `result.id`                   |
| ----------------------------------------- | ---------------------------------------------------- | ----------------------------- |
| `ObjectTranslationFileStructureType`      | `objectTranslation`                                  | フォルダ名（`Invoice__c-ja`） |
| `ErrorObjectTranslationFileStructureType` | `error`（objectTranslation-meta.xml が読めないとき） | 同上                          |

- 読めなかったファイルは `ErrorJson` と `resolvedError`（`XML_SYNTAX` / `UNEXPECTED_ROOT`）にする（オブジェクトと同じ）。
- 保存は msgpack で、保存名に接頭辞 `objectTranslation_` を付ける（`objectTranslation_Invoice__c-ja.msgpack`）。オブジェクト（`<API 名>.msgpack`）と同じフォルダに置いても分けられ、`MetadataParser.readSavedObjects` は翻訳の保存データを読まない。
- `MetadataProcessor` は、オブジェクトを `<保存先>/objects/`、翻訳を `<保存先>/objectTranslations/` に分けて保存する。

| メソッド（`ObjectTranslationParser`）                                                        | 内容                                                                        |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `searchObjectTranslationDirectories(rootDir)`                                                | 翻訳のフォルダの一覧（`objectTranslations` そのものを渡すと直下だけを見る） |
| `parseObjectTranslation(directory)` / `parseObjectTranslations(rootDir)`                     | 翻訳を読む                                                                  |
| `saveObjectTranslationFile` / `readObjectTranslationMsgPack` / `readSavedObjectTranslations` | msgpack での保存と読み込み（読み込みの id は保存名でもフォルダ名でもよい）  |
| `saveObjectTranslationFileForDevelopper`                                                     | 確認用の JSON                                                               |

## 3. Diff

| 単位・kind                 | Diff の型                          | 対応付け                                                        |
| -------------------------- | ---------------------------------- | --------------------------------------------------------------- |
| 翻訳のフォルダ             | `ObjectTranslationUnitDiff`        | `<オブジェクト>-<言語>`。片方にしかなければ `added` / `removed` |
| `objectTranslation`        | `CustomObjectTranslationJsonDiff`  | 子はどれも名前で対応付ける（D）。`caseValues` は集合（B）       |
| `fieldTranslation`         | `CustomFieldTranslationJsonDiff`   | `name`                                                          |
| `picklistValueTranslation` | `PicklistValueTranslationJsonDiff` | `masterLabel`                                                   |
| 名前で識別する翻訳         | `TranslationMemberJsonDiff`        | `name`（レイアウトは `layout`、セクションは `section`）         |

- 両方にない値・子の配列は出さない。片方にだけあるものは `added` / `removed`（[metadata-diff-policy.md](./metadata-diff-policy.md) と同じ）。
- ファイル単位の差分は、オブジェクトと共通の `makeXmlUnitDiffs`（`XmlUnitDiff`）で作る。

## 4. 解析（オブジェクトとの突き合わせ）

`analyzeTranslationCoverage(translation, object, { before })` / `analyzeTranslationCoverages(translations, objects, before)` が、言語ごとの `TranslationCoverage` を返す。`MetadataProcessor.getTranslationCoverages({ locales, objects })` からも使える。

### 4.1 対象

| kind                | 翻訳元（オブジェクト）                        | 翻訳                                     | name                     |
| ------------------- | --------------------------------------------- | ---------------------------------------- | ------------------------ |
| `fieldLabel`        | 項目の `label`                                | `fieldTranslation.label`                 | 項目の API 名            |
| `fieldHelp`         | 項目の `inlineHelpText`                       | `fieldTranslation.help`                  | 同上                     |
| `relationshipLabel` | 項目の `relationshipLabel`                    | `fieldTranslation.relationshipLabel`     | 同上                     |
| `picklistValue`     | 選択リスト値の `label`（なければ `fullName`） | `picklistValueTranslation.translation`   | `<項目>.<値の fullName>` |
| `validationRule`    | 入力規則の `errorMessage`                     | `validationRuleTranslation.errorMessage` | fullName                 |
| `recordType`        | レコードタイプの `label`                      | `recordTypeTranslation.label`            | fullName                 |
| `webLink`           | ボタン・リンクの `masterLabel`                | `webLinkTranslation.label`               | fullName                 |
| `fieldSet`          | 項目セットの `label`                          | `fieldSetTranslation.label`              | fullName                 |

- 選択リスト値の翻訳は `masterLabel`（翻訳元のラベル）で書かれているので、オブジェクトの値のラベルか fullName と一致するものに読み替える。
- オブジェクト側で読まないもの（クイックアクション・レイアウト・共有の理由など）は対象外。

### 4.2 状態

| status         | 意味                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------- |
| `translated`   | 翻訳がある                                                                                |
| `missing`      | 翻訳元はあるが、翻訳がない（または空）                                                    |
| `sameAsSource` | 翻訳が翻訳元と同じ（翻訳し忘れの候補）                                                    |
| `orphan`       | オブジェクトにないもの（削除された項目・選択リスト値など）を指す翻訳                      |
| `outdated`     | 翻訳元が before → after で変わったのに、翻訳が変わっていない（`before` を渡したときだけ） |

- 標準項目（`__c` で終わらない項目）は、オブジェクトに項目のファイルがなくても存在するので `orphan` にしない。
- 同じ時点にオブジェクトがない場合（`objectFound: false`）、カスタムオブジェクトの翻訳は `orphan`、標準オブジェクトの翻訳は `translated` にする。
- 各項目は、元のノードの `sourceKeys`（`object` / `translation`）を持つ。表示でソースの位置を引くときに使う。

## 5. 動作検証とテスト

[examples/metadata/](./examples/metadata/README.md) の before / after に `objectTranslations` を置いている。

```sh
npx ttsx --noCheck docs/examples/metadata/run-parse.ts   # parse-output/<side>/objectTranslations/ に JSON
npx ttsx --noCheck docs/examples/metadata/run-diff.ts    # diff-output/translation-diff.json、translation-coverage.md
```

| テスト                                    | 内容                                                                                                                                                            |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| test/parser/object-translation.test.ts    | フォルダ名の分割、読み込み、ないものを持たないこと、読めなかったファイル、キー（位置だけの変化・CRLF）、保存の分離                                              |
| test/processor/object-translation.test.ts | サンプルの差分（名前・masterLabel での対応付け、エラー）、網羅（未翻訳・翻訳元と同じ・宙に浮いた翻訳・古い翻訳・標準項目）、`MetadataProcessor` の保存 → 再読込 |
| test/worker/worker.test.ts                | `ObjectTranslationWorker` の解析・保存・読み込み                                                                                                                |
