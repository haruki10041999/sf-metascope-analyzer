# clauseVisitor

SOQL / SOSL の各句（WHERE / WITH / GROUP BY / ORDER BY / LIMIT / OFFSET / FOR / USING SCOPE / TYPEOF など）と、その構成要素、および Apex の `catch` 節を IR に変換する。

## Visitor

| visit メソッド               | Context                        | 生成する TypeClass               |
| ---------------------------- | ------------------------------ | -------------------------------- |
| `visitCatchClause`           | `CatchClauseContext`           | `CatchClauseTypeClass`           |
| `visitAllRowsClause`         | `AllRowsClauseContext`         | `AllRowsClauseTypeClass`         |
| `visitOffsetClause`          | `OffsetClauseContext`          | `OffsetClauseTypeClass`          |
| `visitLimitClause`           | `LimitClauseContext`           | `LimitClauseTypeClass`           |
| `visitForClauses`            | `ForClausesContext`            | `ForClausesTypeClass`            |
| `visitElseClause`            | `ElseClauseContext`            | `ElseClauseTypeClass`            |
| `visitGroupByClause`         | `GroupByClauseContext`         | `GroupByClauseTypeClass`         |
| `visitOrderByClause`         | `OrderByClauseContext`         | `OrderByClauseTypeClass`         |
| `visitWithClause`            | `WithClauseContext`            | `WithClauseTypeClass`            |
| `visitWhereClause`           | `WhereClauseContext`           | `WhereClauseTypeClass`           |
| `visitWhenClause`            | `WhenClauseContext`            | `WhenClauseTypeClass`            |
| `visitSoslWithClause`        | `SoslWithClauseContext`        | `SoslWithClauseTypeClass`        |
| `visitSoslClauses`           | `SoslClausesContext`           | `SoslClausesTypeClass`           |
| `visitDataCategorySelection` | `DataCategorySelectionContext` | `DataCategorySelectionTypeClass` |
| `visitFieldGroupBy`          | `FieldGroupByContext`          | `FieldGroupByTypeClass`          |
| `visitFieldOrder`            | `FieldOrderContext`            | `FieldOrderTypeClass`            |
| `visitFilteringSelector`     | `FilteringSelectorContext`     | `FilteringSelectorTypeClass`     |
| `visitUpdateType`            | `UpdateTypeContext`            | `UpdateTypeTypeClass`            |
| `visitUsingScope`            | `UsingScopeContext`            | `UsingScopeTypeClass`            |
| `visitTypeOf`                | `TypeOfContext`                | `TypeOfTypeClass`                |

`ClauseVisitor` は `CommonVisitor<ClauseAllTypeClass>` を継承する。`create()` が例外を投げた場合や子要素が無い場合は `ErrorTypeClass` が返る。

## 基底クラス（base.ts）

### `ClauseTypeClass<T>`

単一の `value` を持つ句の基底。

| 変数    | 型                    | 内容                                     |
| ------- | --------------------- | ---------------------------------------- |
| `type`  | `string`              | ノード種別（CommonTypeClass から継承）   |
| `value` | `T \| ErrorTypeClass` | 句の主値（サブクラスごとに意味が異なる） |

ゲッター: `getType()`, `getValue()`

### `ClauseListTypeClass<T>`

`value` が配列の句の基底（現状 `ForClausesTypeClass` のみ）。

| 変数    | 型                        | 内容                                   |
| ------- | ------------------------- | -------------------------------------- |
| `type`  | `string`                  | ノード種別（CommonTypeClass から継承） |
| `value` | `(T \| ErrorTypeClass)[]` | 要素の配列                             |

ゲッター: `getType()`, `getValue()`

### `ClauseAllTypeClass`（型エイリアス）

`ClauseTypeClass<unknown> | ClauseListTypeClass<unknown>`。`ClauseVisitor` の戻り値型。

### `isClauseTypeClass`（ガード関数）

`target instanceof ClauseTypeClass || target instanceof ClauseListTypeClass` を返す。

## TypeClass

### `AllRowsClauseTypeClass`（allRowsClause.ts）

- **type**: `'allRowsClause'`
- **継承**: `ClauseTypeClass<string>`
- **元 Context**: `AllRowsClauseContext`（文法: `ALL ROWS`）
- **役割**: 削除済み・アーカイブ済みレコードを含める `ALL ROWS`。

