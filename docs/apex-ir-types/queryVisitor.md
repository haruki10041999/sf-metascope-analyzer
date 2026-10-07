# queryVisitor

SOQL クエリ本体（`query` / `subQuery`）と、SOQL/SOSL 内で使う部品（比較演算子・日付リテラル・SOQL 関数・SOSL の検索グループ / RETURNING 対象）を IR に変換する。

## Visitor

| visit メソッド            | Context                     | 生成する TypeClass            |
| ------------------------- | --------------------------- | ----------------------------- |
| `visitQuery`              | `QueryContext`              | `NormalQueryTypeClass`        |
| `visitSubQuery`           | `SubQueryContext`           | `SubQueryTypeClass`           |
| `visitComparisonOperator` | `ComparisonOperatorContext` | `ComparisonOperatorTypeClass` |
| `visitDateFormula`        | `DateFormulaContext`        | `DateFormulaTypeClass`        |
| `visitFieldSpec`          | `FieldSpecContext`          | `FieldSpecTypeClass`          |
| `visitSearchGroup`        | `SearchGroupContext`        | `SearchGroupTypeClass`        |
| `visitSoqlFunction`       | `SoqlFunctionContext`       | `SoqlFunctionTypeClass`       |

`QueryVisitor` は `CommonVisitor<QueryAllTypeClass>` を継承する。`create()` が例外を投げた場合や子要素が無い場合は `ErrorTypeClass` が返る。

## 基底クラス（base.ts）

### `QueryTypeClass<T>`

queryVisitor の全 TypeClass の基底。`type` と単一の `value` を持つ。

| 変数    | 型                    | 内容                                         |
| ------- | --------------------- | -------------------------------------------- |
| `type`  | `string`              | ノード種別（CommonTypeClass から継承）       |
| `value` | `T \| ErrorTypeClass` | ノードの主値（サブクラスごとに意味が異なる） |

ゲッター: `getType()`, `getValue()`

### `SoqlQueryTypeClass<T>`

`QueryTypeClass<T>` を継承し、`query` と `subQuery` に共通する句を保持する。

| 変数            | 型                                                 | 内容                                                   |
| --------------- | -------------------------------------------------- | ------------------------------------------------------ |
| `type`          | `string`                                           | ノード種別（CommonTypeClass から継承）                 |
| `value`         | `T \| ErrorTypeClass`                              | SELECT 対象リスト                                      |
| `from`          | `FromNameListTypeClass \| ErrorTypeClass`          | FROM 句                                                |
| `forClause`     | `ForClausesTypeClass \| ErrorTypeClass \| null`    | FOR VIEW / UPDATE / REFERENCE。FOR 句が無ければ `null` |
| `whereClause`   | `WhereClauseTypeClass \| ErrorTypeClass \| null`   | WHERE 句。無ければ `null`                              |
| `orderByClause` | `OrderByClauseTypeClass \| ErrorTypeClass \| null` | ORDER BY 句。無ければ `null`                           |
| `limitClause`   | `LimitClauseTypeClass \| ErrorTypeClass \| null`   | LIMIT 句。無ければ `null`                              |
| `updateList`    | `UpdateListTypeClass \| ErrorTypeClass \| null`    | `UPDATE TRACKING, VIEWSTAT`。無ければ `null`           |

ゲッター: `getValue()`, `getFrom()`, `getForClause()`, `getWhereClause()`, `getOrderByClause()`, `getLimitClause()`, `getUpdateList()`

### `QueryAllTypeClass`（型エイリアス）

`QueryTypeClass<unknown> | SoqlQueryTypeClass<unknown>`。`QueryVisitor` の戻り値型。

### `isQueryTypeAll`（ガード関数）

`target instanceof QueryTypeClass || target instanceof SoqlQueryTypeClass` を返す。

## TypeClass

### `NormalQueryTypeClass`（normal.ts）

- **type**: `'query'`
- **継承**: `SoqlQueryTypeClass<SelectListTypeClass>`
- **元 Context**: `QueryContext`（文法: `SELECT selectList FROM fromNameList usingScope? whereClause? withClause? groupByClause? orderByClause? limitClause? offsetClause? allRowsClause? forClauses (UPDATE updateList)?`）
- **役割**: トップレベルの SOQL クエリ（`[SELECT ...]`）。

