# nameVisitor

ドット区切りの名前（修飾名・SOQL 項目名・`new` の生成型名）や型名、SOQL の日付項目名・データカテゴリ名を IR に変換する。

## Visitor

| visit メソッド          | Context                   | 生成する TypeClass          |
| ----------------------- | ------------------------- | --------------------------- |
| `visitQualifiedName`    | `QualifiedNameContext`    | `QualifiedNameTypeClass`    |
| `visitTypeName`         | `TypeNameContext`         | `TypeNameTypeClass`         |
| `visitCreatedName`      | `CreatedNameContext`      | `CreatedNameTypeClass`      |
| `visitFieldName`        | `FieldNameContext`        | `FieldNameTypeClass`        |
| `visitDateFieldName`    | `DateFieldNameContext`    | `DateFieldNameTypeClass`    |
| `visitDataCategoryName` | `DataCategoryNameContext` | `DataCategoryNameTypeClass` |

`NameVisitor` は `CommonVisitor<NameAllTypeClass>` を継承する。`create()` が例外を投げた場合や子要素が無い場合は `ErrorTypeClass` が返る。

## 基底クラス（base.ts）

### `NameTypeClass<T>`

単一の `value` を持つ名前ノードの基底。

| 変数    | 型                    | 内容                                   |
| ------- | --------------------- | -------------------------------------- |
| `type`  | `string`              | ノード種別（CommonTypeClass から継承） |
| `value` | `T \| ErrorTypeClass` | 名前の本体                             |

ゲッター: `getType()`, `getValue()`

### `NameListTypeClass<T>`

名前の構成要素（ドット区切りの各部分など）を配列で持つ名前ノードの基底。

| 変数    | 型                        | 内容                                   |
| ------- | ------------------------- | -------------------------------------- |
| `type`  | `string`                  | ノード種別（CommonTypeClass から継承） |
| `value` | `(T \| ErrorTypeClass)[]` | 構成要素の配列（ソース順）             |

ゲッター: `getType()`, `getValue()`

### `NameAllTypeClass`（型エイリアス）

`NameTypeClass<unknown> | NameListTypeClass<unknown>`。`NameVisitor` の戻り値型。

### `isNameTypeAll`（ガード関数）

`target instanceof NameTypeClass || target instanceof NameListTypeClass` を返す。

## TypeClass

### `CreatedNameTypeClass`（createName.ts）

- **type**: `'createdName'`
- **継承**: `NameListTypeClass<IdCreatedNamePairTypeClass>`
- **元 Context**: `CreatedNameContext`（文法: `idCreatedNamePair (. idCreatedNamePair)*`）
- **役割**: `new Xxx(...)` の生成対象の型名。各部分は名前と型引数のペア。

| 変数    | 型                                                 | 内容                                                                               |
| ------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `type`  | `'createdName'`                                    | 継承                                                                               |
| `value` | `(IdCreatedNamePairTypeClass \| ErrorTypeClass)[]` | ドット区切りの各部分（`left` = 名前、`right` = 型引数の `typeList` または `null`） |

ゲッター: `getValue()`

例:

```apex
names = new List<String>();
```

```json
{
    "type": "createdName",
    "value": [
        {
            "type": "idCreatedNamePair",
            "left": { "type": "anyId", "value": "List" },
            "right": { "type": "typeList", "value": ["..."] }
        }
    ]
}
```

### `DataCategoryNameTypeClass`（dataCategoryName.ts）

- **type**: `'dataCategoryName'`
- **継承**: `NameListTypeClass<SoqlIdTypeClass>`
- **元 Context**: `DataCategoryNameContext`（文法: `soqlId | ( soqlId (, soqlId)* )`）
- **役割**: データカテゴリ条件の右辺のカテゴリ名（単一または括弧内の複数）。

| 変数    | 型                                      | 内容                   |
| ------- | --------------------------------------- | ---------------------- |
| `type`  | `'dataCategoryName'`                    | 継承                   |
| `value` | `(SoqlIdTypeClass \| ErrorTypeClass)[]` | カテゴリ名（1 件以上） |

ゲッター: `getValue()`

例:

```apex
WITH DATA CATEGORY Geography__c AT (Usa__c, Uk__c)
```

```json
{
    "type": "dataCategoryName",
    "value": [
        { "type": "soqlId", "value": { "type": "id", "value": "Usa__c" } },
        { "type": "soqlId", "value": { "type": "id", "value": "Uk__c" } }
    ]
}
```

### `DateFieldNameTypeClass`（dateFieldName.ts）

