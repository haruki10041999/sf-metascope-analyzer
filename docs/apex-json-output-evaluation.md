# apex JSON 出力の評価（サイズ・カバー率）

対象: [docs/examples/apex-json](examples/apex-json) で生成した JSON（2026-10-29 時点の実装。境界ノードは現在の `JsonType` / `StructureJson` のみ）

関連: [apex-json-layer-policy.md](apex-json-layer-policy.md)（方針）、[apex-json-boundary-inventory.md](apex-json-boundary-inventory.md)（境界ノードの一覧）

> **2026-10-29 追記**: 8 章の J1〜J6・X1・F1〜F10 に対応した。対応後の再評価は 9 章にまとめた。2〜6 章の数値は対応前のもの。

## 1. 評価方法

1. `npx ttsx --noCheck docs/examples/apex-json/generate-json-pipeline.ts` で、サンプルごとに段階別の出力を作る。
   - `1.common-type.json`: `CommonType`
   - `2.convert-node.json` / `2.source-all.json`: `ConvertNode` と、絞り込む前の `SourceJson[]`
   - `3.json.json`: 生成した JSON
   - `4.source.json`: JSON に残ったキーだけの `SourceJson[]`
2. `npx ttsx --noCheck docs/examples/apex-json/evaluate-json.ts` で評価し、各フォルダに `5.evaluation.json` を出力する。

サンプル:

| サンプル | 内容 | ソースサイズ |
| --- | --- | --- |
| ParserTest.cls | IR の全ノード種別を網羅するクラス | 22,889 B |
| ParserTrigger.trigger | トリガー | 6,091 B |
| parser.apex | 匿名 Apex | 7,316 B |
| broken.apex | 構文エラーを含む匿名 Apex（エラー経路の確認用） | 121 B |

評価項目:

| 項目 | 定義 |
| --- | --- |
| サイズ | 改行・インデントなし（minified）の JSON バイト数と、gzip 後のバイト数 |
| 文字カバー率 | ソースの空白以外の文字のうち、`SourceJson` のどれかの範囲（`start.offset`〜`end.offset`）に入る割合 |
| 行カバー率 | 空行・`//` コメント行を除いた行のうち、`SourceJson` のどれかの範囲にかかる行の割合 |
| 値の保持率 | `CommonType` の文字列・数値（`type` / `sourceInfo` / `errorCode` / `contextType` / `valueType` を除く）が、JSON に同じ個数だけ残っている割合（多重集合で比較） |
| 構造 | JSON 内のオブジェクトを、境界ノード（`kind` + `sourceKeys`）、`type` だけを持つもの、判別キーなしの 3 つに分類 |
| 整合性 | JSON の `sourceKeys` がすべて `4.source.json` から引けるか |

---

## 2. 結果サマリ

| サンプル | JSON（minified） | うち sourceKeys | 4.source.json | 文字カバー率 | 行カバー率 | 値の保持率 | 引けないキー |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ParserTest.cls | 207.0 KB（ソースの 9.0 倍） | 66.0% | 189.9 KB | 64.8% | 81.3% | 99.6% | 0 |
| ParserTrigger.trigger | 37.7 KB（6.2 倍） | 58.0% | 32.6 KB | 52.2% | 67.7% | 100%（修正後） | 0 |
| parser.apex | 66.9 KB（9.1 倍） | 57.6% | 52.4 KB | 41.7% | 75.9% | 99.8% | 0 |
| broken.apex | 2.9 KB | 69.9% | 3.0 KB | 92.4% | 83.3% | 60.0% | 0 |

**要点**

