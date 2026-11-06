# 解析部分で今後やること（計画）

解析（parse → JSON → Diff → 解析 → レポートに渡すデータ）の部分で、次にやることをまとめる。観点は 5 つ。

1. コードの整備（共通化）
2. データタイプごとの処理の流れの共通化
3. 依存関係（dependencies）の機能
4. データタイプごとの差分は git diff で足りるか
5. そのほかに考えること

今の作りは [commons.md](./commons.md)、種類ごとの対応状況は [metadata-implementation.md](./metadata-implementation.md)、リポジトリ全体のやることは [todo.md](./todo.md)、レポートは [report-components-plan.md](./report-components-plan.md)。

## 0. 今の作り（前提）

データタイプは 4 系統あり、作られた時期ごとに少しずつ形が違う。

| 系統                                | 単位                                                        | parser                                                     | 単位の解析結果                                      | worker                                    | 保存名                                           |
| ----------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------- | ------------------------------------------------ |
| Apex                                | クラス・トリガー（ソース + `-meta.xml`）・匿名 Apex         | `ApexParser`（static）。IR → converter → JSON              | `ApexUnitParseResult`（`dataType: 'apexUnit'`）     | `ApexWorker`                              | `class_` / `trigger_` / `anonymous_`             |
| LWC                                 | バンドル（フォルダ）                                        | `LwcParser`（static）。Babel・テンプレート・postcss → JSON | `LwcBundleParseResult`（`'lwcBundle'`）             | `LwcWorker`                               | `lwc_`                                           |
| オブジェクト・翻訳                  | フォルダ（`objects/<API 名>/`・`objectTranslations/<…>/`）  | `MetadataParser`・`ObjectTranslationParser`（static）      | `ObjectParseResult`・`ObjectTranslationParseResult` | `ObjectWorker`・`ObjectTranslationWorker` | API 名のまま（接頭辞なし）・`objectTranslation_` |
| フォルダ単位のメタデータ（A・B・C） | ファイル（Aura はバンドル、レポートなどは入れ子のフォルダ） | `MetadataFolderParser`（インスタンス。種類の設定で動く）   | `MetadataFileParseResult<種類, JSON>`               | `MetadataFolderWorker`（1 つ）            | `<種類>_`                                        |

解析結果の形（`{ filePath, resolvedError, dataType, result: { id, base, sourceObject } }`）と、単位の Diff（`makeIdUnitDiffs`）はすでに共通。違いが残っているのは、parser の入口・worker・JSON の作り方（キーの作り方）・解析（参照の確かめ方）。

## 1. コードの整備（共通化）

### 1.1 JSON の作り方とキー

| 項目               | 今                                                                                                                                                                                | 整備                                                                                                                                                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| objectKey の作り方 | 3 通り。Apex・LWC・フォルダ単位は `sortKeys` してから hash、オブジェクト・翻訳・LWC の `js-meta.xml` は書いた順のまま hash（`makeXmlJson`。保存済みのデータのキーを変えないため） | `sortKeys` にそろえる。保存データの版（5.2）を入れ、版が古ければ読み直す（保存データは parse し直せば作れるので、移行は「捨てて作り直す」でよい）。`makeXmlJson` は残さない                                                                    |
| XML から JSON      | 4 通り。オブジェクトの子（種類ごとの `make*Json`）、優先度 A（種類ごとの `make*Json` + `readProperties`）、B・C（表 `RecordSpec`）、Flow（Flow 専用の値の木）                     | 新しく足す種類は表（`RecordSpec`）にそろえる。表で書けないもの（Flow の接続・Layout の位置・権限の行の表）だけ専用の作り方にする。オブジェクトの子のうち表で書けるもの（入力規則・Web リンク・共有の理由など）は、キーをそろえるときに表に移す |
| 値の木             | 2 つ（`types/commons/valueTree.ts` と Flow の `toProperties`）                                                                                                                    | Flow も共通の値の木を使い、Flow だけの決まり（接続・位置を外す）はオプション（`skip`）で渡す                                                                                                                                                   |
| 名前のプロパティ   | `name`（優先度 A・LWC・Aura）、`fullName`（B・C・オブジェクトの子）、`apiName`（オブジェクト・項目）が混ざる                                                                      | 「単位の名前」を解析結果の `result.id` から引ける関数（`unitName(result)`）を用意し、解析・レポートはそれだけを使う（JSON のプロパティ名は、XML の要素名に合わせるので無理にはそろえない）                                                     |
| `skippedElements`  | 優先度 A・B・C は持つ、オブジェクトは持たない                                                                                                                                     | キーをそろえるとき（上）にオブジェクトにも入れる（読んでいない要素が分かるように）                                                                                                                                                             |

### 1.2 parser・worker・保存

