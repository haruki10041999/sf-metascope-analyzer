# statementVisitor

Apex の文（`statement` 規則とその各代替）を IR に変換する。制御構文・DML・`System.runAs`・ローカル変数宣言・式文、および DML のアクセスレベル（`as user` / `as system`）を扱う。
子要素の変換に失敗した場合、そのフィールドには `ErrorTypeClass`（`type: 'AnalyzerError'`、`contextType` / `context` / `errorMessage`）が入る。`create` が例外を投げた場合はノード自体が `ErrorTypeClass` になる。

## Visitor

| visit メソッド                           | Context                                    | 生成する TypeClass                           |
| ---------------------------------------- | ------------------------------------------ | -------------------------------------------- |
| `visitStatement`                         | `StatementContext`                         | `NormalStatementTypeClass`                   |
| `visitIfStatement`                       | `IfStatementContext`                       | `IfStatementTypeClass`                       |
| `visitSwitchStatement`                   | `SwitchStatementContext`                   | `SwitchStatementTypeClass`                   |
| `visitForStatement`                      | `ForStatementContext`                      | `ForStatementTypeClass`                      |
| `visitWhileStatement`                    | `WhileStatementContext`                    | `WhileStatementTypeClass`                    |
| `visitDoWhileStatement`                  | `DoWhileStatementContext`                  | `DoWhileStatementTypeClass`                  |
| `visitTryStatement`                      | `TryStatementContext`                      | `TryStatementTypeClass`                      |
| `visitReturnStatement`                   | `ReturnStatementContext`                   | `ReturnStatementTypeClass`                   |
| `visitThrowStatement`                    | `ThrowStatementContext`                    | `ThrowStatementTypeClass`                    |
| `visitBreakStatement`                    | `BreakStatementContext`                    | `BreakStatementTypeClass`                    |
| `visitContinueStatement`                 | `ContinueStatementContext`                 | `ContinueStatementTypeClass`                 |
| `visitInsertStatement`                   | `InsertStatementContext`                   | `InsertStatementTypeClass`                   |
| `visitUpdateStatement`                   | `UpdateStatementContext`                   | `UpdateStatementTypeClass`                   |
| `visitDeleteStatement`                   | `DeleteStatementContext`                   | `DeleteStatementTypeClass`                   |
| `visitUndeleteStatement`                 | `UndeleteStatementContext`                 | `UndeleteStatementTypeClass`                 |
| `visitUpsertStatement`                   | `UpsertStatementContext`                   | `UpsertStatementTypeClass`                   |
| `visitMergeStatement`                    | `MergeStatementContext`                    | `MergeStatementTypeClass`                    |
| `visitRunAsStatement`                    | `RunAsStatementContext`                    | `RunAsStatementTypeClass`                    |
| `visitLocalVariableDeclarationStatement` | `LocalVariableDeclarationStatementContext` | `LocalVariableDeclarationStatementTypeClass` |
| `visitExpressionStatement`               | `ExpressionStatementContext`               | `ExpressionStatementTypeClass`               |
| `visitAccessLevel`                       | `AccessLevelContext`                       | `AccessLevelTypeClass`                       |

## 基底クラス（base.ts）

### `StatementTypeClass<T>`

単一の `value` を持つ文ノードの基底。`AccessLevelTypeClass` もこれを継承する。

| 変数    | 型                    | 内容                                   |
| ------- | --------------------- | -------------------------------------- |
| `type`  | `string`              | ノード種別（CommonTypeClass から継承） |
| `value` | `T \| ErrorTypeClass` | 文の主要素（式・条件・制御部など）     |

ゲッター: `getValue()`, `getType()`

### `StatementListTypeClass<T>`

`value` が配列の文ノードの基底（`MergeStatementTypeClass` が使用）。

| 変数    | 型                        | 内容                                   |
| ------- | ------------------------- | -------------------------------------- |
| `type`  | `string`                  | ノード種別（CommonTypeClass から継承） |
| `value` | `(T \| ErrorTypeClass)[]` | 要素の配列                             |

ゲッター: `getValue()`, `getType()`

### `DmlStatementTypeClass<T>`

`StatementTypeClass<T>` を継承し、DML 文のアクセスレベルを追加した基底（insert / update / delete / undelete / upsert が使用）。

