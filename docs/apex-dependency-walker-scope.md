# Apex 依存関係解析向け walker の機能範囲

## 目的と状態

作り直し中の [Apex/walker/](../src/analyzer/processor/Apex/walker/) について、依存関係解析のために収集・解決する対象を整理する。「現状の実装」より前は**検討中の方針**であり、現在の実装がすべて対応しているという意味ではない。

現在の共通走査は [walker.ts](../src/analyzer/processor/Apex/walker.ts)、既存の依存関係抽出は [dependency/apex.ts](../src/analyzer/processor/dependency/apex.ts) を参照。Apex の JSON 型の一覧は [apex-json-types.md](./apex-json-types.md)。

## 責務の分担

| 処理 | 役割 |
| --- | --- |
| walker | Apex JSON を走査し、宣言・参照・式・位置・スコープなど、依存関係の解決に必要な情報を収集する |
| 依存先の解決 | 収集した情報と型・宣言などを照合し、参照先や依存関係の種類を決める |

walker 自体ですべての依存先を確定しない。動的クエリの復元・解析をこの分担の中でどう構成するかは、今後決める。

## 対象とする参照

| 対象 | 収集・解析する内容の例 |
| --- | --- |
| Apex の型・クラス | クラス、インターフェース、enum、型宣言、継承、実装、`new` |
| メソッド呼び出し | 呼び出し元、メソッド名、引数、引数内の呼び出し、メソッドチェーン |
| メンバー | 項目・プロパティ・変数の参照、および読み取り・書き込み |
| SOQL / SOSL | オブジェクト、項目、条件、関数の引数、サブクエリなどの参照 |
| DML | 操作の種類と対象。DML 文と `Database` メソッドを含む |
| メタデータ | Label、Flow、カスタムメタデータなどへの参照 |
| 動的 SOQL / SOSL | 実行時に使うクエリ文字列のうち、静的に復元できる部分 |

個々のメタデータや文字列引数による参照の対応一覧は、今後具体化する。

## 呼び出し先・型の解決範囲

ユーザー定義のクラスやメンバーについて、次を解決の対象とする。

- 同一クラス、`this`、型の分かる変数の呼び出し。
- 親クラス・`super` を経由した呼び出し。
- 項目・プロパティを経由した呼び出し。
- ユーザー定義メソッドの戻り値を経由したチェーン。
- 配列・`List`・`Map` の要素を経由した呼び出し。
- 引数の情報を使ったオーバーロード候補の絞り込み。

例えば `hoge.fuga(tmp()).aaa()` では、`fuga`・`tmp`・`aaa` の呼び出しをそれぞれ扱う。`aaa` の呼び出し先は `fuga` の戻り値の型が分かる場合に解決する。引数 `tmp()` も式として保持し、内側の呼び出しを解析できるようにする。

上記は**解析を試みる範囲**であり、常に一意に解決できるという保証ではない。型や候補を特定できない場合は推測で確定せず、参照を残して `unknown` とする。

### 標準 API と未解決参照

- Apex の標準 API は、型・クラス単位までを対象とし、個々の標準メソッドの存在・シグネチャは検証しない。
- 未確認の参照を、名前だけで標準 API と断定しない。解決できない場合は `unknown` として残す。
- 標準メソッドの戻り値を検証しないため、その戻り値を使うチェーンは解決できない場合がある。
- 標準オブジェクトや項目をどの資料・情報源で確認するかは別途具体化する。[標準 API 調査](./apex-standard-reference.md) は網羅済みではない。

## 動的 SOQL / SOSL

### 復元範囲

次を対象として、クエリ文字列を静的に復元する。

- 文字列リテラル。
- 同一メソッド内で値を確定できる変数。
- 上記の連結。

例えば次のクエリは、変数の値を追って文字列全体を復元できる場合に解析する。

```apex
String queryText = 'SELECT Id FROM ' + 'Account';
Database.query(queryText);
```

メソッド間の値の追跡や、分岐・再代入を含む広範なデータフロー解析までは、今回決定した復元範囲に含めない。

### 仮の JSON と部分的な復元

復元した文字列から構文を作り、仮の `JsonType` / `StructureJsonType` を生成して既存の解析を再利用する案を検討する。