| 項目               | 今                                                                                                                                       | 整備                                                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| parser の形        | static クラス 4 つ（Apex・LWC・オブジェクト・翻訳）と、設定で動くインスタンス（フォルダ単位）                                            | すべて 2 章の「単位の種類」の形（探す・読む・parse・保存・読み込み）にする。static クラスは、その形のインスタンスを返す薄い入口として残す |
| 文字列からの parse | 入口の名前がばらばら（`parseApexUnitFiles`・`parseLwcBundleFolder`・`parseObjectSource`・`parseObjectTranslationSource`・`parseSource`） | `parseUnit(id, files: SourceText[])` にそろえる（git の before 側も、作業ツリーも、テストも同じ入口）                                     |
| worker             | 5 つ（`ApexWorker`・`LwcWorker`・`ObjectWorker`・`ObjectTranslationWorker`・`MetadataFolderWorker`）                                     | 1 つにする。タスクは「単位の種類 + 単位を読むためのパス」。保存先は 1 つのフォルダで、読み込みは保存名の接頭辞で種類を選ぶ                |
| 保存名             | オブジェクトだけ接頭辞がない（ほかの種類の接頭辞の一覧で除いて判別している）                                                             | オブジェクトにも `object_` を付ける（保存データの版で切り替える）。接頭辞の一覧（`OTHER_SAVE_PREFIXES`）がいらなくなる                    |
| 名前の誤り         | `saveObjectFileForDevelopper` などの `Developper`                                                                                        | `ForDeveloper` に直す（旧名は 1 版だけ残す）                                                                                              |

### 1.3 Diff

| 項目                         | 今                                                                                                                                              | 整備                                                                                                                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 単位の Diff の一覧           | フォルダ単位のメタデータは `METADATA_UNIT_DIFFS`、ほかは種類ごとの関数（`makeApexUnitDiffs`・`makeLwcBundleDiffs`・`makeObjectUnitDiffs` など） | 2 章の「単位の種類」に `diff` を持たせ、一覧から引く                                                                                                                               |
| 並びの差分の部品             | `makeOrderedValuesDiff`（違う値も組にする）と `makeOrderedNamesDiff`（同じ名前だけ組にする）                                                    | 使い分けを [commons.md](./commons.md) に書く。名前の並び（項目名・identifier・タブ）は `makeOrderedNamesDiff`、値の並び（リストビューの列の設定など）は `makeOrderedValuesDiff`    |
| レポートの provider の比べ方 | provider（`src/analyzer/report/`）は、Diff を使わずに解析結果を自前で比べている（`compareKeyed`）                                               | 単位の status は Diff の結果を使う（同じ判定が 2 か所にあるとずれる）。行の中の比べ方は Diff の結果から取る形に寄せ、`compareKeyed` は Diff がないもの（解析の結果同士）だけに使う |

### 1.4 解析

| 項目         | 今                                                                                                                                                                                                                                                                             | 整備                                                                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 参照の確かめ | 4 か所。LWC の解析（`analyzeLwcBundles` の `checkMetadata`）、優先度 A の解析（権限・Flow・画面・ラベル。`makeReferenceChecker`）、種類をまたぐ参照（`analyzeMetadataReferences`）、ラベルの使用箇所。A の参照は A の解析、B・C は参照の解析、と分けて重ならないようにしている | すべての種類の参照を 1 つの形（3 章の参照）で取り出し、確かめは 1 か所（依存関係のグラフ）で行う。種類ごとの解析は「その種類だけで分かること」（権限の矛盾、Flow の到達できない要素など）に絞る |
| 入力の束ね方 | 3 つ。`MetadataContext`（名前の一覧）、`ReferenceInputs`（解析結果）、レポートの `MetadataSnapshot`（解析結果。A は種類ごと、B・C は `others`）                                                                                                                                | 1 つ（`Repository`。単位の種類 → 解析結果の一覧。2.2）にし、名前の一覧などは `Repository` から作る                                                                                              |
| 指摘の形     | `MetadataFinding` に、種類ごとの `holder` / `flow` / `layout` / `flexiPage` / `from` が付く                                                                                                                                                                                    | 指摘の対象を「単位の id + 行の sourceKeys」にそろえる（`unit` 1 つ）                                                                                                                            |

### 1.5 テスト・道具

- `tsconfig.json` が `src` だけを見ていて、テストとサンプルのスクリプトの型エラーに気づけない（実際に「複雑すぎて表現できない共用体型」を見逃した）。`tsconfig.test.json`（`test/`・`docs/examples/**/scripts/`）を作り、型チェックに入れる。
- Prettier の設定（`endOfLine: crlf`）と、リポジトリのファイル（多くが LF）が合っていない。整形するたびに改行コードだけの差分が出る。`.gitattributes` で改行コードを決め、Prettier の設定をそれに合わせる。
- 以前から失敗しているテストが 6 件ある（Apex の `locationValue`・`typeRef`・コンストラクタ・内側の型のキーなど）。期待値が古いのか実装の不具合なのかを分けて直す。
- サンプルのスクリプトが種類ごとに分かれている（`run-parse.ts`・`run-diff.ts`・`run-folders.ts`、Apex・LWC のスクリプト）。2 章の一覧から、すべての種類を同じ形で出す 1 つのスクリプトにまとめる。

## 2. データタイプごとの処理の流れの共通化

### 2.1 流れ

どの種類も次の流れにする（括弧は今の担当）。