| 変数          | 型                                               | 内容                                       |
| ------------- | ------------------------------------------------ | ------------------------------------------ |
| `type`        | `string`                                         | ノード種別（CommonTypeClass から継承）     |
| `value`       | `T \| ErrorTypeClass`                            | DML 対象の式                               |
| `accessLevel` | `AccessLevelTypeClass \| ErrorTypeClass \| null` | `as user` / `as system`。指定なしは `null` |

ゲッター: `getValue()`, `getAccessLevel()`, `getType()`

### `StatementAllTypeClass`（型エイリアス）

`StatementTypeClass<unknown> | StatementListTypeClass<unknown>`。`StatementVisitor` の戻り値型。

### `isStatementTypeAll(target)`（ガード関数）

`StatementTypeClass` または `StatementListTypeClass` のインスタンスなら `true`（`DmlStatementTypeClass` 派生も含む）。

## TypeClass

### `NormalStatementTypeClass`（normal.ts）

- **type**: `'statement'`
- **継承**: `StatementTypeClass<NormalStatementTypeClassType>`
- **元 Context**: `StatementContext`（文法: `block | ifStatement | switchStatement | forStatement | whileStatement | doWhileStatement | tryStatement | returnStatement | throwStatement | breakStatement | continueStatement | insertStatement | updateStatement | deleteStatement | undeleteStatement | upsertStatement | mergeStatement | runAsStatement | localVariableDeclarationStatement | expressionStatement`）
- **役割**: 任意の文を包むラッパー。実際の文ノードを `value` に持つ。

| 変数    | 型                                               | 内容                                                                                                                                                                                                                                                                                                                    |
| ------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`  | `'statement'`                                    | 継承                                                                                                                                                                                                                                                                                                                    |
| `value` | `NormalStatementTypeClassType \| ErrorTypeClass` | 実際の文。`NormalStatementTypeClassType` は `NormalBlockTypeClass`（`'block'`）と本フォルダの各 `XxxStatementTypeClass`（If / Switch / For / While / DoWhile / Try / Return / Throw / Break / Continue / Insert / Update / Delete / Undelete / Upsert / Merge / RunAs / LocalVariableDeclaration / Expression）の union |

ゲッター: `getValue()`

例:

```apex
counter = 0;
```

```json
{
    "type": "statement",
    "value": {
        "type": "expressionStatement",
        "value": { "type": "assignExpression", "left": "...", "right": "...", "operator": "=" }
    }
}
```

### `IfStatementTypeClass`（ifStatement.ts）

- **type**: `'ifStatement'`
- **継承**: `StatementTypeClass<IfStatementTypeClassType[]>`
- **元 Context**: `IfStatementContext`（文法: `IF parExpression statement (ELSE statement)?`）
- **役割**: if / else if / else の連鎖を 1 つの配列に平坦化して保持する。`else` 側の文が `ifStatement` の場合は入れ子にせず同じ配列に続けて追加する。

| 変数    | 型                                             | 内容                                                                                                       |
| ------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `type`  | `'ifStatement'`                                | 継承                                                                                                       |
| `value` | `IfStatementTypeClassType[] \| ErrorTypeClass` | 分岐の配列（先頭が `if`、続いて `else if`、最後に `else`）。各要素は `type` を持たないプレーンオブジェクト |

`IfStatementTypeClassType`（各要素）:

| 変数    | 型                                                   | 内容                                          |
| ------- | ---------------------------------------------------- | --------------------------------------------- |
| `value` | `ParExpressionTypeClass \| 'else' \| ErrorTypeClass` | 条件式。最後の `else` 分岐では文字列 `'else'` |
| `block` | `NormalStatementTypeClass \| ErrorTypeClass`         | 分岐の本体（`'statement'`）                   |

ゲッター: `getValue()`

例:

```apex
if (value > 100) {
    System.debug('large');
} else if (value > 50) {
    System.debug('medium');
} else {
    System.debug('small');
}
```

```json
{
    "type": "ifStatement",
    "value": [
        {
            "value": { "type": "parExpression", "value": "..." },
            "block": { "type": "statement", "value": "..." }
        },
        {
            "value": { "type": "parExpression", "value": "..." },
            "block": { "type": "statement", "value": "..." }
        },
        { "value": "else", "block": { "type": "statement", "value": "..." } }
    ]
}
```

### `SwitchStatementTypeClass`（switchStatement.ts）

- **type**: `'switchStatement'`
- **継承**: `StatementTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `SwitchStatementContext`（文法: `SWITCH ON expression LBRACE whenControl+ RBRACE`）
- **役割**: `switch on` の対象式と `when` 節の一覧を保持する。