一部が復元できない場合は、**安全に確定できる参照だけ**を解析し、未確定部分は `unknown` として残す。未知の文字列がクエリの構造を変える可能性もあるため、単に文字列の一部が見えているだけで参照先を確定しない。

仮の JSON の `sourceKeys` を元の Apex ソースの位置として扱わない。元の呼び出し位置や文字列の由来を保持し、復元文字列上の位置との対応方法は今後決める。

## walker が保持する情報

具体的な型名や出力スキーマは未決定だが、少なくとも以下を後段の解析で利用できるようにする。

- 参照元の位置、クラス・メソッドなどの文脈、変数のスコープ。
- 型やメンバーなどの宣言と、各参照の種類。
- 呼び出しの名前、呼び出し元の式、引数の式。
- 呼び出し元や引数に含まれる呼び出し・添字などの構造。
- 解決できなかった参照と、その元の式・位置。

引数は文字列化せず、元の式 JSON を利用する方針。名前の配列 `path` は取り出せる場合の補助情報とし、構造を持つ呼び出し元の式の代わりにはしない。例えば `item[0].get(111)` の `item[0]` は添字を持つ式として扱う。

未対応の式を個別の名前抽出関数が `undefined` とする場合も、それを「無効な Apex」や「依存関係なし」と同一視せず、参照全体の未解決情報は残す。

## 現状の実装

以下は作成時の既存実装の調査結果。対象は Apex の依存関係に関わる JSON・走査・情報収集・参照抽出・グラフ解決であり、Salesforce の全機能や他のメタデータ種別の解析全体の一覧ではない。

### 全体の流れ

```text
Apex ソース
  → パーサー / IR
  → Apex JSON
  → 共通 walker
     ├─ 呼び出し・DML・クエリの概要情報（calls.ts）
     └─ 定義・参照（dependency/apex.ts）
          → 他の単位の定義・参照と合わせて依存関係グラフを作る
```

| 実装 | 現在の役割 |
| --- | --- |
| [parser/Apex/source.ts](../src/analyzer/parser/Apex/source.ts) | Apex ソースから IR と JSON を生成し、構文・IR のエラーを収集する |
| [types/apex/](../src/analyzer/types/apex/) | 宣言・式・文・SOQL / SOSL の JSON 型と生成処理 |
| [processor/Apex/walker.ts](../src/analyzer/processor/Apex/walker.ts) | 既存の共通走査、走査中の文脈と変数スコープ |
| [processor/Apex/calls.ts](../src/analyzer/processor/Apex/calls.ts) | 呼び出し・DML・クエリ・トリガー文脈の概要情報 |
| [processor/dependency/apex.ts](../src/analyzer/processor/dependency/apex.ts) | Apex の定義と依存参照を JSON から抽出 |
| [processor/dependency/units.ts](../src/analyzer/processor/dependency/units.ts) | オブジェクトなど、他の単位の定義・参照と子リレーション情報を抽出 |
| [processor/dependency/graph.ts](../src/analyzer/processor/dependency/graph.ts) | 各単位の定義・参照を照合し、ノード・辺・指摘を作る |

`calls.ts` の概要情報と `dependency/apex.ts` の依存参照は**別々の visitor が収集**する。前者の呼び出し情報から後者の依存参照を作っているわけではない。作り直し中の `Apex/walker/` と既存の `Apex/walker.ts` も区別する。

### 既存の共通 walker と文脈

[walkApexJson](../src/analyzer/processor/Apex/walker.ts) は JSON を前順で再帰的にたどり、`kind` ごとに visitor を呼ぶ。visitor が `false` を返すとそのノードの子には入らない。`sourceKeys` は走査せず、`kind: 'type'` は handler の実行後に内部をたどらない。