```text
探す (search)        リポジトリの中の、その種類の単位 (ファイル・フォルダ・バンドル) を見つける
  ↓
読む (read)          単位のファイルを SourceText[] (パス + 中身) にする。作業ツリーからも、git の before 側からも
  ↓
parse (parseUnit)    SourceText[] → 解析結果 (JSON・resolvedError・sourceObject)。ファイルを読まない純粋な関数
  ↓
保存 / 読み込み      msgpack (本番) / JSON (確認用)。保存名は <接頭辞><名前>
  ↓
単位の Diff (diff)   before / after の解析結果 → 単位の差分 (makeIdUnitDiffs)
  ↓
参照・定義の取り出し 単位の中の「定義しているもの」と「参照しているもの」(3 章)。保存する JSON には入れない
  ↓
リポジトリの解析     依存関係のグラフ・参照の確かめ・種類ごとの解析 (権限の表など)
  ↓
レポートのデータ     provider
```

### 2.2 単位の種類（`UnitType`）

種類ごとの違いを 1 つの定義にまとめ、一覧（`UNIT_TYPES`）から parser・worker・Diff・解析・サンプルのスクリプトがすべて引く。

```ts
type UnitType<T extends string, J> = {
    type: T; // 'apexClass' / 'lwc' / 'object' / 'permissionSet' ...
    prefix: string; // 保存名の接頭辞
    search(root: string): Promise<UnitLocation[]>; // 単位の場所 (ファイル・フォルダ)
    read(location: UnitLocation): Promise<SourceText[]>; // 作業ツリーから読む
    fromGitPaths(paths: string[]): UnitLocation[]; // git の変更ファイル → 単位 (2.3)
    parseUnit(id: string, files: SourceText[]): UnitParseResult<T, J>;
    diff(before: J | ErrorJson, after: J | ErrorJson, sources: Sources): unknown;
    definitions(result: UnitParseResult<T, J>): Definition[]; // 3 章
    references(result: UnitParseResult<T, J>): Reference[]; // 3 章
};

/** ある時点のリポジトリ (種類 → 解析結果) */
type Repository = Map<string, UnitParseResult<string, unknown>[]>;
```

- 今の `MetadataFolderParser`（種類の設定で動く parser）を、Apex・LWC・オブジェクト・翻訳にも広げたものになる。
- Apex（クラス・トリガー・匿名 Apex）は、単位の種類を 3 つに分ける（今は `apexUnit` 1 つで、`unitType` で分けている）。
- 一覧の型は「どの種類も入る型」にする（種類ごとの型の共用体にすると、TS2590 になる）。

### 2.3 git との関係

- **どの単位が変わったか**は git で決める（`GitParser.getDiffFiles`）。変わったファイルのパスを、種類ごとの `fromGitPaths` で単位に直す（項目のファイル → オブジェクト、`.js` → LWC のバンドル、`.page` → Visualforce ページ など）。
- before 側は `readDiffFileContent` で中身を取り、`parseUnit` に渡す。変わっていない単位は parse し直さず、保存済みの解析結果を使う（全部の単位を比べ直さない）。
- **ファイルの移動・名前の変更**は git の rename（`renamed` と類似度）を使い、id の違う単位同士を対応付ける（今の `makeIdUnitDiffs` は id が同じものしか対応付けない）。

## 3. 依存関係（dependencies）の機能

### 3.1 何をしたいか

| 機能                       | 内容                                                                                                    | 使い道                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 依存先                     | ある単位・要素が使っているもの（`Invoice_Status_Update` → `Invoice__c.Amount__c`・`AccountService`）    | レビュー、デプロイに一緒に含めるものの確認          |
| 被依存（逆引き）           | ある単位・要素を使っているもの（`Invoice__c.Amount__c` を使う Apex・LWC・Flow・レイアウト・権限・数式） | 項目の削除・型の変更・名前の変更の影響範囲          |
| 推移的な依存・影響         | 依存・被依存を N 段たどる（深さを指定）                                                                 | 変更の影響範囲（変更した単位 → 影響を受ける単位）   |
| 変更の影響（git の範囲）   | 変更した単位・要素から被依存をたどり、「変更していないが影響を受けるもの」を出す                        | レビューの観点、テストの対象の選び方                |
| 依存の差分                 | before / after の依存の増減（新しく使い始めた・使わなくなった）                                         | 「この変更で何を使うようになったか」                |
| ない参照先                 | 参照先がリポジトリにない（今の `UNKNOWN_*` の指摘）                                                     | デプロイの失敗の予防                                |
| 使われていないもの         | 被依存がない単位・要素（入口になるもの以外）                                                            | 掃除の候補（項目・ラベル・Apex クラス・権限セット） |
| 循環                       | 依存の循環（Apex のクラス同士、Flow のサブフロー、Aura の継承など）                                     | 設計の確認                                          |
| デプロイの順序・パッケージ | 依存の順に並べた単位の一覧、`package.xml` の作成、変更した単位に足りない依存先                          | 部分デプロイ                                        |

### 3.2 データの形