- **値はほぼ失われていない**（99.6〜100%）。失われているのは SOSL の生テキストだけ（4 章）。trigger の名前と対象オブジェクトの欠落は修正済み。
- **JSON の 6 割前後が `sourceKeys`** で、残りの中身はソースの約 3 倍。ハッシュの長さが効いている（3 章）。
- **位置情報は大幅に減った**（source 件数は 9〜13% に減少）。一方で文字カバー率は 4〜6 割になり、**宣言の名前、フィールドの初期値、enum の定数などは位置を引けない**（5 章）。
- **JSON のオブジェクトの約半数が判別キーなし**（式など）。`kind` でも `type` でも見分けられない（6 章）。
- **整合性は問題なし**。JSON の `sourceKeys` はすべて `4.source.json` から引ける。

---

## 3. サイズ

### 3.1 段階ごとのサイズ（minified）

| サンプル | ソース | CommonType | ConvertNode | source（全件） | **JSON** | JSON（sourceKeys 除く） | **source（絞り込み後）** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ParserTest.cls | 22.9 KB | 976.7 KB | 1,122.2 KB | 1,408.7 KB | **207.0 KB** | 70.5 KB | **189.9 KB** |
| ParserTrigger.trigger | 6.1 KB | 207.3 KB | 244.5 KB | 309.5 KB | **37.7 KB** | 15.8 KB | **32.6 KB** |
| parser.apex | 7.3 KB | 389.5 KB | 486.5 KB | 597.1 KB | **66.9 KB** | 28.3 KB | **52.4 KB** |

- 保存するのは JSON と絞り込み後の source の 2 つ。合計はソースの 11〜17 倍になる（ParserTest で 397 KB）。
- gzip 後は、ParserTest の JSON が 53.3 KB、source が 59.9 KB（合計でソースの約 5 倍）。
- `CommonType` / `ConvertNode` / 絞り込む前の source は中間データで、保存しない。それでも 1 ファイルあたり 1 MB 前後になるため、メモリ上の大きさとしては意識が必要。

### 3.2 sourceKeys の比率

JSON の 58〜66% が `sourceKeys` です。

- キー 1 つは `<型名>_<SHA-256 の 64 桁>` で、`objectKey` と `sourceKey` の 2 つで 1 ノードあたり約 170 バイトになる。
- `4.source.json` にも同じ文字列が並ぶので、ハッシュの長さは両方のファイルに効く。

**改善案**: ハッシュを 16 桁に短縮すると、1 ノードあたり約 96 バイト減る。ParserTest では JSON で約 65 KB（31%）、source でもほぼ同じ量が減る見込み。衝突の確率は、1 ファイル数千ノードの規模なら実用上問題にならない。

### 3.3 位置情報の絞り込み効果

| サンプル | objectKey（全件 → 絞り込み後） | source 件数（全件 → 絞り込み後） | バイト数 |
| --- | --- | --- | --- |
| ParserTest.cls | 2,705 → 422 | 5,048 → 676（13.4%） | 1,408.7 KB → 189.9 KB（13.5%） |
| ParserTrigger.trigger | 656 → 85 | 1,109 → 108（9.7%） | 309.5 KB → 32.6 KB |
| parser.apex | 1,318 → 122 | 2,185 → 195（8.9%） | 597.1 KB → 52.4 KB |

- 同じ内容のノードは `objectKey` を共有する。たとえば ParserTest では、`modifier("private")` が 33 か所、`typeRef("String")` が 30 か所、`typeRef("Integer")` が 25 か所で 1 つの `objectKey` にまとまっている。
- 境界ノードの範囲（スパン）の中央値は 8〜23 文字で、細かい単位で位置を持てている。最大は ParserTest の `return` 文で 1,142 文字（大きな SOQL を含む）。部分木全体で検査する方針なので、この SOQL のどこか 1 か所でエラーが起きると、`return` 全体が `ErrorJson` になる。

---

## 4. 値の保持率

| サンプル | 対象の値 | 保持 | 保持率 | 失われた値 |
| --- | --- | --- | --- | --- |
| ParserTest.cls | 1,224 | 1,219 | 99.6% | SOSL の生テキスト 5 件（`[FIND 'test'` など） |
| ParserTrigger.trigger | 369 | 369 | 100% | なし（修正前は trigger 名 `ParserTrigger` が欠落し、保持率 99.7%） |
| parser.apex | 519 | 518 | 99.8% | SOSL の生テキスト 1 件 |
| broken.apex | 15 | 9 | 60.0% | `accs`、`foo`、`Id` など（エラーで置き換えた範囲の中身） |