- クラス・メンバー名、直前の文の位置、ループとネストの深さ、try 内か、テスト内かを文脈として持つ。
- ブロックなどに入るとスコープを作り、項目・プロパティ・引数・ローカル変数・for / catch の変数を登録する。変数名は大文字・小文字を区別せず、内側から探す。
- 変数の型の名前は主に custom 型から取得する。`List`・`Set`・配列は要素、`Map` は値の型をたどり、集合であることも保持する。primitive 型など、名前を取り出せない場合は登録されない。
- `apexDottedNameOf` は識別子と、`type: 'object'` の `memberAccess` からなる名前だけを `.` でつなぐ。途中にメソッド呼び出しや添字がある場合は `undefined`。
- クラスは宣言全体を走査し、トリガー・匿名 Apex は本文を走査する。トリガーの対象オブジェクトの参照は依存関係抽出側で別途追加する。

### 現在の出力形式

[UnitDependencies](../src/analyzer/processor/dependency/types.ts) は、単位ごとの `definitions` と `references`、必要に応じて子リレーションの情報を持つ。参照は `refType`、`target`、`kind`、`via`、`from` を持ち、`from` にはメンバー名・文・式の位置を入れられる。定義と参照が十分に取れない場合でも、すべてに `unknown` の参照が作られるわけではない。

`apex.ts` は参照先・種類・用途・参照位置などが同じ参照を最後に重複排除する。一方、同じ項目でも `SELECT` と `ORDER BY` のように `via` が異なれば別の参照として残る。

### 宣言・型・メンバー

[dependency/apex.ts](../src/analyzer/processor/dependency/apex.ts) の現在の処理は次のとおり。

| 対象 | 現在の抽出 |
| --- | --- |
| クラス・インターフェース・enum | `apexClass` の定義。入れ子の名前も文脈に含める。`extends` / `implements` の型参照を作る |
| メソッド・インターフェースメソッド・プロパティ | それぞれ `apexMethod` / `apexProperty` の定義。戻り値・引数・プロパティの型を参照として扱う |
| コンストラクタ | 引数などの型を調べるが、上記と同じメンバー定義は作らない |
| クラスの項目 | 各項目を `apexProperty` として定義し、宣言された型を参照する |
| そのほかの型 | 型 JSON の custom 型をたどる。コレクションの要素やジェネリクス内の custom 型も含む |
| `new` | 作成する型を `creates` で参照する。`Flow.Interview.X` と `PageReference` には特別な処理がある |
| メンバー読み取り | 型が分かる非集合の変数に対する `acc.Name` などを `reads` として記録する |
| メンバー書き込み | 式文の代入左辺 `acc.Name = ...` などを `writes` とし、同じ左辺の読み取りを抑止する |
| トリガー | トリガーを定義し、対象オブジェクトに `triggers` の参照を作る |

`apexType` / `apexTypeMember` は抽出時点ではクラス・オブジェクト・項目のどれかを確定せず、グラフ作成時に定義と照合する。任意の式を経由した項目の読み書きや、すべての型解決に対応しているわけではない。

### メソッド呼び出し

#### 呼び出し概要

[ApexCallInfo](../src/analyzer/processor/Apex/calls.ts) は `sourceKeys`、`callType`、`owner?`、`method`、`variable?`、引数 JSON の `args`、文脈を持つ。通常のメソッド・コンストラクタ・DML・動的クエリ・非同期・callout・assert・publish・debug を分類する。

| Apex の例 | 呼び出し概要の扱い |
| --- | --- |
| `Service.run()` | `owner: 'Service'`、`method: 'run'` |
| `Service service; service.run()` | 変数の型を取得できれば `owner: 'Service'`、`variable: 'service'` |
| `this.run()` / `run()` | 現在のクラスを `owner` とする |
| `new Http().send(req)` | 作成した型から `Http` を判定し、callout として扱う |
| `String.valueOf(123).trim()` | `valueOf` と `trim` を別々に収集。`trim` の呼び出し元の戻り値型は解決せず、通常 `owner` はない |
| `hoge.fuga(tmp()).aaa()` | 各呼び出しを走査し、`fuga` の引数 JSON に `tmp()` を保持する。`aaa` の呼び出し元の型は通常分からない |

概要情報に `path` や呼び出し元の式そのものは保存されない。引数の式は保存される。

#### 依存参照

[memberAccessRefs](../src/analyzer/processor/dependency/apex.ts) は、`this.method()`、識別子を呼び出し元とする `x.method()`、単独の `method()` などから参照を作る。変数ならスコープの型を使い、変数でなければ名前などから候補を作る。