| 変数            | 型                                                 | 内容                                     |
| --------------- | -------------------------------------------------- | ---------------------------------------- |
| `type`          | `'query'`                                          | 継承                                     |
| `value`         | `SelectListTypeClass \| ErrorTypeClass`            | SELECT 句の項目リスト                    |
| `from`          | `FromNameListTypeClass \| ErrorTypeClass`          | 継承。FROM 句                            |
| `forClause`     | `ForClausesTypeClass \| ErrorTypeClass \| null`    | 継承。FOR 句が無ければ `null`            |
| `whereClause`   | `WhereClauseTypeClass \| ErrorTypeClass \| null`   | 継承。無ければ `null`                    |
| `orderByClause` | `OrderByClauseTypeClass \| ErrorTypeClass \| null` | 継承。無ければ `null`                    |
| `limitClause`   | `LimitClauseTypeClass \| ErrorTypeClass \| null`   | 継承。無ければ `null`                    |
| `updateList`    | `UpdateListTypeClass \| ErrorTypeClass \| null`    | 継承。無ければ `null`                    |
| `usingScope`    | `UsingScopeTypeClass \| ErrorTypeClass \| null`    | `USING SCOPE xxx`。無ければ `null`       |
| `withClause`    | `WithClauseTypeClass \| ErrorTypeClass \| null`    | `WITH ...`。無ければ `null`              |
| `groupByClause` | `GroupByClauseTypeClass \| ErrorTypeClass \| null` | GROUP BY（HAVING 含む）。無ければ `null` |
| `offsetClause`  | `OffsetClauseTypeClass \| ErrorTypeClass \| null`  | OFFSET 句。無ければ `null`               |
| `allRowsClause` | `AllRowsClauseTypeClass \| ErrorTypeClass \| null` | `ALL ROWS`。無ければ `null`              |

ゲッター: 継承分に加え `getUsingScope()`, `getWithClause()`, `getGroupByClause()`, `getOffsetClause()`, `getAllRowsClause()`

`selectList` または `fromNameList` が無い場合は例外（→ `ErrorTypeClass`）。

例:

```apex
[SELECT Id, Name, Industry, AnnualRevenue, CreatedDate FROM Account
 WHERE Industry = 'Technology'
 ORDER BY Name ASC NULLS FIRST, CreatedDate DESC NULLS LAST, Industry
 LIMIT 100 OFFSET 10]
```

```json
{
    "type": "query",
    "value": { "type": "selectList", "value": "..." },
    "from": { "type": "fromNameList", "value": "..." },
    "forClause": null,
    "whereClause": { "type": "whereClause", "value": "..." },
    "orderByClause": { "type": "orderByClause", "value": "..." },
    "limitClause": { "type": "limitClause", "value": "100" },
    "updateList": null,
    "usingScope": null,
    "withClause": null,
    "groupByClause": null,
    "offsetClause": { "type": "offsetClause", "value": "10" },
    "allRowsClause": null
}
```

### `SubQueryTypeClass`（subQuery.ts）

- **type**: `'subQuery'`
- **継承**: `SoqlQueryTypeClass<SubFieldListTypeClass>`
- **元 Context**: `SubQueryContext`（文法: `SELECT subFieldList FROM fromNameList whereClause? orderByClause? limitClause? forClauses (UPDATE updateList)?`）
- **役割**: SELECT 句内の子リレーションクエリ、および `IN (SELECT ...)` の半結合クエリ。独自フィールドは持たない。

| 変数            | 型                                                 | 内容                                  |
| --------------- | -------------------------------------------------- | ------------------------------------- |
| `type`          | `'subQuery'`                                       | 継承                                  |
| `value`         | `SubFieldListTypeClass \| ErrorTypeClass`          | SELECT 句の項目リスト                 |
| `from`          | `FromNameListTypeClass \| ErrorTypeClass`          | 継承。FROM 句（子リレーション名など） |
| `forClause`     | `ForClausesTypeClass \| ErrorTypeClass \| null`    | 継承。FOR 句が無ければ `null`         |
| `whereClause`   | `WhereClauseTypeClass \| ErrorTypeClass \| null`   | 継承。無ければ `null`                 |
| `orderByClause` | `OrderByClauseTypeClass \| ErrorTypeClass \| null` | 継承。無ければ `null`                 |
| `limitClause`   | `LimitClauseTypeClass \| ErrorTypeClass \| null`   | 継承。無ければ `null`                 |
| `updateList`    | `UpdateListTypeClass \| ErrorTypeClass \| null`    | 継承。無ければ `null`                 |