| 変数    | 型                         | 内容                                                                             |
| ------- | -------------------------- | -------------------------------------------------------------------------------- |
| `type`  | `'allRowsClause'`          | 継承                                                                             |
| `value` | `string \| ErrorTypeClass` | `ALL` と `ROWS` のソーステキストを空白で連結した文字列（大小文字はソースのまま） |

ゲッター: `getValue()`

例:

```apex
[SELECT Id FROM Account WHERE IsDeleted = true ALL ROWS]
```

```json
{ "type": "allRowsClause", "value": "ALL ROWS" }
```

### `CatchClauseTypeClass`（catchClause.ts）

- **type**: `'catchClause'`
- **継承**: `ClauseTypeClass<NormalIdTypeClass>`
- **元 Context**: `CatchClauseContext`（文法: `CATCH ( modifier* qualifiedName id ) block`）
- **役割**: try 文の `catch` 節。

| 変数        | 型                                              | 内容                                   |
| ----------- | ----------------------------------------------- | -------------------------------------- |
| `type`      | `'catchClause'`                                 | 継承                                   |
| `value`     | `NormalIdTypeClass \| ErrorTypeClass`           | 例外変数名                             |
| `valueType` | `QualifiedNameTypeClass \| ErrorTypeClass`      | 捕捉する例外型                         |
| `block`     | `NormalBlockTypeClass \| ErrorTypeClass`        | catch ブロック本体                     |
| `modifier`  | `(NormalModifierTypeClass \| ErrorTypeClass)[]` | 修飾子（`final` など）。無ければ空配列 |

ゲッター: `getValue()`, `getValueType()`, `getBlock()`, `getModifier()`

例:

```apex
} catch (Exception e) { ... }
```

```json
{
    "type": "catchClause",
    "value": { "type": "id", "value": "e" },
    "valueType": { "type": "qualifiedName", "value": [{ "type": "id", "value": "Exception" }] },
    "block": { "type": "block", "value": ["..."] },
    "modifier": []
}
```

### `DataCategorySelectionTypeClass`（dataCategorySelection.ts）

- **type**: `'dataCategorySelection'`
- **継承**: `ClauseTypeClass<SoqlIdTypeClass>`
- **元 Context**: `DataCategorySelectionContext`（文法: `soqlId filteringSelector dataCategoryName`）
- **役割**: `WITH DATA CATEGORY` の条件 1 件（`filteringExpression` の要素）。

| 変数       | 型                                             | 内容                                        |
| ---------- | ---------------------------------------------- | ------------------------------------------- |
| `type`     | `'dataCategorySelection'`                      | 継承                                        |
| `value`    | `SoqlIdTypeClass \| ErrorTypeClass`            | データカテゴリグループ名                    |
| `selector` | `FilteringSelectorTypeClass \| ErrorTypeClass` | `AT` / `ABOVE` / `BELOW` / `ABOVE_OR_BELOW` |
| `category` | `DataCategoryNameTypeClass \| ErrorTypeClass`  | カテゴリ名（1 件または括弧内の複数）        |

ゲッター: `getValue()`, `getSelector()`, `getCategory()`

例:

```apex
WITH DATA CATEGORY Geography__c AT (Usa__c, Uk__c)
```

```json
{
    "type": "dataCategorySelection",
    "value": { "type": "soqlId", "value": { "type": "id", "value": "Geography__c" } },
    "selector": { "type": "filteringSelector", "value": "AT" },
    "category": {
        "type": "dataCategoryName",
        "value": [
            { "type": "soqlId", "value": "..." },
            { "type": "soqlId", "value": "..." }
        ]
    }
}
```

### `ElseClauseTypeClass`（elseClause.ts）

- **type**: `'elseClause'`
- **継承**: `ClauseTypeClass<FieldNameListTypeClass>`
- **元 Context**: `ElseClauseContext`（文法: `ELSE fieldNameList`）
- **役割**: `TYPEOF` の `ELSE` 部。

| 変数    | 型                                         | 内容                      |
| ------- | ------------------------------------------ | ------------------------- |
| `type`  | `'elseClause'`                             | 継承                      |
| `value` | `FieldNameListTypeClass \| ErrorTypeClass` | ELSE で取得する項目リスト |

ゲッター: `getValue()`

例:

```apex
ELSE Name
```