- **type**: `'dateFieldName'`
- **継承**: `NameTypeClass<FieldNameTypeClass>`
- **元 Context**: `DateFieldNameContext`（文法: `CONVERT_TIMEZONE ( fieldName ) | fieldName`）
- **役割**: SOQL 日付関数（`CALENDAR_MONTH` など）の引数となる日付項目。

| 変数                | 型                                     | 内容                                           |
| ------------------- | -------------------------------------- | ---------------------------------------------- |
| `type`              | `'dateFieldName'`                      | 継承                                           |
| `value`             | `FieldNameTypeClass \| ErrorTypeClass` | 日付項目名                                     |
| `isConvertTimeZone` | `boolean`                              | `convertTimezone(...)` で囲まれていれば `true` |

ゲッター: `getValue()`, `getConvertTimeZone()`（戻り値型の宣言は `boolean | null`）

例:

```apex
CALENDAR_MONTH(CreatedDate)
```

```json
{
    "type": "dateFieldName",
    "value": { "type": "fieldName", "value": [{ "type": "soqlId", "value": "..." }] },
    "isConvertTimeZone": false
}
```

### `FieldNameTypeClass`（fieldName.ts）

- **type**: `'fieldName'`
- **継承**: `NameListTypeClass<SoqlIdTypeClass>`
- **元 Context**: `FieldNameContext`（文法: `soqlId (. soqlId)*`）
- **役割**: SOQL の項目名・オブジェクト名（リレーションをたどるドット区切りを含む）。

| 変数    | 型                                      | 内容                             |
| ------- | --------------------------------------- | -------------------------------- |
| `type`  | `'fieldName'`                           | 継承                             |
| `value` | `(SoqlIdTypeClass \| ErrorTypeClass)[]` | ドット区切りの各部分（1 件以上） |

ゲッター: `getValue()`

例:

```apex
SELECT Parent.Owner.Name FROM Account
```

```json
{
    "type": "fieldName",
    "value": [
        { "type": "soqlId", "value": { "type": "id", "value": "Parent" } },
        { "type": "soqlId", "value": { "type": "id", "value": "Owner" } },
        { "type": "soqlId", "value": { "type": "id", "value": "Name" } }
    ]
}
```

### `QualifiedNameTypeClass`（qualifiedName.ts）

- **type**: `'qualifiedName'`
- **継承**: `NameListTypeClass<NormalIdTypeClass>`
- **元 Context**: `QualifiedNameContext`（文法: `id (. id)*`）
- **役割**: Apex のドット区切り修飾名（`catch` の例外型、`switch` の enum 値など）。

| 変数    | 型                                        | 内容                             |
| ------- | ----------------------------------------- | -------------------------------- |
| `type`  | `'qualifiedName'`                         | 継承                             |
| `value` | `(NormalIdTypeClass \| ErrorTypeClass)[]` | ドット区切りの各部分（1 件以上） |

ゲッター: `getValue()`

例:

```apex
} catch (Exception e) {
```

```json
{ "type": "qualifiedName", "value": [{ "type": "id", "value": "Exception" }] }
```

### `TypeNameTypeClass`（typeName.ts）

- **type**: `'typeName'`
- **継承**: `NameTypeClass<NormalIdTypeClass | 'list' | 'set' | 'map'>`
- **元 Context**: `TypeNameContext`（文法: `LIST typeArguments? | SET typeArguments? | MAP typeArguments? | id typeArguments?`）
- **役割**: 型参照（`typeRef`）を構成する型名 1 つ。

| 変数      | 型                                                                | 内容                                                                                  |
| --------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `type`    | `'typeName'`                                                      | 継承                                                                                  |
| `value`   | `NormalIdTypeClass \| 'list' \| 'set' \| 'map' \| ErrorTypeClass` | `List` / `Set` / `Map` は小文字の文字列 `'list'` / `'set'` / `'map'`、それ以外は `id` |
| `generic` | `TypeArgumentsTypeClass \| ErrorTypeClass \| null`                | 型引数 `<...>`。省略時（ユーザー定義型や `List` 単体）は `null`                       |

ゲッター: `getValue()`, `getGeneric()`

例:

```apex
Map<Id, Account> accountMap
```

```json
{
    "type": "typeName",
    "value": "map",
    "generic": {
        "type": "typeArguments",
        "value": {
            "type": "typeList",
            "value": [
                { "type": "typeRef", "value": "...", "dimension": "..." },
                { "type": "typeRef", "value": "...", "dimension": "..." }
            ]
        }
    }
}
```