```ts
/** グラフのノード。単位 (Invoice__c) か、単位の中の要素 (Invoice__c.Amount__c / AccountService.validate) */
type DependencyNode = {
    id: string; // '<種類>:<名前>' (field:Invoice__c.Amount__c / apexClass:AccountService)
    type: string; // 種類 (object / field / apexClass / apexMethod / lwc / flow / ...)
    name: string;
    unit?: string; // 定義している単位の id (リポジトリにあるとき)
    origin: 'repository' | 'standard' | 'managed' | 'missing';
};

/** 依存 (from が to を使う) */
type DependencyEdge = {
    from: string; // ノードの id
    to: string;
    kind: DependencyKind; // uses / reads / writes / calls / extends / implements / places / grants / triggers / ...
    via: string; // どこで (要素名・属性名)
    filePath: string;
    sourceKeys?: ConvertKeys;
};
```

- **定義（definitions）**: 単位が定義しているノード。オブジェクト → オブジェクト・項目・レコードタイプ・入力規則…、Apex → クラス・メソッド・プロパティ、LWC → バンドル・`@api` プロパティ・イベント、Flow → Flow、権限セット → 権限セット、など。参照先がリポジトリにあるかは、定義の一覧で確かめる（今の「名前の一覧」を置き換える）。
- **参照（references）**: 今の `MetadataReference`（参照の解析）・`FlowReference`（Flow）・`LwcMetadataDependency`（LWC）・ラベルの使用箇所を、この形にまとめる。`kind` で意味（読む・書く・呼ぶ・置く・権限を与える）を分ける。
- グラフは保存しない（ほかの単位の変更で変わるため）。リポジトリを読み込んだときに作る。大きいリポジトリでは、単位ごとの参照・定義だけを保存しておき（単位の中だけで決まるので保存してよい）、グラフはそれを集めて作る。

### 3.3 足りていない参照

依存関係を「項目の影響範囲」に使うには、次の参照が要る。

| 種類         | 足りていないもの                                                                                                                                                                                                                                          | 文書                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Apex         | SOQL / SOSL の対象（オブジェクト・項目）、DML（insert / update の対象）、ほかのクラス・メソッドの呼び出し、型の参照（`extends`・`implements`・変数の型）、`Schema.` の参照、`Label.`（取り出しは済）、カスタム権限（`FeatureManagement.checkPermission`） | [apex-json-analysis.md](./apex-json-analysis.md)           |
| 数式         | 数式項目・入力規則・既定値・ワークフロー・Flow の数式・レポートのバケット・リストビューの条件の中の項目（`Account.Name`・`$User.Id`・`$Setup.X__c.Field__c`）                                                                                             | （新規。5.1）                                              |
| LWC          | Apex のメソッド（`@salesforce/apex`。取り出しは済、グラフへの登録は未）、カスタム権限・静的リソース・メッセージチャネル（import）、子コンポーネント（済）                                                                                                 | [lwc-implementation.md](./lwc-implementation.md)           |
| オブジェクト | 参照項目の参照先（済）、主従関係、積み上げ集計の対象（`summarizedField`）、制御項目（`controllingField`）、絞り込み条件の項目（`lookupFilter`。取り出しは未）                                                                                             | [metadata-implementation.md](./metadata-implementation.md) |
| 項目の単位   | 今の参照の多くは「オブジェクト・単位」までで、項目・メソッド・`@api` まで分かれていないもの（Flow の要素の中の項目、レイアウトの項目は済）                                                                                                                | —                                                          |

### 3.4 標準のもの・パッケージのもの

- 標準オブジェクト・標準項目・標準の値セットは、リポジトリにないのが普通。ノードの `origin: 'standard'` として扱い、「ない」とは言わない。どれが標準かは、名前の規則（`__c` などの接尾辞がない）と、暗黙の標準項目の一覧（今の `getImplicitFields`）で決める。オブジェクトごとの標準項目の一覧は持っていないので、項目単位の確かめは「カスタム項目だけ」のまま。
- 名前空間付き（`ns__Name`）は `origin: 'managed'`。`sfdx-project.json` の名前空間と比べ、自分の名前空間なら `repository` として扱う。
- 参照先が見つからないものは `missing`（今の `UNKNOWN_*`）。ただし、参照先の種類を 1 つも読んでいないときは確かめない（今と同じ）。

### 3.5 出し方

- 解析: `analyzeDependencies(repository)` → `{ nodes, edges, findings }`、`getDependents(graph, node, depth)`、`getImpact(graph, changedUnits, depth)`、`diffDependencies(before, after)`。
- レポートの provider: `dependency.graph`（図。種類・深さで絞る）、`dependency.impact`（変更の影響）、`dependency.unused`、`dependency.missing`。今の `crossRef.references`・`crossRef.labels`・`crossRef.fieldUsage` は、このグラフから作る形に置き換える。
- 書き出し: JSON、Mermaid / DOT（図）、`package.xml`（依存の順）。
- MCP: 「この項目を使っているもの」「この変更の影響」を問い合わせるツール。

## 4. データタイプごとの差分は git diff で足りるか

### 4.1 git diff でできること・できないこと