```json
{
    "type": "elseClause",
    "value": { "type": "fieldNameList", "value": [{ "type": "fieldName", "value": "..." }] }
}
```

### `FieldGroupByTypeClass`（fieldGroupBy.ts）

- **type**: `'fieldGroupBy'`
- **継承**: `ClauseTypeClass<FieldNameTypeClass | SoqlFunctionTypeClass>`
- **元 Context**: `FieldGroupByContext`（文法: `fieldName | soqlFunction`）
- **役割**: GROUP BY の項目 1 件。

| 変数    | 型                                                              | 内容                                                     |
| ------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| `type`  | `'fieldGroupBy'`                                                | 継承                                                     |
| `value` | `FieldNameTypeClass \| SoqlFunctionTypeClass \| ErrorTypeClass` | 項目名、または関数（`CALENDAR_MONTH(CreatedDate)` など） |

ゲッター: `getValue()`

例:

```apex
GROUP BY CALENDAR_MONTH(CreatedDate)
```

```json
{
    "type": "fieldGroupBy",
    "value": {
        "type": "soqlFunction",
        "value": "CALENDAR_MONTH",
        "param": { "type": "dateFieldName", "value": "...", "isConvertTimeZone": false }
    }
}
```

### `FieldOrderTypeClass`（fieldOrder.ts）

- **type**: `'fieldOrder'`
- **継承**: `ClauseTypeClass<FieldNameTypeClass | SoqlFunctionTypeClass>`
- **元 Context**: `FieldOrderContext`（文法: `(fieldName | soqlFunction) (ASC | DESC)? (NULLS (FIRST | LAST))?`）
- **役割**: ORDER BY の項目 1 件。

| 変数        | 型                                                              | 内容                                                      |
| ----------- | --------------------------------------------------------------- | --------------------------------------------------------- |
| `type`      | `'fieldOrder'`                                                  | 継承                                                      |
| `value`     | `FieldNameTypeClass \| SoqlFunctionTypeClass \| ErrorTypeClass` | 並び替え対象                                              |
| `direction` | `string \| null`                                                | `'ASC'` / `'DESC'`。省略時 `null`                         |
| `nulls`     | `string \| null`                                                | `'FIRST'` / `'LAST'`（`NULLS FIRST/LAST`）。省略時 `null` |

ゲッター: `getValue()`, `getDirection()`, `getNulls()`

例:

```apex
ORDER BY Name ASC NULLS FIRST
```

```json
{
    "type": "fieldOrder",
    "value": {
        "type": "fieldName",
        "value": [{ "type": "soqlId", "value": { "type": "id", "value": "Name" } }]
    },
    "direction": "ASC",
    "nulls": "FIRST"
}
```

### `FilteringSelectorTypeClass`（filteringSelector.ts）

- **type**: `'filteringSelector'`
- **継承**: `ClauseTypeClass<string>`
- **元 Context**: `FilteringSelectorContext`（文法: `AT | ABOVE | BELOW | ABOVE_OR_BELOW`）
- **役割**: データカテゴリ条件のセレクタ。

| 変数    | 型                    | 内容                                                |
| ------- | --------------------- | --------------------------------------------------- |
| `type`  | `'filteringSelector'` | 継承                                                |
| `value` | `string`              | `'AT'` / `'ABOVE'` / `'BELOW'` / `'ABOVE_OR_BELOW'` |

ゲッター: `getValue()`

例:

```apex
Product__c ABOVE_OR_BELOW Mobile__c
```

```json
{ "type": "filteringSelector", "value": "ABOVE_OR_BELOW" }
```

### `ForClausesTypeClass`（forClauses.ts）

- **type**: `'forClauses'`
- **継承**: `ClauseListTypeClass<'VIEW' | 'UPDATE' | 'REFERENCE'>`
- **元 Context**: `ForClausesContext`（文法: `(FOR (VIEW | UPDATE | REFERENCE))*`。空白区切りで `FOR VIEW FOR UPDATE ...` と並べる。カンマは無い）
- **役割**: SOQL 末尾の `FOR VIEW` / `FOR UPDATE` / `FOR REFERENCE`。FOR 句が無いクエリでは生成されない（クエリ側の `forClause` が `null`）。