- **trigger の名前と対象オブジェクト**: `TriggerUnitJson` に `name` / `object` を追加して修正済み。再評価で、ParserTrigger の保持率は 100% になった（`name: "ParserTrigger"`、`object: "Account"`）。
- **SOSL の生テキスト**は、`find` に検索語だけを正規表現で取り出しているため、元の値としては残らない（レビュー P8）。検索語自体は残っている。
- **broken.apex** の低い保持率は想定どおり。`ErrorJson` に置き換えた境界ノードの中身は出力しない方針のため。

---

## 5. 位置情報のカバー率

| サンプル | 文字（全件） | 文字（絞り込み後） | 行（全件） | 行（絞り込み後） |
| --- | --- | --- | --- | --- |
| ParserTest.cls | 99.4% | 64.8% | 99.2% | 81.3% |
| ParserTrigger.trigger | 98.6% | 52.2% | 100% | 67.7% |
| parser.apex | 96.3% | 41.7% | 100% | 75.9% |

カバーされない行の内訳（絞り込み後）:

| サンプル | 合計 | 閉じ括弧のみ | コメント・その他 | 複合文のキーワード行 | 宣言・注釈 |
| --- | --- | --- | --- | --- | --- |
| ParserTest.cls | 96 | 76 | 13 | 5（`} else {`、`do {`、`try {`） | 2（`static {`、`enum EmptyEnum {}`） |
| ParserTrigger.trigger | 42 | 29 | 11（`before insert,` などのトリガー条件） | 1 | 1（`trigger ParserTrigger on Account (`） |
| parser.apex | 42 | 22 | 17（enum の定数 `OPEN,`、フィールド初期値の `new Account(...)` など） | 3 | 0 |

- 行単位で見ると、閉じ括弧とコメントを除けば、ほとんどの行は何らかの境界ノードにかかっている。
- 文字単位では 4〜6 割にとどまる。次の部分は、境界ノードの範囲に入らないため位置を引けない。
  - クラス名・メソッド名・メソッドのシグネチャ（修飾子・型・引数は境界ノードなので引ける）
  - **フィールド・トップレベル変数の初期値**（宣言も式も非境界のため、初期値全体に位置がない）
  - enum の定数、trigger の名前・対象・条件（`before insert` など）
  - 複合文のキーワード（`if` / `else` / `try` など）とブロックの括弧
- 「この JSON ノードがソースのどこか」を引く用途では、宣言とフィールド初期値に位置がないことが一番の制約になる。境界ノードを増やさない方針を前提にするなら、これを許容するか確認が必要。

---

## 6. JSON の構造

| サンプル | オブジェクト数 | 境界ノード | `type` だけ | 判別キーなし | ErrorJson |
| --- | --- | --- | --- | --- | --- |
| ParserTest.cls | 1,764 | 676（38.3%） | 232（13.2%） | 856（48.5%） | 0 |
| ParserTrigger.trigger | 385 | 108（28.1%） | 61（15.8%） | 216（56.1%） | 0 |
| parser.apex | 735 | 195（26.5%） | 131（17.8%） | 409（55.6%） | 0 |
| broken.apex | 28 | 10 | 9 | 9 | 4 |