| できること（git diff で足りる）                                | できないこと（構造の Diff が要る）                                                                                                                                                                       |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| どのファイル・単位が変わったか（追加・削除・変更・名前の変更） | **意味のない変更を無視する**: XML の並びの入れ替え（取り出すたびに並びが変わる Profile・権限セット）、Flow の位置（`locationX`）、空白・改行、Apex の書き方だけの変更                                    |
| 行単位の変更の中身（そのまま見せる用）                         | **何が変わったかを名前で言う**: 「`Invoice__c.Amount__c` の編集権限が false → true」「入力規則 `Amount_Positive` の数式」。行の差分では、どの要素の中の行か（`<fieldPermissions>` のどれか）が分からない |
| 本文のテキストの変更（メールの本文・静的リソース）             | **移動を移動として出す**: レイアウトの項目のセクション間の移動、Lightning ページの部品のリージョン間の移動、Apex の文の移動（GumTree）。行の差分では削除 + 追加になる                                    |
|                                                                | **要素ごとの判定**: 権限の矛盾が新しく出た、参照先がなくなった、依存が増えた（3 章）。解析・依存の差分は、構造の JSON がないと作れない                                                                   |

### 4.2 結論

- **単位の Diff（構造の Diff）は必要**。レポートの主な観点（権限の変更、Flow の変更、項目の変更、影響範囲）は、git の行の差分からは作れない。ただし、比べる単位を git で決める（変わった単位だけ比べる。2.3）。
- **作り方は表から作る形にそろえ、種類ごとの手書きの Diff を減らす**。表（`RecordSpec`）から作れる種類は、Diff の保守の手間がほとんどない。
- **本文のテキストは git の行の差分に任せる**。構造の Diff では「値が変わった」とだけ出し、中身はレポートで行の差分として見せる（下の表の「git」）。

| 種類                                                                                                   | 構造の Diff                        | 理由                                                                                     |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| Apex・LWC（JS / TS・テンプレート・CSS）                                                                | 必要（今のまま）                   | 宣言・文・要素の単位の変更と移動。書き方だけの変更を無視する                             |
| オブジェクト（項目・入力規則など）・翻訳                                                               | 必要                               | 項目の属性・選択リスト値の変更。項目の影響範囲の起点                                     |
| 権限セット・Profile・権限セットグループ                                                                | 必要（いちばん効く）               | XML の並びが変わりやすく、行の差分はノイズが多い。権限の行ごとの変更・実際の権限の変化   |
| Flow                                                                                                   | 必要                               | 位置だけの変更が多い（行の差分はノイズ）。要素・接続の変更                               |
| レイアウト・Lightning ページ                                                                           | 必要                               | 移動を移動として出す                                                                     |
| カスタム表示ラベル・値セット・共有ルール・アプリ・タブ・カスタム権限・クイックアクション・翻訳（組織） | 必要（表から作るので安い）         | 名前で対応付けた行ごとの変更                                                             |
| ワークフロー・承認プロセス                                                                             | 必要（表から作るので安い）         | ルール・ステップごとの変更（古い自動化の棚卸しにも使う）                                 |
| レポート・ダッシュボード                                                                               | 表の範囲だけ（列）。ほかは git     | 部品の配置などは値の木のままで、構造の Diff の利点が小さい                               |
| 静的リソース・リモートサイト・指定ログイン情報・グループ・ロール・キュー                               | 表の値だけ（安い）。git でも足りる | 値が数個しかない                                                                         |
| メールテンプレートの本文、Visualforce・Aura の本体のテキスト、Aura の JS                               | **git**（構造の Diff は要約だけ）  | 本文の構造（部品・宣言・差し込み）は構造の Diff、本文の行の変更は git の行の差分で見せる |

## 5. そのほかに考えること

### 5.1 数式の解析

数式項目・入力規則・既定値・ワークフロー・承認の条件・Flow の数式・レポートのバケットなどの数式は、今は文字列のまま。項目の影響範囲（3 章）には、数式の中の項目の参照が要る。Salesforce の数式の文法（関数・演算子・`$` で始まる差し込み・相互参照 `Account.Owner.Name`）の parser を作るか、既存のライブラリを使うかを決める。まずは「参照の取り出し」だけ（項目・関数の名前）を作り、型の確かめ・評価はしない。

### 5.2 保存データの版と互換

- 保存データ（msgpack）に版（JSON の形・キーの作り方の版）を入れる。版が違えば読み直す。
- 1.1 のキーのそろえ・1.2 の保存名の変更は、版を上げて行う。

### 5.3 SFDX のソースの形の違い

- **分解された形式（decomposed）**: 新しい SFDX では、権限セット（`permissionsets/<名前>/` の下に `objectSettings/` など）・カスタム表示ラベル（`labels/<名前>.label-meta.xml`）・ワークフロー・共有ルールなどを、1 つの XML ではなくフォルダに分けて置ける（`sfdx-project.json` の `decomposeXxx`）。今の parser は 1 つの XML の形だけを読む。分解された形を 1 つの単位に組み立てる読み方（2.2 の `read`）が要る。
- **メタデータ API の形式**（`src/package.xml` と `objects/X.object` など）: オブジェクトは中に子を書く形を読めるが、ほかの種類（`.workflow` などの拡張子）は未対応。
- **複数のパッケージディレクトリ**（`sfdx-project.json` の `packageDirectories`）と `.forceignore`: 探す範囲を `sfdx-project.json` から決める。同じ種類・同じ名前の単位が複数のパッケージにあるときの扱い。

### 5.4 名前の変更の推定