| 変数    | 型                                                        | 内容                                                     |
| ------- | --------------------------------------------------------- | -------------------------------------------------------- |
| `type`  | `'forClauses'`                                            | 継承                                                     |
| `value` | `('VIEW' \| 'UPDATE' \| 'REFERENCE' \| ErrorTypeClass)[]` | `'VIEW'` / `'UPDATE'` / `'REFERENCE'` の配列（ソース順） |

ゲッター: `getValue()`

例:

```apex
[SELECT Id FROM Account FOR UPDATE]
```

```json
{ "type": "forClauses", "value": ["UPDATE"] }
```

### `GroupByClauseTypeClass`（groupByClause.ts）

- **type**: `'groupByClause'`
- **継承**: `ClauseTypeClass<FieldGroupByListTypeClass>`
- **元 Context**: `GroupByClauseContext`（文法: `GROUP BY (fieldGroupByList | ROLLUP ( fieldGroupByList ) | CUBE ( fieldGroupByList )) (HAVING logicalExpression)?`）
- **役割**: GROUP BY 句と HAVING 条件。

| 変数     | 型                                                     | 内容                                             |
| -------- | ------------------------------------------------------ | ------------------------------------------------ |
| `type`   | `'groupByClause'`                                      | 継承                                             |
| `value`  | `FieldGroupByListTypeClass \| ErrorTypeClass`          | グループ化項目                                   |
| `mode`   | `string \| null`                                       | `'ROLLUP'` / `'CUBE'`。通常の GROUP BY は `null` |
| `having` | `LogicalExpressionTypeClass \| ErrorTypeClass \| null` | HAVING 条件。HAVING が無ければ `null`            |

ゲッター: `getValue()`, `getMode()`, `getHaving()`

例:

```apex
GROUP BY Industry HAVING COUNT(Id) > 10
```

```json
{
    "type": "groupByClause",
    "value": { "type": "fieldGroupByList", "value": ["..."] },
    "mode": null,
    "having": { "type": "logicalExpression", "value": ["..."], "operator": null }
}
```

### `LimitClauseTypeClass`（limitClause.ts）

- **type**: `'limitClause'`
- **継承**: `ClauseTypeClass<string | BoundExpressionTypeClass>`
- **元 Context**: `LimitClauseContext`（文法: `LIMIT (IntegerLiteral | boundExpression)`）
- **役割**: LIMIT 句（SOQL / SOSL / fieldSpec 共通）。

| 変数    | 型                                                     | 内容                                                        |
| ------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| `type`  | `'limitClause'`                                        | 継承                                                        |
| `value` | `string \| BoundExpressionTypeClass \| ErrorTypeClass` | 整数リテラルならそのテキスト、`:var` なら `boundExpression` |

ゲッター: `getValue()`

例:

```apex
LIMIT :pageSize
```

```json
{
    "type": "limitClause",
    "value": { "type": "boundExpression", "value": { "type": "primaryExpression", "value": "..." } }
}
```

### `OffsetClauseTypeClass`（offsetClause.ts）

- **type**: `'offsetClause'`
- **継承**: `ClauseTypeClass<string | BoundExpressionTypeClass>`
- **元 Context**: `OffsetClauseContext`（文法: `OFFSET (IntegerLiteral | boundExpression)`）
- **役割**: OFFSET 句。

| 変数    | 型                                                     | 内容                                                        |
| ------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| `type`  | `'offsetClause'`                                       | 継承                                                        |
| `value` | `string \| BoundExpressionTypeClass \| ErrorTypeClass` | 整数リテラルならそのテキスト、`:var` なら `boundExpression` |

ゲッター: `getValue()`

例:

```apex
OFFSET 10
```

```json
{ "type": "offsetClause", "value": "10" }
```

### `OrderByClauseTypeClass`（orderByClause.ts）

- **type**: `'orderByClause'`
- **継承**: `ClauseTypeClass<FieldOrderListTypeClass>`
- **元 Context**: `OrderByClauseContext`（文法: `ORDER BY fieldOrderList`）
- **役割**: SOQL の ORDER BY 句。

| 変数    | 型                                          | 内容               |
| ------- | ------------------------------------------- | ------------------ |
| `type`  | `'orderByClause'`                           | 継承               |
| `value` | `FieldOrderListTypeClass \| ErrorTypeClass` | 並び替え項目リスト |

ゲッター: `getValue()`

例:

```apex
ORDER BY LastName
```