| 変数    | 型                                           | 内容                                                   |
| ------- | -------------------------------------------- | ------------------------------------------------------ |
| `type`  | `'switchStatement'`                          | 継承                                                   |
| `value` | `ExpressionAllTypeClass \| ErrorTypeClass`   | `switch on` の対象式                                   |
| `block` | `(WhenControlTypeClass \| ErrorTypeClass)[]` | `when` 節（`'whenControl'`）の配列。`when else` も含む |

ゲッター: `getValue()`, `getBlocks()`

例:

```apex
switch on text {
    when 'A' { return 'Alpha'; }
    when 'B', 'C' { return 'Beta or Gamma'; }
    when null { return 'null'; }
    when else { return 'Unknown'; }
}
```

```json
{
    "type": "switchStatement",
    "value": { "type": "primaryExpression", "value": { "type": "idPrimary", "value": "..." } },
    "block": [{ "type": "whenControl", "value": "...", "block": "..." }, "..."]
}
```

### `ForStatementTypeClass`（forStatement.ts）

- **type**: `'forStatement'`
- **継承**: `StatementTypeClass<ForControlTypeClass>`
- **元 Context**: `ForStatementContext`（文法: `FOR LPAREN forControl RPAREN (statement | SEMI)`）
- **役割**: for 文（通常 for / 拡張 for）の制御部と本体を保持する。

| 変数    | 型                                           | 内容                                                                                                  |
| ------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `type`  | `'forStatement'`                             | 継承                                                                                                  |
| `value` | `ForControlTypeClass \| ErrorTypeClass`      | 制御部（`'forControl'`。init / 条件 / update、または拡張 for の変数とコレクション）                   |
| `block` | `NormalStatementTypeClass \| ErrorTypeClass` | 本体の文（`'statement'`）。本体が `;` のみの場合は `create` が例外となりノード全体が `ErrorTypeClass` |

ゲッター: `getValue()`, `getBlock()`

例:

```apex
for (Integer i = 0, j = 10; i < j; i++, j--) { ... }
```

```json
{
    "type": "forStatement",
    "value": {
        "type": "forControl",
        "value": { "type": "cmpExpression", "left": "...", "right": "...", "operator": "<" },
        "init": { "type": "forInit", "value": "..." },
        "update": { "type": "forUpdate", "value": "..." }
    },
    "block": { "type": "statement", "value": { "type": "block", "value": "..." } }
}
```

### `WhileStatementTypeClass`（whileStatement.ts）

- **type**: `'whileStatement'`
- **継承**: `StatementTypeClass<ParExpressionTypeClass>`
- **元 Context**: `WhileStatementContext`（文法: `WHILE parExpression (statement | SEMI)`）
- **役割**: while 文の条件と本体を保持する。

| 変数    | 型                                           | 内容                                                                                                  |
| ------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `type`  | `'whileStatement'`                           | 継承                                                                                                  |
| `value` | `ParExpressionTypeClass \| ErrorTypeClass`   | 括弧付き条件式（`'parExpression'`）                                                                   |
| `block` | `NormalStatementTypeClass \| ErrorTypeClass` | 本体の文（`'statement'`）。本体が `;` のみの場合は `create` が例外となりノード全体が `ErrorTypeClass` |

ゲッター: `getValue()`, `getBlock()`

例:

```apex
while (value > 0) {
    value--;
}
```

```json
{
    "type": "whileStatement",
    "value": {
        "type": "parExpression",
        "value": { "type": "cmpExpression", "left": "...", "right": "...", "operator": ">" }
    },
    "block": { "type": "statement", "value": { "type": "block", "value": "..." } }
}
```

### `DoWhileStatementTypeClass`（doWhileStatement.ts）