項目・メソッド・メンバーの名前の変更は、今は削除 + 追加になる。ファイルの名前の変更は git の rename で分かる（2.3）。ファイルの中の要素の名前の変更（Apex のメソッド名など）は、中身の類似度で推定する（GumTree の対応付けを使えるところは使う）。依存の差分（3 章）では、名前の変更を推定できると「参照がなくなった」の誤検出が減る。

### 5.5 大きいリポジトリ

- 変わった単位だけ parse する（2.3）。保存済みの解析結果は、ファイルの中身の hash（git の blob の hash）で使い回す。
- Profile は数万行になる。今はすべて読むので、読む時間・保存の大きさを測る（必要なら、表の行を圧縮して持つ）。
- worker_threads（今あり）を 1 つの worker（1.2）でまとめて使う。

### 5.6 解析の正しさの確かめ方

- サンプル（`docs/examples/`）に、種類ごとに「すべての kind が差分に現れる」「表にない要素は意図したものだけ」のテストがある。依存関係（3 章）にも、サンプルの全種類をまたぐ期待値（項目 `Invoice__c.Amount__c` を使うものの一覧など）のテストを置く。
- 実際の組織のメタデータ（公開されているサンプルアプリなど）で、読めない・`skippedElements` が出る要素を洗い出す。

### 5.7 機密の扱い

指定ログイン情報・リモートサイト・メールテンプレート・カスタムメタデータのレコードには、URL・ユーザー名・設定値が入る。レポート・MCP で外に出すとき（AI に渡すとき）に、伏せる項目を決める。

## 6. 進め方（案）

| 順  | 内容                                                                                                                          | 主に関わる章  |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 1   | 道具: `tsconfig.test.json`・改行コード（`.gitattributes`・Prettier）・以前からの失敗テストの整理                              | 1.5           |
| 2   | 単位の種類（`UnitType`）と `Repository`。parser・worker・Diff の一覧を 1 つにする。文字列からの parse の入口をそろえる        | 2.2・1.2・1.3 |
| 3   | 保存データの版。オブジェクトのキーのそろえと保存名の接頭辞                                                                    | 5.2・1.1      |
| 4   | 定義・参照の取り出しを全種類で同じ形にする（今の参照の解析・Flow・LWC・ラベルを寄せる）。依存関係のグラフと、ない参照・逆引き | 3.2・1.4      |
| 5   | Apex の参照（SOQL / DML・呼び出し・型）と、数式の参照の取り出し                                                               | 3.3・5.1      |
| 6   | git の範囲からの before / after（変わった単位だけ）と、変更の影響・依存の差分                                                 | 2.3・3.1      |
| 7   | 分解された形式・メタデータ API の形式・複数のパッケージディレクトリ                                                           | 5.3           |
| 8   | レポートの provider を依存関係のグラフから作る形に置き換え、画面の部品へ                                                      | 3.5           |

## 7. 決めたこと

| 項目                                 | 決めたこと                                                                         |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| キーのそろえ（保存データの作り直し） | 版を上げて作り直す（保存データは parse し直せば作れる）                            |
| 依存関係のノードの細かさ             | 文・式の単位まで（参照ごとに、どの文・式から参照しているかを持つ。3.2）            |
| 数式の parser                        | 参照の取り出しだけを自前で作る（文法が小さく、必要なのは名前の取り出しだけのため） |
| 本文のテキストの差分                 | git の行の差分をレポートで見せる（構造の Diff では「変わった」とだけ出す）         |
| 分解された形式                       | 1 つの単位に組み立てて、今の JSON と同じ形にする（単位の id も同じ）               |
| グラフの保存                         | 保存しない。単位ごとの定義・参照だけを保存し、読み込み時に組み立てる               |

## 8. 進み具合

| 章                       | 済んだこと                                                                                                                                                                                                                                                                                                                                                          | 残り                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1.1 JSON とキー          | objectKey をすべて `sortKeys` してから hash にそろえた（`makeXmlJson` も並べ替える。`makeMetadataJson` は同じもの）。オブジェクト・項目に `skippedElements`。Flow も共通の値の木（`valueTree.ts` の `skip`・`valueTypes`）。単位の名前は `unitName(type, result)`                                                                                                   | オブジェクトの子のうち表で書けるものを `RecordSpec` に移す                                                                |
| 1.2 parser・worker・保存 | 保存データの版（`SAVE_FORMAT_VERSION` = 2。版が違えば保存データなし）。オブジェクトの保存名を `object_<API 名>` にし、`OTHER_SAVE_PREFIXES` をなくした。`ForDevelopper` → `ForDeveloper`。worker は `UnitWorker` 1 つで全種類を扱える（タスク = 単位の種類 + 場所）                                                                                                 | 種類ごとの worker（`ApexWorker` など）を `UnitWorker` に置き換えて消す                                                    |
| 1.3 Diff                 | 並びの差分の部品の使い分けを [commons.md](./commons.md) に書き、名前の並び（レイアウトの項目・ボタン、コンパクトレイアウトの項目、リストビューの列）を `makeOrderedNamesDiff` に直した。単位の Diff は `UnitType.diffs` から引く                                                                                                                                    | provider の比べ方を Diff の結果に寄せる                                                                                   |
| 1.5 テスト・道具         | `tsconfig.test.json`・`npm run typecheck`。Prettier は `endOfLine: auto`。以前からの失敗テストを直した                                                                                                                                                                                                                                                              | `.gitattributes` で改行コードを決める。サンプルのスクリプトを 1 つにまとめる                                              |
| 2 流れの共通化           | `src/analyzer/unit/`: `UnitType`・`UNIT_TYPES`（Apex はクラス・トリガー・匿名 Apex の 3 種類に分けた）、`SourceTree`（作業ツリー `WorkingTree` と git の時点 `GitTree` を同じ形で読む）、`Repository`（全単位の解析・保存・読み込み・変わった単位だけの読み直し）、`changedUnits`・`renamedUnits`・`diffRepositories`（git の rename で id の違う単位を対応付ける）。`GitTree` は `git cat-file --batch` を使用 | 解析・レポートの入力を `Repository` にする（1.4。3 章と一緒に） |

