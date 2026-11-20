# Apex JSON：文

[全体の目次と共通の形](./apex-json-types.md)。22 型別名。すべて `JsonType` で、表の型名は定義へのリンク。

## 制御構文・ブロック

| 型 | `kind` | 対応する Apex | 主な属性 |
| --- | --- | --- | --- |
| [BlockStatementJson](../src/analyzer/types/apex/statement.ts#L469) | `blockStatement` | 文中にネストされた `{ ... }` | `block` |
| [BreakStatementJson](../src/analyzer/types/apex/statement.ts#L69) | `break` | `break;` | 追加属性なし |
| [ContinueStatementJson](../src/analyzer/types/apex/statement.ts#L74) | `continue` | `continue;` | 追加属性なし |
| [IfStatementJson](../src/analyzer/types/apex/statement.ts#L182) | `if` | `if (x) { ... } else if (y) { ... } else { ... }` | `conditionBlock` |
| [ForStatementJson](../src/analyzer/types/apex/statement.ts#L126) | `for` | `for (Integer i = 0; i < 10; i++) { ... }` | `condition`, `block` |
| [ForEachStatementJson](../src/analyzer/types/apex/statement.ts#L132) | `forEach` | `for (Account a : accounts) { ... }` | `variant`, `variantType`, `right`, `block` |
| [WhileStatementJson](../src/analyzer/types/apex/statement.ts#L455) | `while` | `while (x) { ... }` | `condition`, `block` |
| [DoWhileStatementJson](../src/analyzer/types/apex/statement.ts#L94) | `doWhile` | `do { ... } while (x);` | `condition`, `block` |
| [SwitchStatementJson](../src/analyzer/types/apex/statement.ts#L330) | `switch` | `switch on x { when 1 { ... } when else { ... } }` | `value`, `when` |
| [WhenConditionJson](../src/analyzer/types/apex/statement.ts#L269) | `switchCondition` | `when 1, 2`、`when Account a`、`when else` の条件部分 | `condition`（リテラル配列・型と変数・`'else'`） |
| [TryStatementJson](../src/analyzer/types/apex/statement.ts#L374) | `try` | `try { ... } catch (Exception e) { ... } finally { ... }` | `block` |
| [ThrowStatementJson](../src/analyzer/types/apex/statement.ts#L350) | `throw` | `throw e;` | `value` |
| [ReturnStatementJson](../src/analyzer/types/apex/statement.ts#L240) | `return` | `return x;`, `return;` | `field?` |
| [RunAsStatementJson](../src/analyzer/types/apex/statement.ts#L252) | `runAs` | `System.runAs(user) { ... }` | `arg`, `block` |

`ForConditionJson` は通常の for の `initializer?`・`condition?`・`update?`、`IfConditionBlockJson` は各条件と本文、`SwitchWhenJson` は各 `when` の条件と本文、`TryClauseJson` は `try`・`catch`・`finally` の各節を持つ。いずれも kind なし。`if` の `else` は最後の節の `condition: 'else'`。各 `block` は文の配列であり、制御構文の波括弧が必ず `blockStatement` になるわけではない。

## 宣言・式・DML

| 型 | `kind` | 対応する Apex | 主な属性 |
| --- | --- | --- | --- |
| [LocalVariableStatementJson](../src/analyzer/types/apex/statement.ts#L213) | `localVariable` | `Integer a = 1, b = 2;` | `variants`, `variantType`, `modifier` |
| [ExpressionStatementJson](../src/analyzer/types/apex/statement.ts#L107) | `expression` | `f();`, `a = b;`, `i++;` | `value`（内側に式ノード） |
| [InsertStatementJson](../src/analyzer/types/apex/statement.ts#L199) | `insert` | `insert record;` | `field`, `accessLevel?` |
| [UpdateStatementJson](../src/analyzer/types/apex/statement.ts#L427) | `update` | `update record;` | `field`, `accessLevel?` |
| [DeleteStatementJson](../src/analyzer/types/apex/statement.ts#L80) | `delete` | `delete record;` | `field`, `accessLevel?` |
| [UndeleteStatementJson](../src/analyzer/types/apex/statement.ts#L412) | `undelete` | `undelete record;` | `field`, `accessLevel?` |
| [UpsertStatementJson](../src/analyzer/types/apex/statement.ts#L440) | `upsert` | `upsert record External_Id__c;` | `field`, `accessLevel?`, `key?`（名前の配列） |
| [MergeStatementJson](../src/analyzer/types/apex/statement.ts#L225) | `merge` | `merge master duplicate;` | `master`, `merged`, `accessLevel?` |

`accessLevel` がある場合は `'SYSTEM'` または `'USER'`。DML の `field` は文字列の項目名に限らず、対象を表す式ノード。`LocalVariableDeclarationJson` は同じ変数情報を保持する kind なしの入れ物で、通常の `for` の初期化にも使う。`StatementJson` は上記の文型をまとめる共用体。
