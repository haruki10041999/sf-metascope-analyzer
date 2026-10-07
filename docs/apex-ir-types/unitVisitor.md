# unitVisitor

Apex ソース 1 ファイル分のルートノードを扱う。クラス/インターフェース/enum ファイル（`compilationUnit`）、匿名 Apex（`anonymousUnit`）、トリガー（`triggerUnit`）と、トリガーの起動条件（`triggerCase`）を IR に変換する。
子フィールドは変換失敗時に `ErrorTypeClass`（`type: 'AnalyzerError'`, `contextType` / `context` / `errorMessage`）になり得る。

## Visitor

`UnitVisitor` が扱う Context と生成する TypeClass:

| visit メソッド         | Context                  | 生成する TypeClass         |
| ---------------------- | ------------------------ | -------------------------- |
| `visitCompilationUnit` | `CompilationUnitContext` | `CompilationUnitTypeClass` |
| `visitAnonymousUnit`   | `AnonymousUnitContext`   | `AnonymousUnitTypeClass`   |
| `visitTriggerUnit`     | `TriggerUnitContext`     | `TriggerUnitTypeClass`     |
| `visitTriggerCase`     | `TriggerCaseContext`     | `TriggerCaseTypeClass`     |

## 基底クラス（base.ts）

### `UnitTypeClass<T>`

単一の子ノード（またはスカラー値）を `value` に持つ Unit ノードの基底。

| 変数    | 型                    | 内容                                   |
| ------- | --------------------- | -------------------------------------- |
| `type`  | `string`              | ノード種別（CommonTypeClass から継承） |
| `value` | `T \| ErrorTypeClass` | 子ノードまたは値                       |

ゲッター: `getValue()`, `getType()`（CommonTypeClass）

### `UnitListTypeClass<T>`

子ノードの配列を `value` に持つ Unit ノードの基底。

| 変数    | 型                        | 内容                                   |
| ------- | ------------------------- | -------------------------------------- |
| `type`  | `string`                  | ノード種別（CommonTypeClass から継承） |
| `value` | `(T \| ErrorTypeClass)[]` | 子ノードの配列                         |

ゲッター: `getValue()`, `getType()`（CommonTypeClass）

### `UnitAllTypeClass`

`UnitTypeClass<unknown> | UnitListTypeClass<unknown>` の union 型。`UnitVisitor` の戻り値型に使う。

### `isUnitTypeAll`

`target` が `UnitTypeClass` または `UnitListTypeClass` のインスタンスかを判定するガード。

## TypeClass

### `CompilationUnitTypeClass`（compilationUnit.ts）

- **type**: `'compilationUnit'`
- **継承**: `UnitTypeClass<TypeDeclarationTypeClass>`
- **元 Context**: `CompilationUnitContext`（文法: `typeDeclaration EOF`）
- **役割**: `.cls` ファイル 1 つ分のルート。トップレベルの型宣言 1 つを保持する。

| 変数    | 型                                           | 内容                                                          |
| ------- | -------------------------------------------- | ------------------------------------------------------------- |
| `type`  | `'compilationUnit'`                          | 継承                                                          |
| `value` | `TypeDeclarationTypeClass \| ErrorTypeClass` | トップレベル型宣言（declarationVisitor の `typeDeclaration`） |

ゲッター: `getValue()`（継承）。ガード: `isCompilationUnitType`

例:

```apex
global inherited sharing virtual class ParserTest extends BaseParser implements ParserInterface, Comparable { ... }
```

```json
{
    "type": "compilationUnit",
    "value": {
        "type": "typeDeclaration",
        "value": {
            "type": "classDeclaration",
            "value": { "type": "id", "value": "ParserTest" },
            "body": "...",
            "extend": "...",
            "implement": "..."
        },
        "modifier": ["..."]
    }
}
```

### `AnonymousUnitTypeClass`（anonymousUnit.ts）

- **type**: `'anonymousUnit'`
- **継承**: `UnitTypeClass<AnonymousBlockTypeClass>`
- **元 Context**: `AnonymousUnitContext`（文法: `anonymousBlock EOF`）
- **役割**: 匿名 Apex（Execute Anonymous）のルート。匿名ブロック全体を保持する。