### 8.1 実装との照合（2026-11-06 確認）

以下は、確認時点の作業ツリー（未コミット・未追跡のファイルを含む）を対象にした状況。実装があることと、既存の処理に接続されて利用できることは分けて記載する。今回の追記ではコードの修正・検証の再実行はしていない。

#### 6章の進め方に対する対応状況

| 順 | 状況 | 対応の詳細・実装場所 | 残り |
| --- | --- | --- | --- |
| 1 道具（1.5） | 一部対応 | [tsconfig.test.json](../tsconfig.test.json) と [package.json](../package.json) の `typecheck` で src・テスト・サンプルの型チェックを実行する。[.prettierrc.json](../.prettierrc.json) は `endOfLine: auto` | `.gitattributes` の追加、種類ごとに分かれた [サンプルのスクリプト](./examples/) の統合。テスト側の型エラーと全テストが完走しない問題の確認（8.2） |
| 2 単位の種類と Repository（1.2・1.3・2.2） | 基盤は実装済み、移行は途中 | [unitType.ts](../src/analyzer/unit/unitType.ts) に `UnitType`・`UNIT_TYPES`・`parseUnit`・`diffs` を集約。Apex をクラス・トリガー・匿名 Apex に分けた。[repository.ts](../src/analyzer/unit/repository.ts) で解析・保存・読み込み・変更単位の再解析を共通化。[unitWorker.ts](../src/analyzer/worker/unitWorker.ts) で共通 worker を実装 | 種類ごとの worker は [worker/index.ts](../src/analyzer/worker/index.ts) から引き続き公開され、[worker.test.ts](../test/worker/worker.test.ts) でも使用。既存の解析・レポートを Repository 入力に移す。計画の `UnitType.definitions` / `references` に相当する処理は別モジュールで実装されている |
| 3 保存データの版・キー（1.1・5.2） | 主要部分は対応済み | [parser/commons.ts](../src/analyzer/parser/commons.ts) の `SAVE_FORMAT_VERSION = 2` と版の不一致検出。[unitType.ts](../src/analyzer/unit/unitType.ts) でオブジェクトの保存名を `object_` 付きにした。キー生成は [spanJson.ts](../src/analyzer/types/commons/spanJson.ts) に集約し、XML も [xmlJson.ts](../src/analyzer/types/commons/xmlJson.ts) から利用。[object.ts](../src/analyzer/types/metadata/object.ts)・[field.ts](../src/analyzer/types/metadata/field.ts) に `skippedElements`。[valueTree.ts](../src/analyzer/types/commons/valueTree.ts) の `skip`・`valueTypes` を Flow でも利用。`unitName` も追加 | オブジェクトの子のうち表で書けるものを `RecordSpec` に移す。計画では削除予定の `makeXmlJson` は互換の入口として残り、`makeMetadataJson` はその別名になっている |
| 4 定義・参照と依存グラフ（1.4・3.2） | 取り出し処理まで、グラフは未対応 | [dependency/types.ts](../src/analyzer/processor/dependency/types.ts) に `UnitDefinition`・`UnitReference`・`ReferenceSite`・`UnitDependencies`。[dependency/units.ts](../src/analyzer/processor/dependency/units.ts) にオブジェクト・LWC・フォルダ単位メタデータの定義・参照の取り出し。参照元のメンバー・文・式のキーを保持する | グラフ本体、逆引き、ない参照先、推移的依存、循環、未使用の検出。標準・管理パッケージ・自名前空間の分類。取り出し処理を本番の解析に接続し、既存の参照チェックを統合する。`MetadataContext`・`ReferenceInputs`・`MetadataSnapshot` と指摘の種類別プロパティも残っている |
| 5 Apex と数式の参照（3.3・5.1） | 取り出し処理を実装、利用側は未接続 | [dependency/apex.ts](../src/analyzer/processor/dependency/apex.ts) で SOQL / SOSL・DML・呼び出し・型・Label・Schema・カスタム権限・トリガーの対象を取り出す。[dependency/formula.ts](../src/analyzer/processor/dependency/formula.ts) で数式をトークン化して参照を取り出す。[dependency/units.ts](../src/analyzer/processor/dependency/units.ts) で参照項目・積み上げ集計・制御項目・lookupFilter、LWC import などを共通形式にする | グラフでの参照解決と本番利用。実装があることだけでは全構文の網羅・参照解決の正確性までは保証しない |
| 6 git の範囲と変更の影響（2.3・3.1） | 差分の入口は対応、依存の影響は未対応 | [sourceTree.ts](../src/analyzer/unit/sourceTree.ts) の `WorkingTree`・`GitTree` で同じ形で読み、`GitTree` は `git cat-file --batch` を使用。[repository.ts](../src/analyzer/unit/repository.ts) の `changedUnits`・`renamedUnits`・`update`・`diffRepositories` で変更単位の再解析と git rename による対応付け。[repository-git.test.ts](../test/unit/repository-git.test.ts) にテスト | `getImpact`・`diffDependencies`、変更していないが影響を受ける単位の算出。git blob の hash に基づく解析結果のキャッシュ |
| 7 ソース形式（5.3） | 一部対応 | [decomposed.ts](../src/analyzer/parser/Metadata/decomposed.ts) の `assembleDecomposed` と [unitType.ts](../src/analyzer/unit/unitType.ts) で分解されたファイルを単位に組み立てる。[project.ts](../src/analyzer/unit/project.ts) の `ProjectTree` は `packageDirectories` と `.forceignore` を扱う。[decomposed.test.ts](../test/unit/decomposed.test.ts)・[project.test.ts](../test/unit/project.test.ts) にテスト | `.workflow` などメタデータ API 形式の対応。同じ種類・同じ名前が複数パッケージにある場合の方針。ProjectTree の存在だけで既存の全入口への適用完了とはしない |
| 8 レポート・書き出し・MCP（3.5） | グラフとの接続は未対応 | 既存の [report/](../src/analyzer/report/) の provider と [mcp/server.ts](../src/mcp/server.ts) は存在するが、依存グラフを入力にしていない。レポートは `MetadataSnapshot` と `compareKeyed` を引き続き利用 | `dependency.graph` / `impact` / `unused` / `missing`、既存 crossRef のグラフ利用、Mermaid / DOT / `package.xml` の書き出し、依存・影響を問い合わせる MCP ツール。provider の単位 status を構造 Diff に寄せる |