- **判別キーのないオブジェクトが約半数**ある。中身は主に式（呼び出し・演算・new など）、`ModifiersJson`、select / from / where の入れ物。利用側は構造から種類を推測するしかない（レビュー P2、B6）。境界ノードを増やさない方針でも、`kind` だけを付けることはできる（[apex-json-layer-policy.md](apex-json-layer-policy.md) 3.2 の `KindJson`）。
- 境界ノードの kind 別件数（ParserTest の上位）: `type` 170、`modifier` 80、`localVariable` 75、`expression` 74、`selectEntry` 68。境界ノードの 25% を `type` が占め、キーのサイズにも効いている。内側の型（ジェネリクス、配列の要素型）も境界ノードになっていることが原因（レビュー D2）。
- broken.apex では、`ErrorJson` が `kindType: "expression"`（境界ノードごと置き換え）と `kindType: "unit"`（unit 直下で取り出せなかったメンバー）の 2 種類で出ている。内容が同じエラー 2 件は、1 つの `objectKey` にまとまっている。

---

## 7. 改善候補（優先度順）

| # | 内容 | 効果 | 関係する章 |
| --- | --- | --- | --- |
| 1 | ~~`TriggerUnitJson` に trigger 名と対象オブジェクトを追加する~~（対応済み） | 値の欠落の解消 | 4 |
| 2 | `objectKey` / `sourceKey` のハッシュを短縮する（例: 16 桁） | JSON・source ともに約 3 割縮小 | 3.2 |
| 3 | 判別キーのないノードに `kind` だけを付ける（キーは付けない） | 利用側での判別。サイズへの影響は小さい | 6 |
| 4 | 内側の型（ジェネリクス・要素型）を境界から外す | `type` の境界ノードとキーを削減 | 6 |
| 5 | フィールド初期値・宣言名に位置がないことを許容するか決める | 位置を引けない範囲の明確化 | 5 |
| 6 | SOSL の検索語の取り出しを IR / converter 側に移す | 生テキストの再解析をなくす | 4 |

#2 と #4 は出力形式を変えるので、利用側（ビューア等）への影響を確認してから進めてください。

---

## 8. 修正候補と JsonType 化の候補（再評価後の一覧）

### 8.1 JsonType / StructureJson にする候補

境界ノードは増やさない方針ですが、評価結果から根拠のあるものを挙げます。増やすかどうかの判断材料にしてください。

| # | 対象（現在の型） | 現状 | JsonType にした場合の効果 | 推奨 |
| --- | --- | --- | --- | --- |
| J1 | フィールド宣言（`FieldDeclarationJson`）、匿名 Apex のトップレベル変数 | 宣言も初期値の式も非境界のため、**初期値全体に位置がない**（parser.apex の `new Account(...)` の行など）。初期値の中のエラーは、その位置の `ErrorJson` にしかならない | 初期値を含む宣言の位置が引ける。初期値のエラーが宣言単位にまとまる（単文の `localVariable` と同じ扱いになる） | **高** |
| J2 | メソッド・コンストラクタ宣言（`MethodDeclarationJson` / `ConstructorDeclarationJson`） | メソッド名とシグネチャの位置がない。解析結果から「どのメソッドか」へジャンプできない | メソッド単位のジャンプ。ただし本体まで範囲に含めるとエラーがメソッド全体に広がるので、`StructureJson` で名前・シグネチャの位置だけを持つ形がよい | **高**（`StructureJson`、本体は検査対象外） |
| J3 | クラス・インターフェース・enum・プロパティ宣言 | J2 と同じく名前の位置がない | 宣言単位のジャンプ。J2 と同じく、本体は検査対象外にする | 中 |
| J4 | SOQL / SOSL 全体（`SoqlJson` / `SubQueryJson` / `SoslJson`） | クエリ全体の位置がない。サブクエリの select 要素は `kind` も `sourceKeys` も持たない（境界 N7） | クエリ単位のジャンプ。select 要素のサブクエリにもキーが付く | 中 |
| J5 | 複合文（if / for / while / doWhile / switch / try / runAs） | 文全体と `else` / `try` などのキーワードの位置がない | 文単位のジャンプ。本体は検査対象外の `StructureJson` にする | 中 |
| J6 | trigger の条件（`before insert` など）、enum の定数 | 位置がない（行カバー率の低下要因） | 条件・定数の位置が引ける | 低 |

