# entryVisitor

SOQL の SELECT 句（`selectList` / `subFieldList`）に並ぶ項目 1 件を IR に変換する。項目本体と別名（alias）を保持する。

## Visitor

| visit メソッド       | Context                | 生成する TypeClass       |
| -------------------- | ---------------------- | ------------------------ |
| `visitSelectEntry`   | `SelectEntryContext`   | `SelectEntryTypeClass`   |
| `visitSubFieldEntry` | `SubFieldEntryContext` | `SubFieldEntryTypeClass` |

`EntryVisitor` は `CommonVisitor<EntryTypeClass<unknown>>` を継承する。`create()` が例外を投げた場合や子要素が無い場合は `ErrorTypeClass` が返る。

## 基底クラス（base.ts）

### `EntryTypeClass<T>`

entryVisitor の全 TypeClass の基底。`type` と単一の `value` を持つ。

| 変数    | 型                    | 内容                                   |
| ------- | --------------------- | -------------------------------------- |
| `type`  | `string`              | ノード種別（CommonTypeClass から継承） |
| `value` | `T \| ErrorTypeClass` | SELECT 項目の本体                      |

ゲッター: `getType()`, `getValue()`

### `isEntryTypeAll`（ガード関数）

`target instanceof EntryTypeClass` を返す（`target is EntryTypeClass<unknown>`）。

## TypeClass

### `SelectEntryTypeClass`（selectEntry.ts）

- **type**: `'selectEntry'`
- **継承**: `EntryTypeClass<SelectEntryTypeClassType>`（`SelectEntryTypeClassType` = `FieldNameTypeClass | SoqlFunctionTypeClass | SubQueryTypeClass | TypeOfTypeClass`）
- **元 Context**: `SelectEntryContext`（文法: `fieldName soqlId? | soqlFunction soqlId? | ( subQuery ) soqlId? | typeOf`）
- **役割**: トップレベル `query` の SELECT 項目 1 件。

| 変数    | 型                                           | 内容                                                                                    |
| ------- | -------------------------------------------- | --------------------------------------------------------------------------------------- |
| `type`  | `'selectEntry'`                              | 継承                                                                                    |
| `value` | `SelectEntryTypeClassType \| ErrorTypeClass` | 項目名 / SOQL 関数 / 子リレーションクエリ / TYPEOF のいずれか                           |
| `alias` | `SoqlIdTypeClass \| ErrorTypeClass \| null`  | 別名（`COUNT(Id) total` の `total`）。文法上 `soqlId` は常に別名。指定が無ければ `null` |

ゲッター: `getValue()`, `getAlias()`

`fieldName` / `soqlFunction` / `subQuery` / `typeOf` のいずれも無い場合は例外（→ `ErrorTypeClass`）。

例:

```apex
SELECT Industry, COUNT(Id) total FROM Account GROUP BY Industry
```

```json
{
    "type": "selectEntry",
    "value": {
        "type": "soqlFunction",
        "value": "COUNT",
        "param": { "type": "fieldName", "value": [{ "type": "soqlId", "value": "..." }] }
    },
    "alias": { "type": "soqlId", "value": { "type": "id", "value": "total" } }
}
```

### `SubFieldEntryTypeClass`（subFieldEntry.ts）

- **type**: `'subFieldEntry'`
- **継承**: `EntryTypeClass<SubFieldEntryTypeClassType>`（`SubFieldEntryTypeClassType` = `FieldNameTypeClass | SoqlFunctionTypeClass | SubQueryTypeClass | TypeOfTypeClass`）
- **元 Context**: `SubFieldEntryContext`（文法: `fieldName soqlId? | soqlFunction soqlId? | ( subQuery ) soqlId? | typeOf`）
- **役割**: `subQuery` の SELECT 項目 1 件。構造は `SelectEntryTypeClass` と同じ。

| 変数    | 型                                             | 内容                                                    |
| ------- | ---------------------------------------------- | ------------------------------------------------------- |
| `type`  | `'subFieldEntry'`                              | 継承                                                    |
| `value` | `SubFieldEntryTypeClassType \| ErrorTypeClass` | 項目名 / SOQL 関数 / サブクエリ / TYPEOF のいずれか     |
| `alias` | `SoqlIdTypeClass \| ErrorTypeClass \| null`    | 別名。文法上 `soqlId` は常に別名。指定が無ければ `null` |

ゲッター: `getValue()`, `getAlias()`

`fieldName` / `soqlFunction` / `subQuery` / `typeOf` のいずれも無い場合は例外（→ `ErrorTypeClass`）。

例:

```apex
(SELECT Id, FirstName, Account.Name FROM Contacts ...)
```

```json
{
    "type": "subFieldEntry",
    "value": { "type": "fieldName", "value": [{ "type": "soqlId", "value": "..." }] },
    "alias": null
}
```