#### その他の項目

| 章 | 対応状況・場所 | 残り |
| --- | --- | --- |
| 4 構造の Diff と git diff | 構造 Diff は [processor/](../src/analyzer/processor/) にあり、共通の一覧から呼び出せる。git の変更ファイルから対象単位も決められる | 本文の行差分をレポートで見せる部分。表で書ける種類の Diff の共通化を継続する |
| 5.4 要素の名前の変更 | ファイルの rename は `renamedUnits` で対応。共通の GumTree matcher は [matcher.ts](../src/analyzer/processor/commons/diff/gumtree/matcher.ts) にある | 項目・メソッドなど内部要素の名前の変更を、依存の差分で利用できる形にする。GumTree の存在だけで全種類の rename 対応済みとはしない |
| 5.5 大きいリポジトリ | 変更単位だけの再解析、共通 worker、git の batch 読み込みを実装 | blob hash によるキャッシュ、Profile の読み込み時間・保存サイズの計測 |
| 5.6 正しさの確認 | [dependency/references.test.ts](../test/dependency/references.test.ts) で複数種類の定義・参照と数式を確認。[unit/](../test/unit/) に Repository・git・分解形式・プロジェクト範囲のテスト | 依存グラフ・影響範囲の期待値テスト、公開サンプルでの読めない要素・`skippedElements` の調査。全テストの完走確認 |
| 5.7 機密の扱い | [report/mask.ts](../src/analyzer/report/mask.ts) に `maskSensitive`・`isSensitiveDataType` と種類別の対象プロパティを実装。[mask.test.ts](../test/dependency/mask.test.ts) の2件は個別実行で成功 | レポート・MCP の出力経路への接続。関数の実装だけでは、出力時のマスキングは有効にならない |

### 8.2 検証結果（2026-11-06 確認時点）

- `npm run typecheck`: src のチェックは成功し、テスト側のチェックで失敗。[decomposed.test.ts](../test/unit/decomposed.test.ts) の確認時点の155行目で、`SourceObject[]` を `sourceKeys` を必須とする別型の配列に変換しているため TS2352 が発生した。
- `npm test`: 最初は `ttsx` の emitted-source ownership / source changed エラーで停止。再実行は複数スイートが成功したものの、`MetadataProcessor with object translations` の成功出力の後に長時間進まなかったため中断した。全件成功とは判定しない。どのテスト・処理が停止原因かは未特定。
- 追加の個別実行も複数がタイムアウトしたため、全体の成否・停止原因は確定していない。マスキングのテストのみ2件の成功を確認した。
- [test/run.ts](../test/run.ts) に [project.test.ts](../test/unit/project.test.ts)・[decomposed.test.ts](../test/unit/decomposed.test.ts)・[mask.test.ts](../test/dependency/mask.test.ts) の import がなく、通常の `npm test` では実行されない。
- [dependency/types.ts](../src/analyzer/processor/dependency/types.ts) のコメントには `graph.ts` が登場するが、確認時点では同ファイルは未作成。
- 実装の主要部分は未コミット・未追跡ファイルに含まれるため、この表はコミット済みの機能一覧ではない。
