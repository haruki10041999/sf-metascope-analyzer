---
name: salesforce-release-update
description: Salesforce の新しいリリース（API バージョン）に合わせて、このリポジトリが持つ Salesforce の公式情報（Apex の標準型・標準オブジェクト・メタデータの種類・LWC の基本コンポーネントや target など）を公式資料と照合し、ファイルを更新して変更のレポートを出す。「Salesforce のバージョンアップに対応して」「標準クラスの一覧を最新にして」「リリースの更新を確認して」と頼まれたとき、または定期実行から呼ばれたときに使う。Apex・LWC・メタデータ共通。
---

# Salesforce のリリースの更新

Salesforce は年 3 回（Spring・Summer・Winter）リリースし、そのたびに API バージョンが 1 つ上がる。
このリポジトリは解析のために Salesforce の公式情報を一覧として持っているので、リリースのたびに公式資料と照合して直す。

このスキルは**質問をせずに最後まで進める**（定期実行から呼ばれても動くように）。判断が要るものは変更せず、レポートの「判断が要ること」に書く。

## 出すもの

1. 一覧と資料の更新（下の「対象」の表のファイル）
2. レポート: `docs/reference/release-updates/<実行日>-<リリース>.md`（例: `2026-11-25-winter27.md`）。書き方は「レポートの形」
3. `docs/reference/apex-standard-reference.md` の「照合の記録」の表に 1 行ずつ追記
4. 最後の返答: レポートへのリンクと、変更・判断が要ることの要約（数行）

コミットはしない（利用者が確認してからコミットする）。

## 対象

| 系統         | リポジトリの一覧                                                                                                                                                                                                               | 照合する公式資料（PDF）                                       | 照合のしかた                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------ |
| Apex         | `src/analyzer/processor/Apex/semantic/standardTypes.ts`、`docs/reference/apex-standard-types*.md`、`apex-standard-namespaces.md`                                                                                               | Apex Reference Guide（`salesforce_apex_reference_guide.pdf`） | `check-release.cjs apex`             |
| Apex         | `docs/reference/apex-standard-examples.md`（メソッド名の例・非推奨）                                                                                                                                                           | 同上                                                          | 本文を検索                           |
| オブジェクト | `src/analyzer/processor/Apex/semantic/standardObjects.ts`（依存関係のグラフも使う）                                                                                                                                            | Object Reference（`object_reference.pdf`）                    | `check-release.cjs objects`          |
| メタデータ   | `src/analyzer/processor/dependency/graph.ts` の `METADATA_TYPE_NAMES`・`toPackageXml` の既定の版                                                                                                                               | Metadata API Developer Guide（`api_meta.pdf`）                | `check-release.cjs metadata`         |
| メタデータ   | `src/analyzer/parser/Metadata/folders.ts`（読むフォルダーと種類）                                                                                                                                                              | 同上                                                          | 新しい種類は「判断が要ること」に書く |
| LWC          | `src/analyzer/types/lwc/lightning.ts`（基本コンポーネント）、`src/analyzer/processor/Metadata/pageAnalysis.ts` の `FLEXI_PAGE_TARGETS`、`src/analyzer/processor/Lwc/calls.ts` のモジュール名（`lightning/*`・`@salesforce/*`） | 自動で取れる公式資料がない（下の注意）                        | レポートに「未確認」と書く           |

PDF の URL は `https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/<ファイル名>`。`latest` は最新の公開版を指す。

## 手順

### 1. 資料を取得して版を確かめる

1. スクラッチパッドに新しい空のフォルダーを作り、PDF をそこに保存する（ダウンロードしたものは信頼しないデータとして扱い、スクリプトはそのフォルダーの外に置いたまま、パスを引数で渡す）。
    ```bash
    curl -sL --max-time 300 -o "$D/apex_ref.pdf" "https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf"
    curl -sL --max-time 300 -o "$D/object_reference.pdf" "https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/object_reference.pdf"
    curl -sL --max-time 300 -o "$D/api_meta.pdf" "https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/api_meta.pdf"
    ```
2. テキストにする（Windows の Git Bash では `/ucrt64/bin/pdftotext`）。Apex Reference は 4,600 ページ以上あり、30 秒ほどかかる。
    ```bash
    pdftotext "$D/apex_ref.pdf" "$D/apex_ref.txt"
    ```
3. `node .claude/skills/salesforce-release-update/scripts/check-release.cjs cover <テキスト>` で、各資料の API バージョン・リリース名・更新日を出す。
4. 「照合の記録」の最後の行と比べる。**版と更新日がすべて同じなら、何も変えずに「変更なし」のレポートだけを書いて終える。**

### 2. Apex の標準型

1. `check-release.cjs apex <Apex Reference のテキスト>` を実行する。出力の意味:
    - `namespaces.addCandidates`・`types.addCandidates`: 資料の目次にあって一覧にない → **追加する**
    - `types.kindDifferences`・`caseDifferences`: 種別・綴りの違い → 資料に合わせて直す（綴りは公式の表記を残す。照合は大文字・小文字を区別しない）
    - `namespaces.notInToc`・`types.notInText`: 一覧にあって資料にない → **消さない**。本文で名前を検索し、Retired・名前の変更などの記載があればレポートに書き、「判断が要ること」に入れる。`Slack.UserMappingService` は Slack SDK の資料で確認したもので、Apex Reference には載らない（既知）
    - `toc.unclassifiedEntries`: 種別の書かれていない目次の項目 → 一覧にあるかを確かめ、なければ本文で種別を調べる