逆に、**境界から外す候補**:

| # | 対象 | 理由 |
| --- | --- | --- |
| X1 | 内側の型（ジェネリクス・配列の要素型・Map のキー／値型） | 境界ノードの 25% を `type` が占める。List / Set / Map / 配列では、親がキーを剥がしており、作ったキーを捨てている（レビュー D2） |

**位置は不要だが `kind` を付けるべき型**（`KindJson`、6 章）: 式（`DotMethodCallJson` / `MethodCallJson` / `NewInstanceJson` / `CastJson` / `SubJson` / `ArrayJson` / `FormulaJson` / `InstanceofJson` / `UnaryJson` / `TernaryJson`）、`LiteralPrimaryJson`。今はフィールド参照 `a.b` と引数なしの呼び出し `a.b()` を区別できない（レビュー B6）。

### 8.2 修正候補（コード）

再評価の時点でコードに残っているもの。

| # | 場所 | 内容 | 優先度 |
| --- | --- | --- | --- |
| F1 | [unit.ts](../src/analyzer/types/apex/unit.ts) `makeTriggerUnitJson` | 今回追加した `target.value[0]!` / `[1]!` が非 null アサーションになっている。構文エラーからの回復で要素が足りないと `undefined.value` で落ちる。足りない場合は `ErrorJson` にする | 高 |
| F2 | [modifier.ts](../src/analyzer/types/apex/modifier.ts) `makeModifiersJson` | 修飾子の分類に else がなく、どれにも当たらない修飾子は何も残らず捨てられる（レビュー B7） | 中 |
| F3 | [declaration.ts](../src/analyzer/types/apex/declaration.ts) `ClassDeclarationJson.constructor` | プロパティ名が `Object.prototype.constructor` と衝突する（レビュー B8）。`constructors` などに改名する | 中 |
| F4 | [query/soqlFunction.ts](../src/analyzer/types/apex/query/soqlFunction.ts) DISTANCE / 座標 | `target[0]!` と `as` で位置決め打ちで取り出している（レビュー B10） | 中 |
| F5 | [commons](../src/analyzer/types/apex/commons) の `convert.ts` | `objectKey` / `sourceKey` のハッシュ長（3.2）。短縮すると JSON と source の両方が約 3 割縮小する | 中 |
| F6 | [query/sosl.ts](../src/analyzer/types/apex/query/sosl.ts) `makeSoslJson` | `FIND` の検索語を正規表現で取り出している（レビュー P8）。IR / converter 側で取り出す | 低 |
| F7 | [statement.ts](../src/analyzer/types/apex/statement.ts) | kind 名の表記ゆれ（`ifConditionJson` / `whileConditionJson` / `doWhileConditionJson` の `Json` 付き、`type: 'WhileStatement'` の大文字）。型ガードの `export const IfConditionJson` が型名と同名（`isIfConditionJson` の誤り） | 低 |
| F8 | [statement.ts](../src/analyzer/types/apex/statement.ts) `makeCatchConditionJson` | catch 本体を検査範囲から外す例外処理。方針（部分木全体）の例外として残してよいか確認が必要 | 確認 |
| F9 | `test/converter/` | 古い API・古い出力形式を前提にしたテスト（`modifier-json` / `restore-json` / `source-output` / `query-commons` / `examples`）。現状の出力に合わせて直すか、削除する | 中 |
| F10 | commons の命名 | `isSpicifyConvert` / `isSpicifyConvertExcludeError`（Specify の誤字）、`parentheSize` など | 低 |

---

## 9. 対応後の再評価（J1〜J6・X1・F1〜F10）

8 章の候補にすべて対応したうえで、`generate-json-pipeline.ts` / `evaluate-json.ts` を再実行した結果です。

### 9.1 対応内容