- **type**: `'doWhileStatement'`
- **継承**: `StatementTypeClass<ParExpressionTypeClass>`
- **元 Context**: `DoWhileStatementContext`（文法: `DO block WHILE parExpression SEMI`）
- **役割**: do-while 文の条件と本体ブロックを保持する。

| 変数    | 型                                         | 内容                                                        |
| ------- | ------------------------------------------ | ----------------------------------------------------------- |
| `type`  | `'doWhileStatement'`                       | 継承                                                        |
| `value` | `ParExpressionTypeClass \| ErrorTypeClass` | 括弧付き条件式（`'parExpression'`）                         |
| `block` | `NormalBlockTypeClass \| ErrorTypeClass`   | 本体ブロック（`'block'`。`statement` ではなく直接ブロック） |

ゲッター: `getValue()`, `getBlock()`

例:

```apex
do {
    value++;
} while (value < 10);
```

```json
{
    "type": "doWhileStatement",
    "value": {
        "type": "parExpression",
        "value": { "type": "cmpExpression", "left": "...", "right": "...", "operator": "<" }
    },
    "block": { "type": "block", "value": ["..."] }
}
```

### `TryStatementTypeClass`（tryStatement.ts）

- **type**: `'tryStatement'`
- **継承**: `StatementTypeClass<NormalBlockTypeClass>`
- **元 Context**: `TryStatementContext`（文法: `TRY block (catchClause+ finallyBlock? | finallyBlock)`）
- **役割**: try ブロック・catch 節・finally ブロックを保持する。

| 変数           | 型                                                | 内容                                                     |
| -------------- | ------------------------------------------------- | -------------------------------------------------------- |
| `type`         | `'tryStatement'`                                  | 継承                                                     |
| `value`        | `NormalBlockTypeClass \| ErrorTypeClass`          | try ブロック（`'block'`）                                |
| `catchBlock`   | `(CatchClauseTypeClass \| ErrorTypeClass)[]`      | catch 節（`'catchClause'`）の配列。catch が無ければ `[]` |
| `finallyBlock` | `FinallyBlockTypeClass \| ErrorTypeClass \| null` | finally ブロック（`'finallyBlock'`）。無ければ `null`    |

ゲッター: `getValue()`, `getCatchBlock()`, `getFinallyBlock()`

例:

```apex
try {
    ...
} catch (QueryException e) {
    ...
} catch (final Exception e) {
    ...
} finally {
    System.debug('finally');
}
```

```json
{
    "type": "tryStatement",
    "value": { "type": "block", "value": ["...", "..."] },
    "catchBlock": [
        {
            "type": "catchClause",
            "value": "...",
            "valueType": "...",
            "block": "...",
            "modifier": "..."
        },
        {
            "type": "catchClause",
            "value": "...",
            "valueType": "...",
            "block": "...",
            "modifier": "..."
        }
    ],
    "finallyBlock": { "type": "finallyBlock", "value": { "type": "block", "value": "..." } }
}
```

### `ReturnStatementTypeClass`（returnStatement.ts）

- **type**: `'returnStatement'`
- **継承**: `StatementTypeClass<ExpressionAllTypeClass | null>`
- **元 Context**: `ReturnStatementContext`（文法: `RETURN expression? SEMI`）
- **役割**: return 文の戻り値式を保持する。

| 変数    | 型                                                 | 内容                                     |
| ------- | -------------------------------------------------- | ---------------------------------------- |
| `type`  | `'returnStatement'`                                | 継承                                     |
| `value` | `ExpressionAllTypeClass \| ErrorTypeClass \| null` | 戻り値の式。`return;`（式なし）は `null` |

ゲッター: `getValue()`

例:

```apex
if (value == 0) return;
```

```json
{ "type": "returnStatement", "value": null }
```

### `ThrowStatementTypeClass`（throwStatement.ts）