| 変数    | 型                                          | 内容                                                                                                  |
| ------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `type`  | `'anonymousUnit'`                           | 継承                                                                                                  |
| `value` | `AnonymousBlockTypeClass \| ErrorTypeClass` | 匿名ブロック（blockVisitor の `anonymousBlock`）。メンバーが 0 件なら `value: []` の `anonymousBlock` |

ゲッター: `getValue()`（継承）。ガード: `isAnonymousUnitType`

例:

```apex
public class AnonymousHelper { ... }
Id accountId;
```

```json
{
    "type": "anonymousUnit",
    "value": {
        "type": "anonymousBlock",
        "value": [
            {
                "type": "anonymousBlockMember",
                "value": {
                    "type": "anonymousMemberDeclaration",
                    "value": { "type": "classDeclaration", "...": "..." }
                },
                "modifier": ["..."]
            },
            "..."
        ]
    }
}
```

### `TriggerUnitTypeClass`（triggerUnit.ts）

- **type**: `'triggerUnit'`
- **継承**: `UnitListTypeClass<NormalIdTypeClass>`
- **元 Context**: `TriggerUnitContext`（文法: `TRIGGER id ON id LPAREN triggerCase (COMMA triggerCase)* RPAREN triggerBlock EOF`）
- **役割**: `.trigger` ファイルのルート。トリガー名・対象オブジェクト名・起動条件・本体を保持する。

| 変数          | 型                                           | 内容                                                                                             |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `type`        | `'triggerUnit'`                              | 継承                                                                                             |
| `value`       | `(NormalIdTypeClass \| ErrorTypeClass)[]`    | `id` のリスト。`[0]` がトリガー名、`[1]` が対象 SObject 名                                       |
| `triggerCase` | `(TriggerCaseTypeClass \| ErrorTypeClass)[]` | 起動条件（`before insert` 等）のリスト                                                           |
| `block`       | `TriggerBlockTypeClass \| ErrorTypeClass`    | トリガー本体（blockVisitor の `triggerBlock`）。本体が空 `{}` なら `value: []` の `triggerBlock` |

ゲッター: `getValue()`（継承）, `getTriggerCase()`, `getBlock()`。ガード: `isTriggerUnitType`（引数型は `any`）

例:

```apex
trigger ParserTrigger on Account (before insert, after undelete) { ... }
```

```json
{
    "type": "triggerUnit",
    "value": [
        { "type": "id", "value": "ParserTrigger" },
        { "type": "id", "value": "Account" }
    ],
    "triggerCase": [
        { "type": "triggerCase", "value": "BEFORE", "triggerCaseType": "INSERT" },
        { "type": "triggerCase", "value": "AFTER", "triggerCaseType": "UNDELETE" }
    ],
    "block": { "type": "triggerBlock", "value": ["..."] }
}
```

### `TriggerCaseTypeClass`（triggerCase.ts）

- **type**: `'triggerCase'`
- **継承**: `UnitTypeClass<string>`
- **元 Context**: `TriggerCaseContext`（文法: `(BEFORE | AFTER) (INSERT | UPDATE | DELETE | UNDELETE)`）
- **役割**: トリガーの起動タイミングと DML 種別の組を表す。

| 変数              | 型              | 内容                                                             |
| ----------------- | --------------- | ---------------------------------------------------------------- |
| `type`            | `'triggerCase'` | 継承                                                             |
| `value`           | `string`        | タイミング。`'BEFORE'` \| `'AFTER'`                              |
| `triggerCaseType` | `string`        | DML 種別。`'INSERT'` \| `'UPDATE'` \| `'DELETE'` \| `'UNDELETE'` |

ゲッター: `getValue()`（継承）, `getTriggerCaseType()`。ガード: `isTriggerCaseType`

例:

```apex
before update
```

```json
{ "type": "triggerCase", "value": "BEFORE", "triggerCaseType": "UPDATE" }
```