| # | 対応 |
| --- | --- |
| J1 | field 宣言を境界ノード（`JsonType<'field'>`）にした。初期値まで含めて部分木全体を検査する |
| J2 / J3 | method / constructor / class / interface / interfaceMethod / enum / property を `StructureJson` にした。`sourceKeys` は `base`（宣言全体）と `name`（名前）。検査はノード自身だけで、本体・引数・型は子の変換関数がエラーを処理する |
| J4 | SOQL / サブクエリ / SOSL 全体を境界ノード（`soql` / `subQuery` / `sosl`）にした。検査はノード自身だけ |
| J5 | 複合文を境界ノード（`if` / `for` / `while` / `doWhile` / `switch` / `try` / `runAs`）にした。検査はノード自身だけ |
| J6 | trigger の条件（`triggerCase`）と enum の定数（`enumConstant`）を境界ノードにした |
| X1 | 型は最上位だけを境界ノードにし、ジェネリクス・要素型はキーを持たない `TypeContentJson` にした |
| F1 | trigger 名・対象が欠けた場合は `ErrorJson` にする（非 null アサーションを削除） |
| F2 | どの分類にも当たらない修飾子を `other` に入れる。判別を `isModifierJson`（name を既知の修飾子に限る）から `kind` に変更 |
| F3 | `ClassDeclarationJson.constructor` → `constructors` |
| F4 | DISTANCE / 座標の引数の形を確認し、想定外なら `ErrorJson` にする |
| F5 | `objectKey` / `sourceKey` のハッシュを 16 桁に短縮 |
| F6 | SOSL の検索語の取り出しを converter（`extractFindSearchTerm`）に移し、JSON 層の正規表現を削除 |
| F7 | kind 名の整理（`ifCondition` / `whileCondition` / `doWhileCondition`）、`isIfConditionJson` の命名、`errorKind` を成功時の kind と同じ値に |
| F8 | catch 句の例外処理を `convertValue` の `exclude: ['block']` に置き換えた（catch 本体だけ検査対象外）。`sourceKeys` に `exception` / `exceptionType` の位置を持つ |
| F9 | 古いテストを現行の API に合わせて書き直し（examples / modifier-json / query-commons / output-types）、削除済み API だけを検証していたもの（restore-json / source-output / source-info-type）を削除。エラー処理の回帰テスト（json-error-handling）を追加 |
| F10 | `isSpicify*` → `isSpecify*`、`parentheSize` → `parentheses`、`isWhenJson` → `isTypeOfBlockJson` |

境界ノードの検査範囲を指定するため、`convertValue` に `options` を追加した。

- `exclude`: エラー検査の対象外にするプロパティ。`'children'` を指定すると、ノード自身だけを検査する
- `record`: `StructureJson` の `sourceKeys` に集める子ノード（`{ JSON 側の名前: 変換元のプロパティ名 }`）

### 9.2 結果（対応前 → 対応後）

| サンプル | JSON | JSON（gzip） | うち sourceKeys | 4.source.json | 文字カバー率 | 行カバー率 | 値の保持率 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ParserTest.cls | 207.0 → **160.1 KB** | 53.3 → **26.9 KB** | 66.0 → 55.7% | 189.9 → 199.4 KB | 64.8 → **99.4%** | 81.3 → **99.2%** | 99.6 → **100%** |
| ParserTrigger.trigger | 37.7 → **32.5 KB** | 9.9 → **6.0 KB** | 58.0 → 51.2% | 32.6 → 37.3 KB | 52.2 → **61.7%** | 67.7 → **97.7%** | 100 → 100% |
| parser.apex | 66.9 → **57.7 KB** | 16.8 → **10.2 KB** | 57.6 → 50.7% | 52.4 → 60.1 KB | 41.7 → **69.7%** | 75.9 → **100%** | 99.8 → **100%** |

| サンプル | 境界ノード | source 件数 | objectKey | スパン中央値 / p90 / 最大 |
| --- | --- | --- | --- | --- |
| ParserTest.cls | 676 → 799 | 676 → 853 | 422 → 593 | 13 / 75 / 22,525（クラス全体） |
| ParserTrigger.trigger | 108 → 150 | 108 → 159 | 85 → 136 | 27 / 166 / 786 |
| parser.apex | 195 → 274 | 195 → 285 | 122 → 211 | 15 / 69 / 355 |