ゲッター: 継承分のみ（`getValue()`, `getFrom()`, `getForClause()`, `getWhereClause()`, `getOrderByClause()`, `getLimitClause()`, `getUpdateList()`）

`subFieldList` または `fromNameList` が無い場合は例外（→ `ErrorTypeClass`）。

例:

```apex
(SELECT Id, FirstName, Account.Name FROM Contacts WHERE Email != NULL ORDER BY LastName LIMIT 10)
```

```json
{
    "type": "subQuery",
    "value": {
        "type": "subFieldList",
        "value": [{ "type": "subFieldEntry", "value": "...", "alias": null }, "...", "..."]
    },
    "from": {
        "type": "fromNameList",
        "value": [
            { "type": "fromName", "value": { "type": "fieldName", "value": "..." }, "alias": null }
        ]
    },
    "forClause": null,
    "whereClause": {
        "type": "whereClause",
        "value": { "type": "whereLogicalExpression", "value": ["..."], "operator": null }
    },
    "orderByClause": {
        "type": "orderByClause",
        "value": { "type": "fieldOrderList", "value": ["..."] }
    },
    "limitClause": { "type": "limitClause", "value": "10" },
    "updateList": null
}
```

### `ComparisonOperatorTypeClass`（comparisonOperator.ts）

- **type**: `'comparisonOperator'`
- **継承**: `QueryTypeClass<ComparisonOperatorValueType>`
- **元 Context**: `ComparisonOperatorContext`（文法: `= | != | < | > | < = | > = | <> | LIKE | IN | NOT IN | INCLUDES | EXCLUDES`）
- **役割**: WHERE / HAVING の比較演算子。`<=` / `>=` は `LT`/`GT` と `ASSIGN` の 2 トークンから合成する。

| 変数    | 型                                              | 内容                                                                                                                     |
| ------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `type`  | `'comparisonOperator'`                          | 継承                                                                                                                     |
| `value` | `ComparisonOperatorValueType \| ErrorTypeClass` | `'='` / `'!='` / `'<'` / `'>'` / `'<='` / `'>='` / `'<>'` / `'LIKE'` / `'IN'` / `'NOT IN'` / `'INCLUDES'` / `'EXCLUDES'` |

ゲッター: `getValue()`

例:

```apex
WHERE Id NOT IN :ids
```

```json
{ "type": "comparisonOperator", "value": "NOT IN" }
```

### `DateFormulaTypeClass`（dateFormula.ts）

- **type**: `'dateFormula'`
- **継承**: `QueryTypeClass<DateFormulaValueType>`
- **元 Context**: `DateFormulaContext`（文法: `TODAY | LAST_WEEK | ... | LAST_N_DAYS_N COLON signedInteger | ...`）
- **役割**: SOQL の日付リテラル（`TODAY`, `LAST_N_DAYS:30` など）。

| 変数    | 型                                                 | 内容                                                 |
| ------- | -------------------------------------------------- | ---------------------------------------------------- |
| `type`  | `'dateFormula'`                                    | 継承                                                 |
| `value` | `DateFormulaValueType \| ErrorTypeClass`           | 日付リテラル名（下記）                               |
| `param` | `SignedIntegerTypeClass \| ErrorTypeClass \| null` | `:n` の値。`*_N` 系のみ設定され、引数なし系は `null` |

`DateFormulaValueType` = 引数なし系 | 引数あり系:

