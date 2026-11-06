# kind ごとの出現数

`run-diff.ts` が出力する。「差分」は status を持つ差分のノードとして現れた数（unchanged の子も含む）。

| 分類 | kind | JSON | 差分 |
| --- | --- | --- | --- |
| 宣言 | `class` | 25 | 4 |
| 宣言 | `interface` | 13 | 2 |
| 宣言 | `interfaceMethod` | 24 | 3 |
| 宣言 | `method` | 102 | 13 |
| 宣言 | `constructor` | 12 | 3 |
| 宣言 | `property` | 12 | 2 |
| 宣言 | `field` | 135 | 7 |
| 宣言 | `enum` | 14 | 2 |
| 宣言 | `enumConstant` | 36 | 7 |
| 宣言 | `notSet` | 4 | 1 |
| ユニット | `triggerCase` | 18 | 3 |
| 修飾子・パラメータ・型 | `modifier` | 278 | 31 |
| 修飾子・パラメータ・型 | `annotation` | 14 | 2 |
| 修飾子・パラメータ・型 | `parameter` | 104 | 9 |
| 修飾子・パラメータ・型 | `type` | 661 | 35 |
| 式 | `memberAccess` | 424 | 5 |
| 文 | `break` | 11 | 2 |
| 文 | `continue` | 9 | 2 |
| 文 | `delete` | 8 | 1 |
| 文 | `doWhile` | 6 | 1 |
| 文 | `expression` | 323 | 19 |
| 文 | `for` | 41 | 3 |
| 文 | `if` | 54 | 6 |
| 文 | `insert` | 12 | 1 |
| 文 | `localVariable` | 195 | 15 |
| 文 | `merge` | 8 | 1 |
| 文 | `return` | 70 | 5 |
| 文 | `runAs` | 8 | 1 |
| 文 | `switch` | 14 | 1 |
| 文 | `throw` | 6 | 1 |
| 文 | `try` | 10 | 1 |
| 文 | `undelete` | 6 | 1 |
| 文 | `update` | 8 | 1 |
| 文 | `upsert` | 10 | 1 |
| 文 | `while` | 6 | 1 |
| 文の補助ノード | `doWhileCondition` | 6 | 1 |
| 文の補助ノード | `forCondition` | 41 | 2 |
| 文の補助ノード | `ifCondition` | 60 | 6 |
| 文の補助ノード | `runAsCondition` | 8 | 1 |
| 文の補助ノード | `switchVariant` | 14 | 1 |
| 文の補助ノード | `switchCondition` | 39 | 1 |
| 文の補助ノード | `catchCondition` | 12 | 1 |
| 文の補助ノード | `whileCondition` | 6 | 1 |
| SOQL | `soql` | 92 | 6 |
| SOQL | `subQuery` | 8 | 1 |
| SOQL | `selectEntry` | 214 | 10 |
| SOQL | `fromField` | 100 | 7 |
| SOQL | `singleCondition` | 91 | 4 |
| SOQL | `groupBy` | 12 | 1 |
| SOQL | `orderField` | 18 | 2 |
| SOQL | `limitClause` | 30 | 3 |
| SOQL | `offsetClause` | 8 | 1 |
| SOQL | `forClause` | 12 | 2 |
| SOQL | `updateClause` | 6 | 1 |
| SOQL | `allRowsClause` | 6 | 1 |
| SOQL | `usingScopeClause` | 4 | 1 |
| SOQL | `categoryCondition` | 12 | 2 |
| SOSL | `sosl` | 16 | 1 |
| SOSL | `soslField` | 35 | 3 |
| メタデータ (-meta.xml) | `apexClassMeta` | 7 | 3 |
| メタデータ (-meta.xml) | `apexTriggerMeta` | 2 | 1 |
| エラー | `error` | 10 | 2 |

すべての kind が差分に現れた。