- **type**: `'throwStatement'`
- **継承**: `StatementTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `ThrowStatementContext`（文法: `THROW expression SEMI`）
- **役割**: throw する式を保持する。

| 変数    | 型                                         | 内容             |
| ------- | ------------------------------------------ | ---------------- |
| `type`  | `'throwStatement'`                         | 継承             |
| `value` | `ExpressionAllTypeClass \| ErrorTypeClass` | 送出する例外の式 |

ゲッター: `getValue()`

例:

```apex
throw new CustomException('Something went wrong');
```

```json
{
    "type": "throwStatement",
    "value": {
        "type": "newExpression",
        "value": { "type": "creator", "value": "...", "content": "..." }
    }
}
```

### `BreakStatementTypeClass`（breakStatement.ts）

- **type**: `'breakStatement'`
- **継承**: `StatementTypeClass<string>`
- **元 Context**: `BreakStatementContext`（文法: `BREAK SEMI`）
- **役割**: break 文。キーワードのテキストのみ保持する。

| 変数    | 型                 | 内容                                    |
| ------- | ------------------ | --------------------------------------- |
| `type`  | `'breakStatement'` | 継承                                    |
| `value` | `string`           | `BREAK` トークンのテキスト（`'break'`） |

ゲッター: `getValue()`

例:

```apex
break;
```

```json
{ "type": "breakStatement", "value": "break" }
```

### `ContinueStatementTypeClass`（continueStatement.ts）

- **type**: `'continueStatement'`
- **継承**: `StatementTypeClass<string>`
- **元 Context**: `ContinueStatementContext`（文法: `CONTINUE SEMI`）
- **役割**: continue 文。キーワードのテキストのみ保持する。

| 変数    | 型                    | 内容                                          |
| ------- | --------------------- | --------------------------------------------- |
| `type`  | `'continueStatement'` | 継承                                          |
| `value` | `string`              | `CONTINUE` トークンのテキスト（`'continue'`） |

ゲッター: `getValue()`

例:

```apex
continue;
```

```json
{ "type": "continueStatement", "value": "continue" }
```

### `InsertStatementTypeClass`（insertStatement.ts）

- **type**: `'insertStatement'`
- **継承**: `DmlStatementTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `InsertStatementContext`（文法: `INSERT accessLevel? expression SEMI`）
- **役割**: insert DML 文。

| 変数          | 型                                               | 内容                                            |
| ------------- | ------------------------------------------------ | ----------------------------------------------- |
| `type`        | `'insertStatement'`                              | 継承                                            |
| `value`       | `ExpressionAllTypeClass \| ErrorTypeClass`       | DML 対象の式                                    |
| `accessLevel` | `AccessLevelTypeClass \| ErrorTypeClass \| null` | 継承。`as user` / `as system` 指定なしは `null` |

ゲッター: `getValue()`, `getAccessLevel()`

例:

```apex
insert account;
```

```json
{
    "type": "insertStatement",
    "value": { "type": "primaryExpression", "value": { "type": "idPrimary", "value": "..." } },
    "accessLevel": null
}
```

### `UpdateStatementTypeClass`（updateStatement.ts）

- **type**: `'updateStatement'`
- **継承**: `DmlStatementTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `UpdateStatementContext`（文法: `UPDATE accessLevel? expression SEMI`）
- **役割**: update DML 文。

| 変数          | 型                                               | 内容                    |
| ------------- | ------------------------------------------------ | ----------------------- |
| `type`        | `'updateStatement'`                              | 継承                    |
| `value`       | `ExpressionAllTypeClass \| ErrorTypeClass`       | DML 対象の式            |
| `accessLevel` | `AccessLevelTypeClass \| ErrorTypeClass \| null` | 継承。指定なしは `null` |

ゲッター: `getValue()`, `getAccessLevel()`

例:

```apex
update as system accounts;
```

```json
{
    "type": "updateStatement",
    "value": { "type": "primaryExpression", "value": { "type": "idPrimary", "value": "..." } },
    "accessLevel": { "type": "accessLevel", "value": "SYSTEM" }
}
```

### `DeleteStatementTypeClass`（deleteStatement.ts）

- **type**: `'deleteStatement'`
- **継承**: `DmlStatementTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `DeleteStatementContext`（文法: `DELETE accessLevel? expression SEMI`）
- **役割**: delete DML 文。

| 変数          | 型                                               | 内容                    |
| ------------- | ------------------------------------------------ | ----------------------- |
| `type`        | `'deleteStatement'`                              | 継承                    |
| `value`       | `ExpressionAllTypeClass \| ErrorTypeClass`       | DML 対象の式            |
| `accessLevel` | `AccessLevelTypeClass \| ErrorTypeClass \| null` | 継承。指定なしは `null` |