```json
{
    "type": "orderByClause",
    "value": {
        "type": "fieldOrderList",
        "value": [{ "type": "fieldOrder", "value": "...", "direction": null, "nulls": null }]
    }
}
```

### `SoslClausesTypeClass`（soslClauses.ts）

- **type**: `'soslClauses'`
- **継承**: `ClauseTypeClass<SearchGroupTypeClass | null>`
- **元 Context**: `SoslClausesContext`（文法: `(IN searchGroup)? (RETURNING fieldSpecList)? soslWithClause* limitClause? (UPDATE updateList)?`）
- **役割**: SOSL の `FIND` 以降の句をまとめたもの。すべて任意。

| 変数            | 型                                                      | 内容                                               |
| --------------- | ------------------------------------------------------- | -------------------------------------------------- |
| `type`          | `'soslClauses'`                                         | 継承                                               |
| `value`         | `SearchGroupTypeClass \| ErrorTypeClass \| null`        | `IN xxx FIELDS`。無ければ `null`                   |
| `fieldSpecList` | `FieldSpecListTypeClass \| ErrorTypeClass \| null`      | RETURNING 対象。無ければ `null`                    |
| `withList`      | `(SoslWithClauseTypeClass \| ErrorTypeClass)[] \| null` | WITH 句の配列。1 件も無ければ空配列ではなく `null` |
| `limitClause`   | `LimitClauseTypeClass \| ErrorTypeClass \| null`        | LIMIT。無ければ `null`                             |
| `updateList`    | `UpdateListTypeClass \| ErrorTypeClass \| null`         | `UPDATE TRACKING, VIEWSTAT`。無ければ `null`       |

ゲッター: `getValue()`, `getFieldSpecList()`, `getWithList()`, `getLimitClause()`, `getUpdateList()`

例:

```apex
[FIND :keyword IN NAME FIELDS RETURNING Account(...), Contact(...), Lead(...)
 WITH DIVISION = 'Global' WITH SNIPPET (target_length = 120) ...
 LIMIT 100 UPDATE TRACKING, VIEWSTAT]
```

```json
{
    "type": "soslClauses",
    "value": { "type": "searchGroup", "value": "NAME" },
    "fieldSpecList": { "type": "fieldSpecList", "value": ["...", "...", "..."] },
    "withList": [
        { "type": "soslWithClause", "value": "DIVISION", "content": "'Global'" },
        { "type": "soslWithClause", "value": "SNIPPET", "content": "120" },
        "..."
    ],
    "limitClause": { "type": "limitClause", "value": "100" },
    "updateList": { "type": "updateList", "value": ["...", "..."] }
}
```

### `SoslWithClauseTypeClass`（soslWithClause.ts）

- **type**: `'soslWithClause'`
- **継承**: `ClauseTypeClass<string>`
- **元 Context**: `SoslWithClauseContext`（文法: `WITH (DIVISION = ... | DATA CATEGORY filteringExpression | SNIPPET (( TARGET_LENGTH = IntegerLiteral ))? | NETWORK IN ( networkList ) | NETWORK = StringLiteral | PRICEBOOKID = ... | METADATA = StringLiteral | HIGHLIGHT | SPELL_CORRECTION = BooleanLiteral | SYSTEM_MODE | USER_MODE)`）
- **役割**: SOSL の WITH 句 1 件。