- **JSON は 13〜23% 小さくなった**（ハッシュ短縮の効果）。gzip 後はほぼ半分。
- **4.source.json はやや増えた**（+5〜15%）。境界ノードが増えて位置の件数が 2〜5 割増えた分が、ハッシュ短縮の効果を上回った。gzip 後は ParserTest で 59.9 → 42.9 KB と減っている。
- **行カバー率は 98〜100%** になり、宣言名・フィールド初期値・複合文・trigger の条件も位置を引けるようになった。文字カバー率が parser.apex / ParserTrigger で 6〜7 割にとどまるのは、ほぼコメントのため。カバーされない文字は、parser.apex では 1,736 文字すべてがコメント、ParserTrigger では 1,543 文字中 1,504 文字がコメントで、残りは trigger の宣言行（`trigger ParserTrigger on Account (` のキーワード部分）。
- **値の保持率はすべて 100%**（SOSL の生テキストの欠落は F6 で解消）。
- **整合性**: JSON の `sourceKeys` はすべて `4.source.json` から引ける（引けないキー 0 件）。
- **判別キーなしのオブジェクトは約半数のまま**（ParserTest 869 / 1,818）。式などに `kind` だけを付ける対応（8.1 の KindJson）は今回の範囲外。

### 9.3 テスト

`npm test`: 159 件中 154 件成功。失敗 5 件はすべて `test/apex_IR`（IR 層: commonVisitor / query / type）のテストで、今回の対応前から失敗していたもの。converter / JSON 層のテスト（examples / modifier-json / query-commons / output-types / convert-exclude-error / json-error-handling）はすべて成功。

---

## 10. 生成した JSON はソースを表現しきれているか

値の保持率（9 章で 100%）は「識別子・リテラル・演算子が JSON のどこかに残っているか」しか見ていません。この章では、**JSON からソースの意味を復元できるか**を、順序・区別・欠落の 3 つの観点で評価します。

- 評価スクリプト: `npx ttsx --noCheck docs/examples/apex-json/evaluate-expressiveness.ts`
- 出力: `output/<sample>/6.expressiveness.json`
- 比較の基準には、順序と種類を保持している `CommonType`（`1.common-type.json`）を使った。

### 10.1 結論

| 観点 | 評価 | 内容 |
| --- | --- | --- |
| 値 | ◯ | 識別子・リテラル・演算子はすべて残る（保持率 100%） |
| 文・式の構造 | ◯ | 文の並び、if / else の連鎖、switch / when、try / catch / finally、for の各部、式の入れ子は復元できる |
| 位置 | ◯ | 宣言・文・句の単位で位置を引ける（行カバー率 98〜100%） |
| **順序** | △ | **クラスのメンバーと修飾子は、種類ごとのグループ化で元の順序が失われる**（10.2） |
| **区別** | △ | **引数なしのメソッド呼び出し `a.b()` とフィールド参照 `a.b` が同じ JSON になる**。引数なしの `new` も、種類（クラス／コレクション）を区別できない（10.3） |
| 欠落 | ◯（意図どおり） | コメントは表現しない。宣言を取り出せなかったメンバー（`notSet`）は個数だけ残る（10.4） |

**要約**: 解析（何が宣言され、何を呼び、どの SOQL を発行しているか）に使う情報は表現しきれています。一方、**ソースへの復元や、順序・呼び出しの有無に依存する解析には足りない**箇所が 2 種類あります。

### 10.2 順序

| サンプル | クラスのメンバー（順序が失われた／複数メンバーのクラス） | SELECT の列 | 修飾子（順序が失われた／複数修飾子の並び） |
| --- | --- | --- | --- |
| ParserTest.cls | **2 / 2** | 0 / 11 | **5 / 16** |
| ParserTrigger.trigger | 0 / 0 | 0 / 2 | 0 / 1 |
| parser.apex | 0 / 0 | 0 / 7 | 0 / 0 |