ゲッター: `getValue()`, `getAccessLevel()`

例:

```apex
delete account;
```

```json
{
    "type": "deleteStatement",
    "value": { "type": "primaryExpression", "value": { "type": "idPrimary", "value": "..." } },
    "accessLevel": null
}
```

### `UndeleteStatementTypeClass`（undeleteStatement.ts）

- **type**: `'undeleteStatement'`
- **継承**: `DmlStatementTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `UndeleteStatementContext`（文法: `UNDELETE accessLevel? expression SEMI`）
- **役割**: undelete DML 文。

| 変数          | 型                                               | 内容                    |
| ------------- | ------------------------------------------------ | ----------------------- |
| `type`        | `'undeleteStatement'`                            | 継承                    |
| `value`       | `ExpressionAllTypeClass \| ErrorTypeClass`       | DML 対象の式            |
| `accessLevel` | `AccessLevelTypeClass \| ErrorTypeClass \| null` | 継承。指定なしは `null` |

ゲッター: `getValue()`, `getAccessLevel()`

例:

```apex
undelete account;
```

```json
{
    "type": "undeleteStatement",
    "value": { "type": "primaryExpression", "value": { "type": "idPrimary", "value": "..." } },
    "accessLevel": null
}
```

### `UpsertStatementTypeClass`（upsertStatement.ts）

- **type**: `'upsertStatement'`
- **継承**: `DmlStatementTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `UpsertStatementContext`（文法: `UPSERT accessLevel? expression qualifiedName? SEMI`）
- **役割**: upsert DML 文。外部 ID 項目の指定を `key` に保持する。

| 変数          | 型                                                 | 内容                                                 |
| ------------- | -------------------------------------------------- | ---------------------------------------------------- |
| `type`        | `'upsertStatement'`                                | 継承                                                 |
| `value`       | `ExpressionAllTypeClass \| ErrorTypeClass`         | DML 対象の式                                         |
| `accessLevel` | `AccessLevelTypeClass \| ErrorTypeClass \| null`   | 継承。指定なしは `null`                              |
| `key`         | `QualifiedNameTypeClass \| ErrorTypeClass \| null` | 外部 ID 項目（`'qualifiedName'`）。指定なしは `null` |

ゲッター: `getValue()`, `getAccessLevel()`, `getKey()`

例:

```apex
upsert accounts Account.ExternalId__c;
```

```json
{
    "type": "upsertStatement",
    "value": {
        "type": "primaryExpression",
        "value": { "type": "idPrimary", "value": { "type": "id", "value": "accounts" } }
    },
    "accessLevel": null,
    "key": {
        "type": "qualifiedName",
        "value": [
            { "type": "id", "value": "Account" },
            { "type": "id", "value": "ExternalId__c" }
        ]
    }
}
```

### `MergeStatementTypeClass`（mergeStatement.ts）

