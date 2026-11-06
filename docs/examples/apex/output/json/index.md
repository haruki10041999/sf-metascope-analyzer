# Apex のサンプルの JSON

`npx ttsx --noCheck docs/examples/apex/scripts/generate-json.ts` で生成。ノード数は kind を持つ JSON ノードの数。

| グループ    | 単位                                                              | ノード数 | resolvedError |
| ----------- | ----------------------------------------------------------------- | -------: | ------------: |
| syntax      | [anonymous_broken](syntax/anonymous_broken.json)                  |       17 |            11 |
| syntax      | [anonymous_parser](syntax/anonymous_parser.json)                  |      358 |             0 |
| syntax      | [class_ParserEnum](syntax/class_ParserEnum.json)                  |        6 |             0 |
| syntax      | [class_ParserInterface](syntax/class_ParserInterface.json)        |       23 |             0 |
| syntax      | [class_ParserTest](syntax/class_ParserTest.json)                  |      854 |             0 |
| syntax      | [trigger_ParserTrigger](syntax/trigger_ParserTrigger.json)        |      253 |             0 |
| diff-before | [anonymous_script](diff-before/anonymous_script.json)             |       23 |             0 |
| diff-before | [class_AccountService](diff-before/class_AccountService.json)     |      253 |             0 |
| diff-before | [class_Broken](diff-before/class_Broken.json)                     |       11 |             0 |
| diff-before | [class_Level](diff-before/class_Level.json)                       |        4 |             0 |
| diff-before | [class_OldHelper](diff-before/class_OldHelper.json)               |        6 |             0 |
| diff-before | [class_Shape](diff-before/class_Shape.json)                       |        4 |             0 |
| diff-before | [class_Unchanged](diff-before/class_Unchanged.json)               |        6 |             0 |
| diff-before | [trigger_AccountTrigger](diff-before/trigger_AccountTrigger.json) |       13 |             0 |
| diff-after  | [anonymous_script](diff-after/anonymous_script.json)              |       28 |             0 |
| diff-after  | [class_AccountService](diff-after/class_AccountService.json)      |      266 |             0 |
| diff-after  | [class_Broken](diff-after/class_Broken.json)                      |        8 |             3 |
| diff-after  | [class_Level](diff-after/class_Level.json)                        |        5 |             0 |
| diff-after  | [class_NewHelper](diff-after/class_NewHelper.json)                |        6 |             0 |
| diff-after  | [class_Shape](diff-after/class_Shape.json)                        |        7 |             0 |
| diff-after  | [class_Unchanged](diff-after/class_Unchanged.json)                |        6 |             0 |
| diff-after  | [trigger_AccountTrigger](diff-after/trigger_AccountTrigger.json)  |       17 |             0 |
