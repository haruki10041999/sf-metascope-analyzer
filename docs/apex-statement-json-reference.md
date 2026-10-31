# Apex Statement JSON 型リファレンス

この文書は [src/analyzer/types/apex/statement.ts](../src/analyzer/types/apex/statement.ts) で定義される statement 関連 JSON 型をまとめたものです。[src/analyzer/processor/Apex/diff/statement.ts](../src/analyzer/processor/Apex/diff/statement.ts) 自体は `JsonType` / `StructureJson` を宣言せず、これらの型ガードを利用します。

## JsonType と StructureJson の共通形式

`JsonType<TKind>` は、ひとつのソース範囲に対応する JSON ノードです。

```ts
{
    kind: TKind;
    sourceKeys: {
        objectKey: string;
        sourceKey: string;
    }
}
```

`StructureJson<TKind, TRecord>` は、ノード自身の範囲と、特定の子要素のソース位置も保持します。

```ts
{
    kind: TKind;
    sourceKeys: {
        base: { objectKey: string; sourceKey: string };
        [childName: string]: ConvertKeys | ConvertKeys[];
    };
}
```

表中の `Expr` は `BaseExpressionJson`、`Stmt` は `StatementJson`、`Err` は `ErrorJson` の略です。各ノードには、表に記載したフィールドのほかに `kind` と `sourceKeys` があります。`?` は省略可能なプロパティです。

## StatementJson のトップレベル文 kind

`StatementJson` は再帰的な配列、または以下19種の文ノードのいずれかです。変換関数 `makeStatementJson` の結果は `StatementJson | ErrorJson` で、JSON の配列要素にも `ErrorJson` が含まれる場合があります。

| kind            | 型                           | 追加フィールド                                                                                                         | 説明                                                   |
| --------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `break`         | `BreakStatementJson`         | `value: string`                                                                                                        | `break` 文。通常は値 `"break"`。                       |
| `continue`      | `ContinueStatementJson`      | `value: string`                                                                                                        | `continue` 文。通常は値 `"continue"`。                 |
| `delete`        | `DeleteStatementJson`        | `field: Expr \| Err`; `accessLevel?: 'SYSTEM' \| 'USER'`                                                               | 削除対象と任意のアクセスレベル。                       |
| `doWhile`       | `DoWhileStatementJson`       | `condition: DoWhileConditionJson \| Err`; `body: (Stmt \| Err)[]`                                                      | do-while 文。                                          |
| `expression`    | `ExpressionStatementJson`    | `value: Expr \| Err`                                                                                                   | 式文。                                                 |
| `for`           | `ForStatementJson`           | `condition: ForConditionJson \| Err`; `block: Stmt \| Err`                                                             | for 文。`block` は単一文またはブロック配列になり得る。 |
| `if`            | `IfStatementJson`            | `conditionBlock: { condition: 'else' \| IfConditionJson \| Err; block: Stmt \| Err }[] \| Err`                         | if / else if / else の節を順に保持する。               |
| `insert`        | `InsertStatementJson`        | `field: Expr \| Err`; `accessLevel?: 'SYSTEM' \| 'USER'`                                                               | 挿入対象と任意のアクセスレベル。                       |
| `localVariable` | `LocalVariableStatementJson` | `variable: LocalVariableDeclarationJson`                                                                               | ローカル変数宣言文。                                   |
| `merge`         | `MergeStatementJson`         | `field: (Expr \| Err)[]`; `accessLevel?: 'SYSTEM' \| 'USER'`                                                           | merge 対象と任意のアクセスレベル。                     |
| `return`        | `ReturnStatementJson`        | `field?: Expr \| Err`                                                                                                  | return 文。値のない return では `field` を省略する。   |
| `runAs`         | `RunAsStatementJson`         | `condition: RunAsConditionJson \| Err`; `block: (Stmt \| Err)[]`                                                       | runAs 文とその本体。                                   |
| `switch`        | `SwitchStatementJson`        | `variant: WhenVariantJson \| Err`; `block: ({ condition: WhenConditionJson \| Err; block: (Stmt \| Err)[] } \| Err)[]` | switch 対象と when 節の配列。                          |
| `throw`         | `ThrowStatementJson`         | `value: Expr \| Err`                                                                                                   | throw する式。                                         |
| `try`           | `TryStatementJson`           | `block: TryBlock[]`                                                                                                    | try / catch / finally 節の配列。詳細は下記。           |
| `undelete`      | `UndeleteStatementJson`      | `field: Expr \| Err`; `accessLevel?: 'SYSTEM' \| 'USER'`                                                               | undelete 対象と任意のアクセスレベル。                  |
| `update`        | `UpdateStatementJson`        | `field: Expr \| Err`; `accessLevel?: 'SYSTEM' \| 'USER'`                                                               | update 対象と任意のアクセスレベル。                    |
| `upsert`        | `UpsertStatementJson`        | `field: Expr \| Err`; `accessLevel?: 'SYSTEM' \| 'USER'`; `key?: string[]`                                             | upsert 対象、アクセスレベル、任意の外部 ID キー。      |
| `while`         | `WhileStatementJson`         | `condition: WhileConditionJson \| Err`; `body: Stmt \| Err`                                                            | while 文。                                             |