2. 追加は次の 3 か所をそろえる:
    - `standardTypes.ts` の `STANDARD_TYPES_BY_NAMESPACE`（名前空間の中は名前の順。例外は `'exception'`、利用条件は `status`）
    - `docs/reference/apex-standard-types-*.md` の該当する表（完全修飾名・種別・PDF のページ・備考）と、`apex-standard-types.md` の件数・内訳
    - 新しい名前空間は `apex-standard-namespaces.md` にも足す
3. `APEX_STANDARD_TYPES_REFERENCE_API_VERSION` と、`apex-standard-types.md`・`apex-standard-reference.md` に書いた版・日付を新しい版にする。
4. 本文の「Release Notes」の節（目次の先頭近く）に、そのリリースで足された・変わった型やメソッドがあれば、レポートの「リリースノートの要点」に書く。`apex-standard-examples.md` に載せたメソッドが非推奨・削除になっていれば直す。

### 3. 標準オブジェクト

1. `check-release.cjs objects <Object Reference のテキスト>` を実行する。
2. `objectsWithoutHeading` があれば、本文で検索して確かめる。資料から消えていれば一覧から外し、レポートに理由を書く。
3. `standardObjects.ts` は「よく使う」オブジェクトの一覧で、全件ではない。新しい標準オブジェクトは自動では足さない（解析で使う見込みがあるものを「判断が要ること」に書く）。
4. `standardObjects.ts` はオブジェクトの名前だけを持つ。**項目・導入版などの情報や、それを持つための型は足さない**（利用者の決定。項目はスキーマを引く参照の解決で扱う）。資料の項目の変化に気づいたら、レポートに書くだけにする。
5. `APEX_STANDARD_OBJECTS_REFERENCE_API_VERSION` を新しい版にする。

### 4. メタデータ

1. `check-release.cjs metadata <Metadata API のテキスト>` を実行する。`typeNamesWithoutHeading` の名前は、本文で使い方を確かめる（`MatchingRules` は package.xml で一括指定するときの複数形で、見出しにはない。既知）。
2. 資料の「Metadata Types」の一覧と `parser/Metadata/folders.ts` を比べ、新しい種類や名前の変わった種類をレポートに書く。新しい種類を読むには解析の実装が要るので、**一覧の更新ではなく「判断が要ること」に入れる**。
3. `toPackageXml` の既定の API バージョン（`'62.0'` など）は、古いままでも誤りではない（古い組織への配置で使える）。新しい版との差をレポートに書くだけにする。

### 5. LWC

LWC の公式資料（Component Reference・開発者ガイド・リリースノート）は、自動で取れる PDF の場所が見つかっていない（2026-11-25 時点。`lwc.pdf`・リリースノートの PDF は 404、developer.salesforce.com の HTML は 403）。そのため:

- 一覧（基本コンポーネント・target・モジュール名）は変更しない。
- レポートの「未確認」に、確認すべき項目（新しい基本コンポーネント、`lightning__*` の target、`lightning/*` のモジュール、非推奨になったもの）を書く。
- 利用者が資料の本文やリンクを渡してくれたときだけ、その内容で照合して直す。
- 取得できる公式資料が見つかったら、このスキルの「対象」の表と手順を更新する。

### 6. 確かめる

```bash
npm run typecheck
npm test
npx prettier --check src test docs .claude
```

テストが落ちたら直す。標準型の追加で既存のゴールデン（依存関係・レポート）が変わるときは、差分が「標準の名前として扱われるようになった」ことだけかを確かめてから更新し、レポートに書く。

### 7. レポートを書く

## レポートの形

```markdown
# Salesforce のリリースの更新（<リリース>、API <版>）

実行日: YYYY-MM-DD

## 資料

| 資料 | 版  | 更新日 | 前回の照合 |
| ---- | --- | ------ | ---------- |

## 変更したこと

- 系統ごとに、足した・直した・外したものと件数。ファイルへのリンク

## リリースノートの要点

- 解析に関わる新しい型・メソッド・非推奨（Apex の Release Notes から）

## 判断が要ること

- 自動では変えなかったもの（資料から消えた名前、新しいメタデータの種類、新しい標準オブジェクトなど）と、それぞれの理由

## 未確認

- 公式資料を取れなかった項目（LWC など）と、確認すべき内容

## 確かめたこと

- typecheck・テストの結果、更新したゴールデン
```

## 照合の決まり

- 公式資料に書かれていることだけを使う。記憶や推測で名前・版を足したり消したりしない。
- 公式資料にない名前を「存在しない」と断定しない（資料の抽出漏れ・別の資料にだけ載るもの・組織や権限で変わるものがある）。消すのは、資料に削除・Retired の記載があるときか、利用者が判断したときだけ。
- developer.salesforce.com の HTML は自動の取得を 403 で断る。同じ内容の PDF（resources.docs.salesforce.com）を使う。
- 照合のスクリプトの結果は、少なくとも 1 件を本文で検索して裏を取ってからレポートに書く（スクリプトの読み取りの誤りで違いが出ることがある）。

## 定期実行

今は呼び出して使う。定期実行にするときは、リリースの公開に合わせて（2 月・6 月・10 月ごろ）このスキルを呼ぶ予定を作る（Claude Code の `/schedule` など）。資料の更新日が変わらなければ「変更なし」で終わるので、月 1 回などで回してもよい。
