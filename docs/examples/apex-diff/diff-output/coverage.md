# kind ごとの出現数

`run-diff.ts` が出力する。「差分」は status を持つ差分のノードとして現れた数（unchanged の子も含む）。

| 分類                   | kind                | JSON | 差分 |
| ---------------------- | ------------------- | ---- | ---- |
| 宣言                   | `class`             | 11   | 6    |
| 宣言                   | `interface`         | 3    | 2    |
| 宣言                   | `interfaceMethod`   | 6    | 3    |
| 宣言                   | `method`            | 26   | 13   |
| 宣言                   | `constructor`       | 6    | 3    |
| 宣言                   | `property`          | 4    | 2    |
| 宣言                   | `field`             | 13   | 7    |
| 宣言                   | `enum`              | 4    | 2    |
| 宣言                   | `enumConstant`      | 12   | 7    |
| 宣言                   | `notSet`            | 2    | 1    |
| ユニット               | `triggerCase`       | 4    | 3    |
| 修飾子・パラメータ・型 | `modifier`          | 78   | 34   |
| 修飾子・パラメータ・型 | `annotation`        | 4    | 2    |
| 修飾子・パラメータ・型 | `parameter`         | 28   | 9    |
| 修飾子・パラメータ・型 | `type`              | 111  | 32   |
| 式                     | `memberAccess`      | 50   | 8    |
| 文                     | `break`             | 3    | 1    |
| 文                     | `continue`          | 3    | 1    |
| 文                     | `delete`            | 2    | 1    |
| 文                     | `doWhile`           | 2    | 1    |
| 文                     | `expression`        | 47   | 10   |
| 文                     | `for`               | 7    | 3    |
| 文                     | `if`                | 10   | 4    |
| 文                     | `insert`            | 2    | 1    |
| 文                     | `localVariable`     | 29   | 15   |
| 文                     | `merge`             | 2    | 1    |
| 文                     | `return`            | 14   | 4    |
| 文                     | `runAs`             | 2    | 1    |
| 文                     | `switch`            | 2    | 1    |
| 文                     | `throw`             | 2    | 1    |
| 文                     | `try`               | 2    | 1    |
| 文                     | `undelete`          | 2    | 1    |
| 文                     | `update`            | 2    | 1    |
| 文                     | `upsert`            | 2    | 1    |
| 文                     | `while`             | 2    | 1    |
| 文の補助ノード         | `doWhileCondition`  | 2    | 1    |
| 文の補助ノード         | `forCondition`      | 7    | 4    |
| 文の補助ノード         | `ifCondition`       | 12   | 4    |
| 文の補助ノード         | `runAsCondition`    | 2    | 1    |
| 文の補助ノード         | `switchVariant`     | 2    | 1    |
| 文の補助ノード         | `switchCondition`   | 5    | 1    |
| 文の補助ノード         | `catchCondition`    | 2    | 1    |
| 文の補助ノード         | `whileCondition`    | 2    | 1    |
| SOQL                   | `soql`              | 12   | 6    |
| SOQL                   | `subQuery`          | 2    | 1    |
| SOQL                   | `selectEntry`       | 19   | 7    |
| SOQL                   | `fromField`         | 14   | 1    |
| SOQL                   | `singleCondition`   | 12   | 5    |
| SOQL                   | `groupBy`           | 2    | 1    |
| SOQL                   | `orderField`        | 4    | 1    |
| SOQL                   | `limitClause`       | 6    | 3    |
| SOQL                   | `offsetClause`      | 2    | 1    |
| SOQL                   | `forClause`         | 4    | 2    |
| SOQL                   | `updateClause`      | 2    | 1    |
| SOQL                   | `allRowsClause`     | 2    | 1    |
| SOQL                   | `usingScopeClause`  | 2    | 1    |
| SOQL                   | `categoryCondition` | 2    | 1    |
| SOSL                   | `sosl`              | 2    | 1    |
| SOSL                   | `soslField`         | 5    | 3    |
| エラー                 | `error`             | 1    | 1    |

すべての kind が差分に現れた。
