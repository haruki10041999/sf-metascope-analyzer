# idVisitor

識別子（`id` / `anyId`）と SOQL・SOSL 内の識別子（`soqlId` / `soslId`）を IR に変換する。他の Visitor から名前・項目名・オブジェクト名の末端ノードとして使われる。
子要素の変換に失敗した場合、そのフィールドには `ErrorTypeClass`（`type: 'AnalyzerError'`、`contextType` / `context` / `errorMessage`）が入る（`IdValueTypeClass` 系は文字列のみで子を持たない）。

## Visitor

| visit メソッド | Context         | 生成する TypeClass  |
| -------------- | --------------- | ------------------- |
| `visitId`      | `IdContext`     | `NormalIdTypeClass` |
| `visitAnyId`   | `AnyIdContext`  | `AnyIdTypeClass`    |
| `visitSoqlId`  | `SoqlIdContext` | `SoqlIdTypeClass`   |
| `visitSoslId`  | `SoslIdContext` | `SoslIdTypeClass`   |

## 基底クラス（base.ts）

### `IdValueTypeClass<T>`

素の値（文字列）を持つ識別子の基底。`value` に `ErrorTypeClass` を取らない。

| 変数    | 型       | 内容                                   |
| ------- | -------- | -------------------------------------- |
| `type`  | `string` | ノード種別（CommonTypeClass から継承） |
| `value` | `T`      | 識別子の値                             |

ゲッター: `getValue()`, `getType()`

### `IdTypeClass<T>`

子ノードを 1 つ持つ識別子の基底。

| 変数    | 型                    | 内容                                   |
| ------- | --------------------- | -------------------------------------- |
| `type`  | `string`              | ノード種別（CommonTypeClass から継承） |
| `value` | `T \| ErrorTypeClass` | 子ノード                               |

ゲッター: `getValue()`, `getType()`

### `IdListTypeClass<T>`

子ノードの配列を持つ識別子の基底。

| 変数    | 型                        | 内容                                   |
| ------- | ------------------------- | -------------------------------------- |
| `type`  | `string`                  | ノード種別（CommonTypeClass から継承） |
| `value` | `(T \| ErrorTypeClass)[]` | 子ノードの配列                         |

ゲッター: `getValue()`, `getType()`

### `IdAllTypeClass`（型エイリアス）

`IdValueTypeClass<unknown> | IdTypeClass<unknown> | IdListTypeClass<unknown>`。`IdVisitor` の戻り値型。

### `isIdTypeAll(target)`（ガード関数）

`IdValueTypeClass` / `IdTypeClass` / `IdListTypeClass` のいずれかのインスタンスなら `true`。

## TypeClass

### `NormalIdTypeClass`（normal.ts）

- **type**: `'id'`
- **継承**: `IdValueTypeClass<string>`
- **元 Context**: `IdContext`（文法: `Identifier` または識別子として使える一部キーワード）
- **役割**: 一般的な識別子（クラス名・変数名・メソッド名など）。

| 変数    | 型       | 内容                                |
| ------- | -------- | ----------------------------------- |
| `type`  | `'id'`   | 継承                                |
| `value` | `string` | `ctx.getText()`（識別子のテキスト） |

ゲッター: `getValue()`

例:

```apex
... class ParserTest ...
```

```json
{ "type": "id", "value": "ParserTest" }
```

### `AnyIdTypeClass`（anyId.ts）

- **type**: `'anyId'`
- **継承**: `IdValueTypeClass<string>`
- **元 Context**: `AnyIdContext`（文法: `Identifier` または任意のキーワード）
- **役割**: キーワードも許す識別子。`new` の型名（`idCreatedNamePair`）、ドット後のメンバー名、`dotMethodCall` のメソッド名で使われる。

| 変数    | 型        | 内容            |
| ------- | --------- | --------------- |
| `type`  | `'anyId'` | 継承            |
| `value` | `string`  | `ctx.getText()` |

ゲッター: `getValue()`

例:

```apex
new List<String>()
```

```json
{ "type": "anyId", "value": "List" }
```

### `SoqlIdTypeClass`（soqlId.ts）

- **type**: `'soqlId'`
- **継承**: `IdTypeClass<NormalIdTypeClass>`
- **元 Context**: `SoqlIdContext`（文法: `id`）
- **役割**: SOQL 内の識別子（項目名・オブジェクト名・エイリアス・データカテゴリ名など）。

| 変数    | 型                                    | 内容             |
| ------- | ------------------------------------- | ---------------- |
| `type`  | `'soqlId'`                            | 継承             |
| `value` | `NormalIdTypeClass \| ErrorTypeClass` | 識別子（`'id'`） |

ゲッター: `getValue()`

例:

```apex
[SELECT OwnerId FROM Account LIMIT 1]
```

```json
{ "type": "soqlId", "value": { "type": "id", "value": "OwnerId" } }
```

### `SoslIdTypeClass`（soslId.ts）

- **type**: `'soslId'`
- **継承**: `IdListTypeClass<NormalIdTypeClass>`
- **元 Context**: `SoslIdContext`（文法: `id (DOT soslId)*`）
- **役割**: SOSL 内のドット区切り識別子。再帰的な `soslId` を展開し、`id` の平坦な配列にする。

| 変数    | 型                                        | 内容                                                                                                                                |
| ------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `type`  | `'soslId'`                                | 継承                                                                                                                                |
| `value` | `(NormalIdTypeClass \| ErrorTypeClass)[]` | ドット区切りの各要素（`'id'`）を先頭から順に並べた配列。1 件以上。入れ子の `soslId` 変換に失敗した場合はその位置に `ErrorTypeClass` |

ゲッター: `getValue()`

例:

```apex
[FIND 'test' IN ALL FIELDS RETURNING Account, Contact]
```

```json
{ "type": "soslId", "value": [{ "type": "id", "value": "Account" }] }
```