- **type**: `'mergeStatement'`
- **継承**: `StatementListTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `MergeStatementContext`（文法: `MERGE accessLevel? expression expression SEMI`）
- **役割**: merge DML 文。マージ先とマージ元の 2 式を配列で保持する（`DmlStatementTypeClass` ではなく、`accessLevel` を自前で持つ）。

| 変数          | 型                                               | 内容                                                                               |
| ------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `type`        | `'mergeStatement'`                               | 継承                                                                               |
| `value`       | `(ExpressionAllTypeClass \| ErrorTypeClass)[]`   | 長さ 2 の配列（[0] マージ先、[1] マージ元）。式が 2 つでない場合は `create` が例外 |
| `accessLevel` | `AccessLevelTypeClass \| ErrorTypeClass \| null` | `as user` / `as system`。指定なしは `null`                                         |

ゲッター: `getValue()`, `getAccessLevel()`

例:

```apex
merge as system account duplicate;
```

```json
{
    "type": "mergeStatement",
    "value": [
        {
            "type": "primaryExpression",
            "value": { "type": "idPrimary", "value": { "type": "id", "value": "account" } }
        },
        {
            "type": "primaryExpression",
            "value": { "type": "idPrimary", "value": { "type": "id", "value": "duplicate" } }
        }
    ],
    "accessLevel": { "type": "accessLevel", "value": "SYSTEM" }
}
```

### `RunAsStatementTypeClass`（runAsStatement.ts）

- **type**: `'runAsStatement'`
- **継承**: `StatementTypeClass<ExpressionListTypeClass>`
- **元 Context**: `RunAsStatementContext`（文法: `SYSTEMRUNAS LPAREN expressionList? RPAREN block`）
- **役割**: `System.runAs(...) { ... }` の引数と本体ブロックを保持する。

| 変数    | 型                                          | 内容                                                                   |
| ------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| `type`  | `'runAsStatement'`                          | 継承                                                                   |
| `value` | `ExpressionListTypeClass \| ErrorTypeClass` | 引数の式リスト（`'expressionList'`）。引数なしの場合は `create` が例外 |
| `block` | `NormalBlockTypeClass \| ErrorTypeClass`    | 本体ブロック（`'block'`）                                              |

ゲッター: `getValue()`, `getBlock()`

例:

```apex
System.runAs(user) {
    System.debug(UserInfo.getUserId());
}
```

```json
{
    "type": "runAsStatement",
    "value": { "type": "expressionList", "value": ["..."] },
    "block": { "type": "block", "value": ["..."] }
}
```

### `LocalVariableDeclarationStatementTypeClass`（localVariableDeclarationStatement.ts）

- **type**: `'localVariableDeclarationStatement'`
- **継承**: `StatementTypeClass<LocalVariableDeclarationTypeClass>`
- **元 Context**: `LocalVariableDeclarationStatementContext`（文法: `localVariableDeclaration SEMI`）
- **役割**: ローカル変数宣言文。宣言本体を `value` に持つ。

| 変数    | 型                                                    | 内容                                     |
| ------- | ----------------------------------------------------- | ---------------------------------------- |
| `type`  | `'localVariableDeclarationStatement'`                 | 継承                                     |
| `value` | `LocalVariableDeclarationTypeClass \| ErrorTypeClass` | 変数宣言（`'localVariableDeclaration'`） |

ゲッター: `getValue()`

例:

```apex
Integer k;
```

```json
{
    "type": "localVariableDeclarationStatement",
    "value": {
        "type": "localVariableDeclaration",
        "value": { "type": "variableDeclarators", "value": "..." },
        "valueType": { "type": "typeRef", "value": "...", "dimension": "..." },
        "modifier": []
    }
}
```

### `ExpressionStatementTypeClass`（expressionStatement.ts）

- **type**: `'expressionStatement'`
- **継承**: `StatementTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `ExpressionStatementContext`（文法: `expression SEMI`）
- **役割**: 式文（代入・メソッド呼び出し・インクリメント等）。

| 変数    | 型                                         | 内容           |
| ------- | ------------------------------------------ | -------------- |
| `type`  | `'expressionStatement'`                    | 継承           |
| `value` | `ExpressionAllTypeClass \| ErrorTypeClass` | 文を構成する式 |

ゲッター: `getValue()`

例:

```apex
counter = 0;
```

```json
{
    "type": "expressionStatement",
    "value": {
        "type": "assignExpression",
        "left": { "type": "primaryExpression", "value": "..." },
        "right": { "type": "primaryExpression", "value": "..." },
        "operator": "="
    }
}
```

### `AccessLevelTypeClass`（accessLevel.ts）

- **type**: `'accessLevel'`
- **継承**: `StatementTypeClass<AccessLevelValueType>`
- **元 Context**: `AccessLevelContext`（文法: `AS (SYSTEM | USER)`）
- **役割**: DML 文のアクセスレベル（`as user` / `as system`）。DML 系 TypeClass の `accessLevel` に入る。

| 変数    | 型                                             | 内容                                                                                    |
| ------- | ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| `type`  | `'accessLevel'`                                | 継承                                                                                    |
| `value` | `AccessLevelValueType`（`'SYSTEM' \| 'USER'`） | 大文字に正規化したアクセスレベル。基底の型上は `\| ErrorTypeClass` だが実際は常に文字列 |

ゲッター: `getValue()`

例:

```apex
insert as user account;
```

```json
{ "type": "accessLevel", "value": "USER" }
```