- 引数なし: `'YESTERDAY'`, `'TODAY'`, `'TOMORROW'`, `'LAST_WEEK'`, `'THIS_WEEK'`, `'NEXT_WEEK'`, `'LAST_MONTH'`, `'THIS_MONTH'`, `'NEXT_MONTH'`, `'LAST_90_DAYS'`, `'NEXT_90_DAYS'`, `'THIS_QUARTER'`, `'LAST_QUARTER'`, `'NEXT_QUARTER'`, `'THIS_YEAR'`, `'LAST_YEAR'`, `'NEXT_YEAR'`, `'THIS_FISCAL_QUARTER'`, `'LAST_FISCAL_QUARTER'`, `'NEXT_FISCAL_QUARTER'`, `'THIS_FISCAL_YEAR'`, `'LAST_FISCAL_YEAR'`, `'NEXT_FISCAL_YEAR'`
- 引数あり（`param` 必須）: `'LAST_N_DAYS_N'`, `'NEXT_N_DAYS_N'`, `'N_DAYS_AGO_N'`, `'NEXT_N_WEEKS_N'`, `'LAST_N_WEEKS_N'`, `'N_WEEKS_AGO_N'`, `'NEXT_N_MONTHS_N'`, `'LAST_N_MONTHS_N'`, `'N_MONTHS_AGO_N'`, `'NEXT_N_QUARTERS_N'`, `'LAST_N_QUARTERS_N'`, `'N_QUARTERS_AGO_N'`, `'NEXT_N_FISCAL_QUARTERS_N'`, `'LAST_N_FISCAL_QUARTERS_N'`, `'N_FISCAL_QUARTERS_AGO_N'`, `'NEXT_N_YEARS_N'`, `'LAST_N_YEARS_N'`, `'N_YEARS_AGO_N'`, `'NEXT_N_FISCAL_YEARS_N'`, `'LAST_N_FISCAL_YEARS_N'`, `'N_FISCAL_YEARS_AGO_N'`

ゲッター: `getValue()`, `getParam()`

例:

```apex
AND CreatedDate = LAST_N_DAYS:30
```

```json
{
    "type": "dateFormula",
    "value": "LAST_N_DAYS_N",
    "param": { "type": "signedInteger", "valueType": "integer", "value": "30", "operator": null }
}
```

### `FieldSpecTypeClass`（fieldSpec.ts）

- **type**: `'fieldSpec'`
- **継承**: `QueryTypeClass<SoslIdTypeClass>`
- **元 Context**: `FieldSpecContext`（文法: `soslId (LPAREN fieldList (WHERE logicalExpression)? (USING LISTVIEW = soslId)? (ORDER BY fieldOrderList)? limitClause? offsetClause? RPAREN)?`）
- **役割**: SOSL `RETURNING` の対象オブジェクト 1 件と、その括弧内オプション。

| 変数           | 型                                                     | 内容                                                              |
| -------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| `type`         | `'fieldSpec'`                                          | 継承                                                              |
| `value`        | `SoslIdTypeClass \| ErrorTypeClass`                    | オブジェクト名（`soslId(0)`）                                     |
| `fieldList`    | `FieldListTypeClass \| ErrorTypeClass \| null`         | 取得項目。括弧が無ければ `null`                                   |
| `where`        | `LogicalExpressionTypeClass \| ErrorTypeClass \| null` | WHERE 条件。無ければ `null`                                       |
| `listView`     | `SoslIdTypeClass \| ErrorTypeClass \| null`            | `USING LISTVIEW = xxx` のビュー名（`soslId(1)`）。無ければ `null` |
| `orderBy`      | `FieldOrderListTypeClass \| ErrorTypeClass \| null`    | ORDER BY。無ければ `null`                                         |
| `limitClause`  | `LimitClauseTypeClass \| ErrorTypeClass \| null`       | LIMIT。無ければ `null`                                            |
| `offsetClause` | `OffsetClauseTypeClass \| ErrorTypeClass \| null`      | OFFSET。無ければ `null`                                           |

ゲッター: `getValue()`, `getFieldList()`, `getWhere()`, `getListView()`, `getOrderBy()`, `getLimitClause()`, `getOffsetClause()`

例:

```apex
RETURNING Lead(Id, FirstName, LastName USING LISTVIEW = MyLeads OFFSET 5)
```

```json
{
    "type": "fieldSpec",
    "value": { "type": "soslId", "value": [{ "type": "id", "value": "Lead" }] },
    "fieldList": {
        "type": "fieldList",
        "value": [
            { "type": "soslField", "value": { "type": "soslId", "value": "..." }, "func": null },
            "...",
            "..."
        ]
    },
    "where": null,
    "listView": { "type": "soslId", "value": [{ "type": "id", "value": "MyLeads" }] },
    "orderBy": null,
    "limitClause": null,
    "offsetClause": { "type": "offsetClause", "value": "5" }
}
```

### `SearchGroupTypeClass`（searchGroup.ts）

- **type**: `'searchGroup'`
- **継承**: `QueryTypeClass<string>`
- **元 Context**: `SearchGroupContext`（文法: `(ALL | EMAIL | NAME | PHONE | SIDEBAR) FIELDS`）
- **役割**: SOSL `IN xxx FIELDS` の検索対象グループ。