| 変数      | 型                                                | 内容                                                                                                                                         |
| --------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`    | `'soslWithClause'`                                | 継承                                                                                                                                         |
| `value`   | `string`                                          | WITH の種類（下記）                                                                                                                          |
| `content` | `SoslWithClauseContent \| ErrorTypeClass \| null` | 種類ごとの値（下記）。`SoslWithClauseContent` = `string \| BoundExpressionTypeClass \| FilteringExpressionTypeClass \| NetworkListTypeClass` |

| `value`                                       | `content`                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| `'DIVISION'`, `'PRICEBOOKID'`                 | 文字列リテラル（引用符付き）または `BoundExpressionTypeClass`            |
| `'DATA_CATEGORY'`                             | `FilteringExpressionTypeClass`                                           |
| `'SNIPPET'`                                   | `target_length` の整数テキスト。省略時 `null`                            |
| `'SPELL_CORRECTION'`                          | `'true'` / `'false'`                                                     |
| `'NETWORK'`                                   | `IN (...)` 形式は `NetworkListTypeClass`、`= '...'` 形式は文字列リテラル |
| `'METADATA'`                                  | 文字列リテラル。無ければ `null`                                          |
| `'HIGHLIGHT'`, `'SYSTEM_MODE'`, `'USER_MODE'` | 常に `null`                                                              |

ゲッター: `getValue()`, `getContent()`

例:

```apex
WITH NETWORK IN ('0DBxx0000000001', '0DBxx0000000002')
```

```json
{
    "type": "soslWithClause",
    "value": "NETWORK",
    "content": { "type": "networkList", "value": ["'0DBxx0000000001'", "'0DBxx0000000002'"] }
}
```

### `TypeOfTypeClass`（typeOf.ts）

- **type**: `'typeOf'`
- **継承**: `ClauseTypeClass<FieldNameTypeClass>`
- **元 Context**: `TypeOfContext`（文法: `TYPEOF fieldName whenClause+ elseClause? END`）
- **役割**: ポリモーフィックリレーションの `TYPEOF ... END`。

| 変数         | 型                                              | 内容                                      |
| ------------ | ----------------------------------------------- | ----------------------------------------- |
| `type`       | `'typeOf'`                                      | 継承                                      |
| `value`      | `FieldNameTypeClass \| ErrorTypeClass`          | 対象のポリモーフィック項目（`What` など） |
| `whenClause` | `(WhenClauseTypeClass \| ErrorTypeClass)[]`     | WHEN 節の配列（1 件以上）                 |
| `elseClause` | `ElseClauseTypeClass \| ErrorTypeClass \| null` | ELSE 節。無ければ `null`                  |

ゲッター: `getValue()`, `getWhenClause()`, `getElseClause()`

例:

```apex
TYPEOF What
    WHEN Account THEN Name, Phone
    WHEN Opportunity THEN Amount, CloseDate
    ELSE Name