- 集合のメソッドや、型が分からず小文字で始まる名前は一般のメソッド参照にしない。
- メソッド結果・添字などを呼び出し元とする一般のチェーンは、呼び出し先を解決して参照にする処理がない。後述のカスタム設定などは個別の例外。
- `this(...)` / `super(...)` は概要上コンストラクタ呼び出しだが、依存参照にはしない。
- 継承・戻り値の型・引数によるオーバーロード解決は一般には行わない。抽出されなかった呼び出しは自動的に `unknown` の参照になるわけではない。

### クエリの JSON

| 型・箇所 | JSON が保持する主な内容 |
| --- | --- |
| [SoqlJson](../src/analyzer/types/apex/query/soql.ts) | `select`・`from`、任意の `where`・`for`・`usingScope`・`with`・`groupBy`・`orderBy`・`limit`・`offset`・`allRows`・`updateList` |
| [SelectEntryJson](../src/analyzer/types/apex/query/select.ts) | 項目、SOQL 関数、`TYPEOF`、またはサブクエリ。`alias?` を持つ場合がある |
| [SoqlFunctionJson](../src/analyzer/types/apex/query/soqlFunction.ts) | 関数名と引数。単純な項目配列のほか、日付関数・`FORMAT`・`FIELDS`・`DISTANCE` などは異なる引数の形を持つ |
| [TypeOfJson](../src/analyzer/types/apex/query/typeof.ts) | 対象の項目と、`WHEN` / `ELSE` のオブジェクト・項目 |
| [SubQueryJson](../src/analyzer/types/apex/query/subQuery.ts) | サブクエリ自身の `select`・`from` と対応する任意の句 |
| [ValueJson](../src/analyzer/types/apex/query/commons.ts) | WHERE などの値。リテラル・リスト・サブクエリ・Apex のバインド式など |
| [SoslJson](../src/analyzer/types/apex/query/sosl.ts) | `find`、検索対象、`RETURNING` のオブジェクト・項目と条件など |

`selectEntry` / `subQuery` / 各句の一部は `kind` と `sourceKeys` を持つ。一方、`FieldJson` や関数の中身などは kind なしの入れ物で、外側の位置付きノードに組み込まれる。

### SOQL の依存参照

[soqlRefs / queryFieldRefs](../src/analyzer/processor/dependency/apex.ts) は以下を抽出する。

| 箇所 | 現在の抽出 | 制限 |
| --- | --- | --- |
| `FROM` | 最初の名前を `object` / `queries`、`via: 'soql.from'` で記録 | `apexSoqlObjectOf` は最初の対象名を使う |
| `SELECT` の項目 | `field` / `reads`、`via: 'soql.select'` | 関連項目は下記の `fieldOfPath` に制限される |
| `SELECT` の関数 | `arg` が配列のとき、その配列を項目パスとして抽出 | 関数名は参照に残らない。日付関数・`DISTANCE` などのオブジェクト型引数、`FIELDS(ALL)`、`TYPEOF` の項目などは網羅しない |
| `WHERE` などの比較 | `singleCondition.field` が通常の項目なら `soql.where` | 左辺の関数はこの分岐では抽出しない。`HAVING` の比較も同じ `soql.where` として扱われる |
| `ORDER BY` | 通常の項目を `soql.orderBy` | 関数の項目はこの分岐では抽出しない |
| `GROUP BY` | 通常の項目を `soql.groupBy` | 関数の項目はこの分岐では抽出しない |
| `SELECT` 内の子サブクエリ | `childRelationship` と `childRelationshipField` を `soql.subquery` で記録 | 子のオブジェクト自体は後で解決。`WHERE` 内のサブクエリや深い入れ子は網羅されない |
| `StaticResource` の検索 | `Name = 'X'` や `Name IN ('X', ...)` の文字列リテラルから静的リソースを参照 | 変数や任意の式は推測しない |

項目パスの [fieldOfPath](../src/analyzer/processor/dependency/apex.ts) は、複数要素の場合に**最初の関係部分だけ**を使う。例えば `Account` からの `Owner.Name` は `Account.Owner`、`Account__r.Name` は `Account.Account__c` として扱い、その先の `Name` は追わない。これは対象項目まで解決した結果ではない。