| 変数    | 型              | 内容                                                     |
| ------- | --------------- | -------------------------------------------------------- |
| `type`  | `'searchGroup'` | 継承                                                     |
| `value` | `string`        | `'ALL'` / `'EMAIL'` / `'NAME'` / `'PHONE'` / `'SIDEBAR'` |

ゲッター: `getValue()`

例:

```apex
[FIND 'test' IN ALL FIELDS RETURNING Account, Contact]
```

```json
{ "type": "searchGroup", "value": "ALL" }
```

### `SoqlFunctionTypeClass`（soqlFunction.ts）

- **type**: `'soqlFunction'`
- **継承**: `QueryTypeClass<SoqlFunctionValueType>`
- **元 Context**: `SoqlFunctionContext`（文法: `AVG(fieldName) | COUNT() | COUNT(fieldName) | ... | CALENDAR_MONTH(dateFieldName) | ... | FORMAT(fieldName | soqlFunction) | FIELDS(soqlFieldsParameter) | DISTANCE(locationValue, locationValue, StringLiteral)`）
- **役割**: SOQL の集計・日付・変換関数呼び出し。

| 変数    | 型                                            | 内容                                 |
| ------- | --------------------------------------------- | ------------------------------------ |
| `type`  | `'soqlFunction'`                              | 継承                                 |
| `value` | `SoqlFunctionValueType \| ErrorTypeClass`     | 関数名（下記）                       |
| `param` | `SoqlParameterType \| ErrorTypeClass \| null` | 引数（関数名ごとに型が異なる、下記） |

`SoqlParameterType` = `FieldNameTypeClass | DateFieldNameTypeClass | SoqlFieldsParameterTypeClass | (LocationValueTypeClass | ErrorTypeClass | string | string[])[] | SoqlFunctionTypeClass`

| 関数名（`value`）                                                                                                                                                                                                                          | `param`                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `'AVG'`, `'COUNT_DISTINCT'`, `'MIN'`, `'MAX'`, `'SUM'`, `'TOLABEL'`, `'GROUPING'`, `'CONVERT_CURRENCY'`                                                                                                                                    | `FieldNameTypeClass`                                                                                                                             |
| `'COUNT'`                                                                                                                                                                                                                                  | `COUNT(field)` は `FieldNameTypeClass`、`COUNT()` は `null`                                                                                      |
| `'CALENDAR_MONTH'`, `'CALENDAR_QUARTER'`, `'CALENDAR_YEAR'`, `'DAY_IN_MONTH'`, `'DAY_IN_WEEK'`, `'DAY_IN_YEAR'`, `'DAY_ONLY'`, `'FISCAL_MONTH'`, `'FISCAL_QUARTER'`, `'FISCAL_YEAR'`, `'HOUR_IN_DAY'`, `'WEEK_IN_MONTH'`, `'WEEK_IN_YEAR'` | `DateFieldNameTypeClass`                                                                                                                         |
| `'FORMAT'`                                                                                                                                                                                                                                 | `FieldNameTypeClass` または入れ子の `SoqlFunctionTypeClass`。どちらも無ければ `null`                                                             |
| `'FIELDS'`                                                                                                                                                                                                                                 | `SoqlFieldsParameterTypeClass`（`ALL` / `CUSTOM` / `STANDARD`）                                                                                  |
| `'DISTANCE'`                                                                                                                                                                                                                               | 配列 `[locationValue, locationValue, 単位]`。単位は `StringLiteral` なら引用符付き文字列、`MultilineStringLiteral` なら改行で分割した `string[]` |

ゲッター: `getValue()`, `getParam()`

例:

```apex
WHERE DISTANCE(BillingAddress, GEOLOCATION(37.775, -122.418), 'km') < 20
```

```json
{
    "type": "soqlFunction",
    "value": "DISTANCE",
    "param": [
        {
            "type": "locationValue",
            "value": { "type": "fieldName", "value": ["..."] },
            "coordinates": null
        },
        { "type": "locationValue", "value": null, "coordinates": ["...", "..."] },
        "'km'"
    ]
}
```

```apex
FORMAT(convertCurrency(AnnualRevenue))
```

```json
{
    "type": "soqlFunction",
    "value": "FORMAT",
    "param": {
        "type": "soqlFunction",
        "value": "CONVERT_CURRENCY",
        "param": { "type": "fieldName", "value": ["..."] }
    }
}
```