END
```

```json
{
    "type": "typeOf",
    "value": {
        "type": "fieldName",
        "value": [{ "type": "soqlId", "value": { "type": "id", "value": "What" } }]
    },
    "whenClause": [
        {
            "type": "whenClause",
            "value": { "type": "fieldName", "value": ["..."] },
            "field": { "type": "fieldNameList", "value": ["...", "..."] }
        },
        {
            "type": "whenClause",
            "value": { "type": "fieldName", "value": ["..."] },
            "field": { "type": "fieldNameList", "value": ["...", "..."] }
        }
    ],
    "elseClause": { "type": "elseClause", "value": { "type": "fieldNameList", "value": ["..."] } }
}
```

### `UpdateTypeTypeClass`（updateType.ts）

- **type**: `'updateType'`
- **継承**: `ClauseTypeClass<string>`
- **元 Context**: `UpdateTypeContext`（文法: `TRACKING | VIEWSTAT`）
- **役割**: `UPDATE` 句の要素 1 件（`updateList` の要素）。

| 変数    | 型             | 内容                        |
| ------- | -------------- | --------------------------- |
| `type`  | `'updateType'` | 継承                        |
| `value` | `string`       | `'TRACKING'` / `'VIEWSTAT'` |

ゲッター: `getValue()`

例:

```apex
UPDATE TRACKING, VIEWSTAT
```

```json
{ "type": "updateType", "value": "TRACKING" }
```

### `UsingScopeTypeClass`（usingScope.ts）

- **type**: `'usingScope'`
- **継承**: `ClauseTypeClass<SoqlIdTypeClass>`
- **元 Context**: `UsingScopeContext`（文法: `USING SCOPE soqlId`）
- **役割**: SOQL の `USING SCOPE`。

| 変数    | 型                                  | 内容                      |
| ------- | ----------------------------------- | ------------------------- |
| `type`  | `'usingScope'`                      | 継承                      |
| `value` | `SoqlIdTypeClass \| ErrorTypeClass` | スコープ名（`Mine` など） |

ゲッター: `getValue()`

例:

```apex
[SELECT Id FROM Account USING SCOPE Mine]
```

```json
{ "type": "usingScope", "value": { "type": "soqlId", "value": { "type": "id", "value": "Mine" } } }
```

### `WhenClauseTypeClass`（whenClause.ts）

- **type**: `'whenClause'`
- **継承**: `ClauseTypeClass<FieldNameTypeClass>`
- **元 Context**: `WhenClauseContext`（文法: `WHEN fieldName THEN fieldNameList`）
- **役割**: `TYPEOF` の WHEN 節 1 件。

| 変数    | 型                                         | 内容                                       |
| ------- | ------------------------------------------ | ------------------------------------------ |
| `type`  | `'whenClause'`                             | 継承                                       |
| `value` | `FieldNameTypeClass \| ErrorTypeClass`     | 判定するオブジェクト型名（`Account` など） |
| `field` | `FieldNameListTypeClass \| ErrorTypeClass` | THEN で取得する項目リスト                  |

ゲッター: `getValue()`, `getField()`

例:

```apex
WHEN Account THEN Name, Phone
```

```json
{
    "type": "whenClause",
    "value": { "type": "fieldName", "value": [{ "type": "soqlId", "value": "..." }] },
    "field": {
        "type": "fieldNameList",
        "value": [
            { "type": "fieldName", "value": "..." },
            { "type": "fieldName", "value": "..." }
        ]
    }
}
```

### `WhereClauseTypeClass`（whereClause.ts）

- **type**: `'whereClause'`
- **継承**: `ClauseTypeClass<WhereLogicalExpressionTypeClass>`
- **元 Context**: `WhereClauseContext`（文法: `WHERE whereLogicalExpression`）
- **役割**: SOQL の WHERE 句。

| 変数    | 型                                                  | 内容   |
| ------- | --------------------------------------------------- | ------ |
| `type`  | `'whereClause'`                                     | 継承   |
| `value` | `WhereLogicalExpressionTypeClass \| ErrorTypeClass` | 条件式 |

ゲッター: `getValue()`

例:

```apex
WHERE IsActive = true
```

```json
{
    "type": "whereClause",
    "value": {
        "type": "whereLogicalExpression",
        "value": [
            {
                "type": "whereConditionalExpression",
                "value": {
                    "type": "whereFieldExpression",
                    "left": { "type": "fieldExpression", "...": "..." },
                    "right": null,
                    "operator": null
                }
            }
        ],
        "operator": null
    }
}
```

### `WithClauseTypeClass`（withClause.ts）

- **type**: `'withClause'`
- **継承**: `ClauseTypeClass<string | LogicalExpressionTypeClass>`
- **元 Context**: `WithClauseContext`（文法: `WITH DATA CATEGORY filteringExpression | WITH SECURITY_ENFORCED | WITH SYSTEM_MODE | WITH USER_MODE | WITH logicalExpression`）
- **役割**: SOQL の WITH 句。`WITH logicalExpression` 形式では、WITH 直後の論理式を `LogicalExpressionTypeClass` として `value` に保持する。

| 変数    | 型                                                       | 内容                                                                                                                 |
| ------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `type`  | `'withClause'`                                           | 継承                                                                                                                 |
| `value` | `string \| LogicalExpressionTypeClass \| ErrorTypeClass` | モード句では `'SYSTEM_MODE'` / `'USER_MODE'` / `'SECURITY_ENFORCED'` / `'DATA_CATEGORY'`。論理式形式では論理式ノード |
| `field` | `FilteringExpressionTypeClass \| ErrorTypeClass \| null` | `DATA_CATEGORY` の filteringExpression。ほかの形式では `null`                                                        |

ゲッター: `getValue()`, `getField()`

`logicalExpression` は `NOT conditionalExpression`、または `conditionalExpression` を `SOQLAND` / `SOQLOR` で連結する形。各条件は `fieldExpression`、または括弧で囲んだ論理式になる。

例:

```apex
WITH Name = 'Acme' OR Industry = 'Technology'
```

```json
{
    "type": "withClause",
    "value": {
        "type": "logicalExpression",
        "value": ["..."],
        "operator": "OR"
    },
    "field": null
}
```

DATA CATEGORY 形式の例:

```apex
WITH DATA CATEGORY Geography__c AT (Usa__c, Uk__c) AND Product__c ABOVE_OR_BELOW Mobile__c ...
```

```json
{
    "type": "withClause",
    "value": "DATA_CATEGORY",
    "field": {
        "type": "filteringExpression",
        "value": [
            {
                "type": "dataCategorySelection",
                "value": "...",
                "selector": "...",
                "category": "..."
            },
            "..."
        ]
    }
}
```