`TryBlock` は次の union です。

```ts
type TryBlock =
    | { condition: 'try'; block: (StatementJson | ErrorJson)[] }
    | {
          condition: 'catch';
          catchCondition: CatchConditionJson | ErrorJson;
          block: (StatementJson | ErrorJson)[];
      }
    | { condition: 'finally'; block: (StatementJson | ErrorJson)[] }
    | ErrorJson;
```

## Statement 配下の補助ノード

以下は statement の内部で使うノードです。`StatementJson` union のトップレベル文には含まれません。

| kind               | 型                                     | 追加フィールド                                                                                        | 用途・詳細                                                                                                            |
| ------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `doWhileCondition` | `DoWhileConditionJson` (`JsonType`)    | `condition: Expr \| Err`                                                                              | do-while 条件式。                                                                                                     |
| `forCondition`     | `ForConditionJson` (`JsonType`)        | 次の2形式                                                                                             | 通常の for 制御部、または拡張 for 制御部。                                                                            |
| `ifCondition`      | `IfConditionJson` (`JsonType`)         | `condition: Expr \| Err`                                                                              | if / else if 条件式。                                                                                                 |
| `runAsCondition`   | `RunAsConditionJson` (`JsonType`)      | `field: (Expr \| Err)[]`                                                                              | runAs の対象式リスト。                                                                                                |
| `switchVariant`    | `WhenVariantJson` (`JsonType`)         | `variant: Expr \| Err`                                                                                | switch の対象式。                                                                                                     |
| `switchCondition`  | `WhenConditionJson` (`JsonType`)       | `condition` (下記)                                                                                    | switch の when 条件。                                                                                                 |
| `catchCondition`   | `CatchConditionJson` (`StructureJson`) | `exception: string`; `exceptionType: string[]`; `modifier: (ModifierJson \| AnnotationJson \| Err)[]` | catch 節の例外変数、例外型、修飾子。`sourceKeys` は `base` に加えて `exception` と `exceptionType` のキーを記録する。 |
| `whileCondition`   | `WhileConditionJson` (`JsonType`)      | `condition: Expr \| Err`                                                                              | while 条件式。                                                                                                        |

### `ForConditionJson` の2形式

拡張 for (`for (Account a : accounts)`) では、次のフィールドを持ちます。

```ts
{
    initializer: string;
    initializeType: TypeJson | ErrorJson;
    baseObject: BaseExpressionJson | ErrorJson;
}
```

通常の for (`for (Integer i = 0; i < 10; i++)`) では、省略可能な各節を保持します。