- **クラスのメンバー**: `ClassDeclarationJson` は `field` / `property` / `method` / `constructors` … とグループごとに持つ。ParserTest の複数メンバーを持つクラスは、2 つとも順序を復元できない。
  - Apex では static 初期化子とフィールドの初期化はソース順に実行されるので、**初期化順序の解析には使えない**。
- **修飾子**: `@IsTest private static` のように、アノテーションと修飾子の並びが入れ替わる（16 件中 5 件）。修飾子の順序に意味はないので、実害は小さい。
- **SELECT の列**: サンプルでは失われていない（種類の異なる列が混在する SELECT がない）。ただし `SelectJson` も種類別のグループ化なので、`SELECT Id, COUNT(Name), Name` のような並びでは失われる。
- 文・if / else・when・catch・引数・SOQL の句・WHERE の条件など、**配列で持つものは順序を保持している**。

### 10.3 区別できない構文

| サンプル | `a.b`（フィールド参照） | `a.b()`（引数なしの呼び出し） | 引数なしの `new X()` |
| --- | --- | --- | --- |
| ParserTest.cls | 10 | **10** | 12 |
| ParserTrigger.trigger | 53 | **4** | 3 |
| parser.apex | 8 | **10** | 3 |

- **`a.b()` と `a.b`**: `DotMethodCallJson` は引数があるときだけ `memberArg` を持つ。引数なしの呼び出しは `memberArg` がなく、フィールド参照と同じ形になる。**3 サンプルで計 24 か所の呼び出しが、JSON 上はフィールド参照に見える**。呼び出しグラフや「どのメソッドを呼んでいるか」の解析で取りこぼす。
- **引数なしの `new`**: `new Foo()`、`new List<String>()`、`new Set<String>{}`、`new Map<K, V>{}` は、いずれも `{ collection, generic? }` だけになる。サンプルでは空の Set / Map 初期化子が出てこないため、実際に衝突しているのは `new Foo()` 系（18 件）だけ。ただし種類の情報はない。
- 原因はどちらも、式の JSON に判別キー（`kind`）がないこと。式などの判別キーを持たないオブジェクトは、JSON 全体の約半数（ParserTest で 1,019 / 1,818）ある。

### 10.4 表現しないもの

| サンプル | コメント（件数／文字数） | `notSet`（宣言を取り出せなかったメンバー） |
| --- | --- | --- |
| ParserTest.cls | 74 / 4,047 | 1 |
| ParserTrigger.trigger | 31 / 1,594 | 0 |
| parser.apex | 37 / 1,831 | 0 |

- コメントは表現しない（意図どおり）。ApexDoc などを解析で使う場合は別途必要になる。
- `notSet` は `{}` を個数分持つだけで、何があったかは分からない。

### 10.5 改善案

| # | 内容 | 効果 |
| --- | --- | --- |
| E1 | 式に `kind` を付ける（キーは付けない）。少なくとも `DotMethodCallJson` に呼び出しかどうか（`call: true` か、空の `memberArg: []`）を持たせる | `a.b()` と `a.b` の区別（24 か所の取りこぼしを解消） |
| E2 | `NewInstanceJson` に生成の種類（`creatorType: 'class' / 'array' / 'list' / 'set' / 'map'` など）を持たせる | 引数なしの `new` の区別 |
| E3 | クラスのメンバーをソース順の配列（各要素に `kind`）でも持つ。グループは利用側で `kind` から作る | 初期化順序の解析、ソース順での表示 |
| E4 | `SelectJson` も同様に、列をソース順の配列で持つ | SELECT の列順の復元 |
| E5 | `notSet` に位置（エラーノードと同じく元のノードのキー）を持たせる | 取り出せなかったメンバーの特定 |
