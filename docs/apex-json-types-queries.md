# Apex JSON：SOQL / SOSL

[全体の目次と共通の形](./apex-json-types.md)。18 型別名。すべて `JsonType` を直接含み、表の型名は定義へのリンク。SOQL と SOSL は Apex の式の内側にも現れる。

## クエリ・項目・条件

| 型 | `kind` | 対応する構文・用途 | 主な属性 |
| --- | --- | --- | --- |
| [SoqlJson](../src/analyzer/types/apex/query/soql.ts#L19) | `soql` | `[SELECT Id FROM Account]` の SOQL 全体 | `select`, `from`, `where?`, `for?`, `usingScope?`, `with?`, `groupBy?`, `orderBy?`, `limit?`, `offset?`, `allRows?`, `updateList?` |
| [SoslJson](../src/analyzer/types/apex/query/sosl.ts#L89) | `sosl` | `[FIND 'Acme' IN ALL FIELDS RETURNING Account(Id)]` の SOSL 全体 | `find`, `group?`, `fieldSpec?`, `with?`, `limit?`, `update?` |
| [SubQueryJson](../src/analyzer/types/apex/query/subQuery.ts#L14) | `subQuery` | `SELECT` 内や条件値の `(SELECT ... FROM Contacts)` | `select`, `from`, `where?`, `for?`, `orderBy?`, `limit?`, `updateList?` |
| [SelectEntryJson](../src/analyzer/types/apex/query/select.ts#L27) | `selectEntry` または `subQuery` | `SELECT Id, COUNT(Id), (SELECT ...)` の個々の要素 | `type` と要素ごとの属性、`alias?`。サブクエリは `subQuery` 自体 |
| [SelectEntryBodyJson](../src/analyzer/types/apex/query/select.ts#L33) | `selectEntry` | 上記の項目・SOQL 関数・`TYPEOF` の本体。非公開の生成用型別名 | `type: 'field' \| 'soqlFunction' \| 'typeOf'` と各属性 |
| [FromFieldJson](../src/analyzer/types/apex/query/from.ts#L6) | `fromField` | `FROM Account` のオブジェクト名。非公開型 | `field`（名前の配列）, `alias?` |
| [SingleConditionJson](../src/analyzer/types/apex/query/commons.ts#L199) | `singleCondition` | `Name = 'Acme'`, `Id IN :ids` などの比較 1 件 | `field`, `operator`, `value` |
| [TypeOfBlockJson](../src/analyzer/types/apex/query/typeof.ts#L14) | `typeOfWhen` | `TYPEOF What WHEN Account THEN Phone ELSE Name END` の `WHEN` / `ELSE` | `object`（名前の配列または `'else'`）, `field`（名前の配列の配列） |
| [SoslFieldJson](../src/analyzer/types/apex/query/sosl.ts#L32) | `soslField` | SOSL の `RETURNING Account(Id, Name)` の各項目 | `field`, `func?` |

`SelectEntryJson` の `subQuery` は `selectEntry` で包まない。`selectEntry` の `type` は項目、関数、`TYPEOF` の判別であり、`kind` とは別。`SoslFieldJson` 生成時、関数の後の別名は出力されない。

## SOQL / SOSL の句

| 型 | `kind` | 対応する構文・用途 | 主な属性 |
| --- | --- | --- | --- |
| [GroupByJson](../src/analyzer/types/apex/query/groupby.ts#L19) | `groupBy` | `GROUP BY Industry`、`GROUP BY ROLLUP(...)`、`HAVING` | `field`, `mode?`, `having?` |
| [FieldOrderJson](../src/analyzer/types/apex/query/orderBy.ts#L8) | `orderField` | `ORDER BY Name DESC NULLS LAST` の各項目 | 項目または関数の属性、`direction?`, `nulls?` |
| [LimitJson](../src/analyzer/types/apex/query/limit.ts#L7) | `limitClause` | `LIMIT 10`, `LIMIT :n` | `type: 'literal' \| 'bind'`, `value` |
| [OffsetJson](../src/analyzer/types/apex/query/offset.ts#L7) | `offsetClause` | `OFFSET 10`, `OFFSET :n` | `type: 'literal' \| 'bind'`, `value` |
| [ForJson](../src/analyzer/types/apex/query/for.ts#L6) | `forClause` | `FOR UPDATE`, `FOR VIEW` など | `value`（文字列配列） |
| [AllRowsJson](../src/analyzer/types/apex/query/allRows.ts#L7) | `allRowsClause` | `ALL ROWS` | 追加属性なし |
| [UpdateListJson](../src/analyzer/types/apex/query/updateList.ts#L6) | `updateClause` | `UPDATE TRACKING`, `UPDATE VIEWSTAT` | `value`（`'TRACKING'` / `'VIEWSTAT'` の配列） |
| [UsingScopeJson](../src/analyzer/types/apex/query/usingScope.ts#L6) | `usingScopeClause` | `USING SCOPE Mine` など | `value` |
| [DataCategorySelectionJson](../src/analyzer/types/apex/query/with.ts#L25) | `categoryCondition` | `WITH DATA CATEGORY Geography__c AT Japan__c` の各選択条件 | `group`, `selector`, `category` |

`LIMIT`・`OFFSET` の `literal` の `value` は文字列、`bind` の `value` は Apex 式ノード。句の有無や有効性はクエリの文脈による。

## kind のない主な入れ物

| 型 | 対応・中身 |
| --- | --- |
| [SelectJson](../src/analyzer/types/apex/query/select.ts#L70) | `SELECT` の `field: SelectEntryJson[]` |
| [FromJson](../src/analyzer/types/apex/query/from.ts#L24) | `FROM` の `field: FromFieldJson[]` |
| [WhereJson](../src/analyzer/types/apex/query/where.ts#L63) | `WHERE` の `condition: LogicalConditionJson` |
| [LogicalConditionJson](../src/analyzer/types/apex/query/commons.ts#L239) | `AND` / `OR` / `NOT` と子条件の入れ子。比較は `singleCondition` |
| [OrderByJson](../src/analyzer/types/apex/query/orderBy.ts#L31) | `orderBy: FieldOrderJson[]` |
| [WithJson / SoslWithJson](../src/analyzer/types/apex/query/with.ts#L42) | SOQL / SOSL の `WITH` 句。データカテゴリーなど句の種類により属性が異なる |
| [FieldJson](../src/analyzer/types/apex/query/select.ts#L15) | 項目名。`type: 'field'`, `field: string[]`。`selectEntry` や `orderField` に組み込まれる場合がある |
| [SoqlFunctionJson](../src/analyzer/types/apex/query/soqlFunction.ts#L139) | SOQL 関数。`type: 'soqlFunction'` と関数種別ごとの引数 |
| [TypeOfJson](../src/analyzer/types/apex/query/typeof.ts#L40) | `TYPEOF` 全体の内容。`type: 'typeOf'`, `field`, `block` |
| [ValueJson](../src/analyzer/types/apex/query/commons.ts#L120) | 比較の右辺。リテラル・日付式・リスト・サブクエリ・バインド式などを `type` で区別 |
| [SignedNumberJson / DateFormulaJson](../src/analyzer/types/apex/query/commons.ts#L19) | 数値や `TODAY`, `LAST_N_DAYS:30` などの日付式の内容 |
| [SoslFindJson](../src/analyzer/types/apex/query/sosl.ts#L85) | SOSL の検索語。`type: 'literal'` の文字列、または `type: 'bind'` の Apex 式 |
| [FieldSpecJson](../src/analyzer/types/apex/query/sosl.ts#L53) | SOSL `RETURNING` のオブジェクトごとの項目・条件など |

`FieldJson`、`SoqlFunctionJson`、`TypeOfJson` は単独では kind なしだが、`selectEntry` や `orderField` に組み込まれると外側の `kind`・`sourceKeys` を共有する。