例えば次のクエリ：

```sql
SELECT Name, (SELECT LastName FROM Contacts)
FROM Account
WHERE Industry = 'Technology'
ORDER BY Name
```

主に `Account`、`Account.Name`（SELECT / ORDER BY）、`Account.Industry`、子リレーション `Account.Contacts`、その項目 `Account.Contacts.LastName` を参照する。クエリ参照の位置には主にクエリ全体の `sourceKeys` を使い、個々の項目位置は保持しない。

### SOSL と動的クエリの現状

- [soslRefs](../src/analyzer/processor/dependency/apex.ts) は `RETURNING` の各オブジェクトと、直接の項目名を抽出する。関数の中身・条件・並び順などは網羅しない。
- 依存関係 visitor は `sosl` の処理後に `false` を返すため、SOSL 内部のバインド式などはその visitor では再帰走査されない。
- 呼び出し概要では `Database.query`・`Database.queryWithBinds`・`Database.countQuery`・`Database.getQueryLocator` とそれぞれの対応する binds 版、`Search.query` を動的クエリとして分類し、`language: 'dynamic'`、`objects: []` の概要を作る。
- 現在は、動的クエリ文字列を復元・再解析して項目やオブジェクトの依存参照を抽出しない。

### DML・メタデータなどの参照

| 対象 | 現在の処理 |
| --- | --- |
| DML 文 | `insert`・`update`・`upsert`・`delete`・`undelete`・`merge` の対象型を、変数・SOQL・`new` などから取得できれば操作別に参照する |
| `Database` メソッド | 同じ操作名の呼び出しについて、第１引数から対象型を取得できれば参照する |
| Label / Page | `Label.X`、`Page.X` の名前を参照する。`Label.get` や `PageReference` に対する特別処理もある |
| Flow | `Flow.Interview.X` の型・生成、`Flow.Interview.createInterview` の名前から参照する |
| カスタム権限 | `FeatureManagement.checkPermission` のリテラル引数を参照する |
| カスタム設定・カスタムメタデータ | `getInstance`・`getAll` などの特定の形を扱い、分かる場合に型・レコード・項目を参照する |
| 静的リソース | `PageReference.forResource` と、前述の `StaticResource` に対する SOQL の特定の形を扱う |
| 型の文字列指定 | `Type.forName` の特定のリテラル引数を型参照とする |
| 指定ログイン情報 | 文字列リテラル中の `callout:Name` を参照する |
| プラットフォームイベント | `EventBus.publish` の引数の型が分かれば発行対象を参照する |
| Schema | 特定の `Schema.SObjectType...` や `Account.SObjectType` の形を対象とする |

文字列から名前を取り出す個別処理には、リテラルや名前の形式などの条件がある。任意の変数・連結・名前空間付きの入力をすべて解決するわけではない。

### グラフの照合と現状の限界

[graph.ts](../src/analyzer/processor/dependency/graph.ts) は、各単位の定義・参照をまとめ、参照元の単位・メンバー・文・式から参照先へ辺を張る。定義があれば名前で照合し、ノードに `repository`・`standard`・`managed`・`missing`・`unknown` のいずれかを付ける。

オブジェクトの参照項目から得られた [子リレーション情報](../src/analyzer/processor/dependency/units.ts) があれば、`Account.Invoices__r.Amount__c` を子オブジェクトの `Invoice__c.Amount__c` に変換できる。情報がなければリレーション名などに基づいて分類する。

現行の分類には名前による推定が含まれ、未確認の標準リレーションや型・項目を `standard` とする場合がある。また、名前で一致したものを照合するため、これ自体は継承・オーバーロード・チェーンの完全な型解決ではない。これらは冒頭に記載した新しい方針と分けて扱う。

## 今後具体化すること

- 収集結果・未解決参照の型と、既存の依存関係グラフとの接続方法。
- 対応するメタデータ参照と、文字列引数で指定される参照の範囲。
- 変数・項目・戻り値・コレクション・オーバーロードの型解決の詳細。
- 動的クエリの部分復元で安全に解析できる条件、仮の JSON の位置と元ソースの対応。
- 既存の走査・依存関係解析との移行方法と、既存動作の検証。