```ts
{
    initializer?: LocalVariableDeclarationJson | (BaseExpressionJson | ErrorJson)[];
    condition?: BaseExpressionJson | ErrorJson;
    update?: (BaseExpressionJson | ErrorJson)[];
}
```

### `WhenConditionJson` の条件値

`condition` は `'else'`、または次の値を持つオブジェクトの配列、または型付き値ひとつです。

| `valueType`                        | `value`                 | `operator`          |
| ---------------------------------- | ----------------------- | ------------------- |
| `'string' \| 'longText' \| 'null'` | `string`                | なし                |
| `'integer' \| 'long'`              | `string`                | `operator?: string` |
| `'id'`                             | `string[]`              | なし                |
| その他の型条件                     | `TypeJson \| ErrorJson` | なし                |

## ErrorJson

共通の `ErrorJson` 形状は次のとおりです。

```ts
{
    kind: 'error';
    sourceKeys: ConvertKeys;
    kindType: string;
}
```

`kindType` は任意の `string` で、専用の literal union ではありません。したがって「ErrorJson の種類」は `kind` の種類ではなく、エラーを作った変換境界を示す `kindType` の値で区別します。

### statement.ts が直接生成する kindType

| `kindType`            | 発生箇所                                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `statement`           | `makeStatementJson` に渡された IR がエラーの場合、または `makeBlockJson` のブロック自体がエラーの場合。if の条件ブロック変換失敗、switch 節要素のエラー、try / catch / finally の節要素エラーにも使う。 |
| statement ノード kind | `convertValue` が該当境界ノードをエラーと判定した場合。例: `break`, `doWhile`, `for`, `if`, `return`, `switch`, `try`, `while`。すべての文・補助ノードで、生成される JSON kind と対応する。             |

子の式、型、変数宣言、modifier などの変換関数が返す `ErrorJson` は、それぞれの変換モジュールが設定する `kindType` を持ちます。よって、statement JSON 全体に現れる `kindType` は `statement.ts` だけでは閉じず、子の converter にも依存します。

`makeErrorJson` は指定された `ConvertKeys` を `ErrorJson.sourceKeys` にコピーします。`StructureJson` の `base` キーを使ってエラーを作る場合、エラーのソース位置はその構造ノード全体を指します。

## Json kind と ErrorJson kindType の一覧

このファイルで生成される通常のノード kind は、トップレベル文19種と補助ノード8種の合計27種です。変換境界のエラーでは、対応するノード kind が `ErrorJson.kindType` になります。これとは別に、明示的な文構造エラーでは `kindType: 'statement'` が使われます。

| 分類                 | kind                                                                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| トップレベル文       | `break`, `continue`, `delete`, `doWhile`, `expression`, `for`, `if`, `insert`, `localVariable`, `merge`, `return`, `runAs`, `switch`, `throw`, `try`, `undelete`, `update`, `upsert`, `while` |
| 補助ノード           | `doWhileCondition`, `forCondition`, `ifCondition`, `runAsCondition`, `switchVariant`, `switchCondition`, `catchCondition`, `whileCondition`                                                   |
| 明示的な文構造エラー | `statement`                                                                                                                                                                                   |

`ErrorJson.kind` 自体は常に `'error'` です。上表の値は `kindType` に入る値を示します。

## StatementDiff の kind 抽出との関係

[src/analyzer/processor/Apex/diff/statement.ts](../src/analyzer/processor/Apex/diff/statement.ts) の現在の `statementKinds` は、トップレベル文19種に加えて `doWhileCondition`, `forCondition`, `ifCondition`, `runAsCondition` を抽出対象にしています。補助 kind のうち `switchVariant`, `switchCondition`, `catchCondition`, `whileCondition` は含めていません。どの kind を抽出対象にするかは差分抽出の仕様であり、JSON 型定義とは別の判断です。特に `catchCondition` は `StructureJson` なので、通常ノードと異なり `sourceKeys.base` がノード全体のキーです。
