# LWC のライブラリの parse 結果の属性 (自動生成)

`run-library-parse.ts` が bundles/ のサンプルから集めたもの。ノードの種類ごとに、出てきたキー・値の型・例 (最初に出た値) を並べる。
`件数` はそのキーを持っていたノードの数 (ノードの数より少なければ、ないこともあるキー)。説明は [docs/lwc-library-attributes.md](../../../../lwc-library-attributes.md)。

## postcss

### (inputs) (3)

| キー     | 値の型  | 件数 | 例                                                             |
| -------- | ------- | ---- | -------------------------------------------------------------- |
| `hasBOM` | boolean | 3    | `false`                                                        |
| `css`    | string  | 3    | `":host {\n    display: block;\n    --account-list-gap: 0.5re` |
| `file`   | string  | 3    | `"accountList.css"`                                            |

### (raws) (19)

| キー        | 値の型  | 件数 | 例      |
| ----------- | ------- | ---- | ------- |
| `semicolon` | boolean | 10   | `false` |
| `after`     | string  | 10   | `"\n"`  |
| `before`    | string  | 16   | `""`    |
| `between`   | string  | 16   | `" "`   |
| `afterName` | string  | 1    | `" "`   |

### (source.end) (19)

| キー     | 値の型 | 件数 | 例   |
| -------- | ------ | ---- | ---- |
| `column` | number | 19   | `19` |
| `line`   | number | 19   | `2`  |
| `offset` | number | 19   | `27` |

### (source.start) (19)

| キー     | 値の型 | 件数 | 例   |
| -------- | ------ | ---- | ---- |
| `column` | number | 19   | `5`  |
| `line`   | number | 19   | `2`  |
| `offset` | number | 19   | `12` |

### (source) (19)

| キー      | 値の型 | 件数 | 例  |
| --------- | ------ | ---- | --- |
| `end`     | object | 19   |     |
| `inputId` | number | 19   | `0` |
| `start`   | object | 19   |     |

### atrule (1)

| キー     | 値の型 | 件数 | 例                     |
| -------- | ------ | ---- | ---------------------- |
| `raws`   | object | 1    |                        |
| `type`   | string | 1    | `"atrule"`             |
| `name`   | string | 1    | `"media"`              |
| `source` | object | 1    |                        |
| `params` | string | 1    | `"(max-width: 480px)"` |
| `nodes`  | array  | 1    |                        |

### decl (9)

| キー        | 値の型  | 件数 | 例          |
| ----------- | ------- | ---- | ----------- |
| `raws`      | object  | 9    |             |
| `type`      | string  | 9    | `"decl"`    |
| `source`    | object  | 9    |             |
| `prop`      | string  | 9    | `"display"` |
| `value`     | string  | 9    | `"block"`   |
| `important` | boolean | 1    | `true`      |

### root (3)

| キー     | 値の型 | 件数 | 例       |
| -------- | ------ | ---- | -------- |
| `raws`   | object | 3    |          |
| `type`   | string | 3    | `"root"` |
| `nodes`  | array  | 3    |          |
| `source` | object | 3    |          |
| `inputs` | array  | 3    |          |

### rule (6)

| キー       | 値の型 | 件数 | 例        |
| ---------- | ------ | ---- | --------- |
| `raws`     | object | 6    |           |
| `type`     | string | 6    | `"rule"`  |
| `nodes`    | array  | 6    |           |
| `source`   | object | 6    |           |
| `selector` | string | 6    | `":host"` |

## parse5

### (attrs) (39)

| キー    | 値の型 | 件数 | 例          |
| ------- | ------ | ---- | ----------- |
| `name`  | string | 39   | `"title"`   |
| `value` | string | 39   | `"{title}"` |

### (sourceCodeLocation.attrs.*) (39)

| キー          | 値の型 | 件数 | 例    |
| ------------- | ------ | ---- | ----- |
| `startLine`   | number | 39   | `3`   |
| `startCol`    | number | 39   | `27`  |
| `startOffset` | number | 39   | `101` |
| `endLine`     | number | 39   | `3`   |
| `endCol`      | number | 39   | `41`  |
| `endOffset`   | number | 39   | `115` |

### (sourceCodeLocation.attrs) (25)

| キー | 値の型 | 件数 | 例  |
| ---- | ------ | ---- | --- |
| `*`  | object | 39   |     |

### (sourceCodeLocation.endTag) (31)

| キー          | 値の型 | 件数 | 例    |
| ------------- | ------ | ---- | ----- |
| `startLine`   | number | 31   | `3`   |
| `startCol`    | number | 31   | `71`  |
| `startOffset` | number | 31   | `145` |
| `endLine`     | number | 31   | `3`   |
| `endCol`      | number | 31   | `90`  |
| `endOffset`   | number | 31   | `164` |

### (sourceCodeLocation.startTag.attrs.*) (39)

| キー          | 値の型 | 件数 | 例    |
| ------------- | ------ | ---- | ----- |
| `startLine`   | number | 39   | `3`   |
| `startCol`    | number | 39   | `27`  |
| `startOffset` | number | 39   | `101` |
| `endLine`     | number | 39   | `3`   |
| `endCol`      | number | 39   | `41`  |
| `endOffset`   | number | 39   | `115` |

### (sourceCodeLocation.startTag.attrs) (25)

| キー | 値の型 | 件数 | 例  |
| ---- | ------ | ---- | --- |
| `*`  | object | 39   |     |

### (sourceCodeLocation.startTag) (31)

| キー          | 値の型 | 件数 | 例    |
| ------------- | ------ | ---- | ----- |
| `startLine`   | number | 31   | `3`   |
| `startCol`    | number | 31   | `9`   |
| `startOffset` | number | 31   | `83`  |
| `endLine`     | number | 31   | `3`   |
| `endCol`      | number | 31   | `71`  |
| `endOffset`   | number | 31   | `145` |
| `attrs`       | object | 25   |       |

### (sourceCodeLocation) (85)

| キー          | 値の型 | 件数 | 例   |
| ------------- | ------ | ---- | ---- |
| `startLine`   | number | 85   | `1`  |
| `startCol`    | number | 85   | `11` |
| `startOffset` | number | 85   | `10` |
| `endLine`     | number | 85   | `2`  |
| `endCol`      | number | 85   | `5`  |
| `endOffset`   | number | 85   | `15` |
| `attrs`       | object | 25   |      |
| `startTag`    | object | 31   |      |
| `endTag`      | object | 31   |      |

### #document-fragment (13)

| キー                 | 値の型 | 件数 | 例                     |
| -------------------- | ------ | ---- | ---------------------- |
| `nodeName`           | string | 13   | `"#document-fragment"` |
| `childNodes`         | array  | 13   |                        |
| `sourceCodeLocation` | null   | 10   |                        |

### #text (54)

| キー                 | 値の型 | 件数 | 例         |
| -------------------- | ------ | ---- | ---------- |
| `nodeName`           | string | 54   | `"#text"`  |
| `value`              | string | 54   | `"\n    "` |
| `sourceCodeLocation` | object | 54   |            |

### <要素> (21)

| キー                 | 値の型 | 件数 | 例                               |
| -------------------- | ------ | ---- | -------------------------------- |
| `nodeName`           | string | 21   | `"lightning-card"`               |
| `tagName`            | string | 21   | `"lightning-card"`               |
| `attrs`              | array  | 21   |                                  |
| `namespaceURI`       | string | 21   | `"http://www.w3.org/1999/xhtml"` |
| `childNodes`         | array  | 21   |                                  |
| `sourceCodeLocation` | object | 21   |                                  |

### template (10)

| キー                 | 値の型                   | 件数 | 例                               |
| -------------------- | ------------------------ | ---- | -------------------------------- |
| `nodeName`           | string                   | 10   | `"template"`                     |
| `tagName`            | string                   | 10   | `"template"`                     |
| `attrs`              | array                    | 10   |                                  |
| `namespaceURI`       | string                   | 10   | `"http://www.w3.org/1999/xhtml"` |
| `childNodes`         | array                    | 10   |                                  |
| `content`            | node(#document-fragment) | 10   |                                  |
| `sourceCodeLocation` | object                   | 10   |                                  |

## @lwc/template-compiler

### (directiveLocation) (9)

| キー          | 値の型 | 件数 | 例    |
| ------------- | ------ | ---- | ----- |
| `startLine`   | number | 9    | `5`   |
| `startColumn` | number | 9    | `19`  |
| `endLine`     | number | 9    | `5`   |
| `endColumn`   | number | 9    | `35`  |
| `start`       | number | 9    | `226` |
| `end`         | number | 9    | `242` |

### (location.endTag) (22)

| キー          | 値の型 | 件数 | 例     |
| ------------- | ------ | ---- | ------ |
| `startLine`   | number | 22   | `43`   |
| `startColumn` | number | 22   | `1`    |
| `endLine`     | number | 22   | `43`   |
| `endColumn`   | number | 22   | `12`   |
| `start`       | number | 22   | `1846` |
| `end`         | number | 22   | `1857` |

### (location.startTag) (22)

| キー          | 値の型 | 件数 | 例   |
| ------------- | ------ | ---- | ---- |
| `startLine`   | number | 22   | `1`  |
| `startColumn` | number | 22   | `1`  |
| `endLine`     | number | 22   | `1`  |
| `endColumn`   | number | 22   | `11` |
| `start`       | number | 22   | `0`  |
| `end`         | number | 22   | `10` |

### (location) (93)

| キー          | 値の型 | 件数 | 例     |
| ------------- | ------ | ---- | ------ |
| `startLine`   | number | 93   | `1`    |
| `startColumn` | number | 93   | `1`    |
| `endLine`     | number | 93   | `43`   |
| `endColumn`   | number | 93   | `12`   |
| `start`       | number | 93   | `0`    |
| `end`         | number | 93   | `1857` |
| `startTag`    | object | 22   |        |
| `endTag`      | object | 22   |        |

### (root.warnings.location) (2)

| キー     | 値の型 | 件数 | 例   |
| -------- | ------ | ---- | ---- |
| `line`   | number | 2    | `2`  |
| `column` | number | 2    | `5`  |
| `start`  | number | 2    | `15` |
| `length` | number | 2    | `67` |

### (root.warnings) (2)

| キー       | 値の型 | 件数 | 例                                                             |
| ---------- | ------ | ---- | -------------------------------------------------------------- |
| `code`     | number | 2    | `1166`                                                         |
| `message`  | string | 2    | `"LWC1166: 'if:true' directive cannot be used with 'lwc:if', ` |
| `level`    | number | 2    | `1`                                                            |
| `location` | object | 2    |                                                                |
| `url`      | string | 2    | `""`                                                           |

### (root) (3)

| キー       | 値の型     | 件数 | 例  |
| ---------- | ---------- | ---- | --- |
| `root`     | node(Root) | 3    |     |
| `warnings` | array      | 3    |     |

### Attribute (11)

| キー       | 値の型                                 | 件数 | 例            |
| ---------- | -------------------------------------- | ---- | ------------- |
| `type`     | string                                 | 11   | `"Attribute"` |
| `name`     | string                                 | 11   | `"slot"`      |
| `value`    | node(Literal) / node(MemberExpression) | 11   |               |
| `location` | object                                 | 11   |               |

### Component (4)

| キー         | 値の型 | 件数 | 例                               |
| ------------ | ------ | ---- | -------------------------------- |
| `type`       | string | 4    | `"Component"`                    |
| `name`       | string | 4    | `"lightning-card"`               |
| `namespace`  | string | 4    | `"http://www.w3.org/1999/xhtml"` |
| `location`   | object | 4    |                                  |
| `attributes` | array  | 4    |                                  |
| `properties` | array  | 4    |                                  |
| `directives` | array  | 4    |                                  |
| `listeners`  | array  | 4    |                                  |
| `children`   | array  | 4    |                                  |

### Directive (4)

| キー       | 値の型                                 | 件数 | 例            |
| ---------- | -------------------------------------- | ---- | ------------- |
| `type`     | string                                 | 4    | `"Directive"` |
| `name`     | string                                 | 4    | `"Ref"`       |
| `value`    | node(Literal) / node(MemberExpression) | 4    |               |
| `location` | object                                 | 4    |               |

### Element (14)

| キー         | 値の型 | 件数 | 例                               |
| ------------ | ------ | ---- | -------------------------------- |
| `type`       | string | 14   | `"Element"`                      |
| `name`       | string | 14   | `"p"`                            |
| `namespace`  | string | 14   | `"http://www.w3.org/1999/xhtml"` |
| `location`   | object | 14   |                                  |
| `attributes` | array  | 14   |                                  |
| `properties` | array  | 14   |                                  |
| `directives` | array  | 14   |                                  |
| `listeners`  | array  | 14   |                                  |
| `children`   | array  | 14   |                                  |

### ElseBlock (2)

| キー                | 値の型 | 件数 | 例            |
| ------------------- | ------ | ---- | ------------- |
| `type`              | string | 2    | `"ElseBlock"` |
| `location`          | object | 2    |               |
| `directiveLocation` | object | 2    |               |
| `children`          | array  | 2    |               |

### ElseifBlock (1)

| キー                | 値の型           | 件数 | 例              |
| ------------------- | ---------------- | ---- | --------------- |
| `type`              | string           | 1    | `"ElseifBlock"` |
| `condition`         | node(Identifier) | 1    |                 |
| `location`          | object           | 1    |                 |
| `directiveLocation` | object           | 1    |                 |
| `children`          | array            | 1    |                 |
| `else`              | node(ElseBlock)  | 1    |                 |

### EventListener (4)

| キー       | 値の型           | 件数 | 例                |
| ---------- | ---------------- | ---- | ----------------- |
| `type`     | string           | 4    | `"EventListener"` |
| `name`     | string           | 4    | `"click"`         |
| `handler`  | node(Identifier) | 4    |                   |
| `location` | object           | 4    |                   |

### ForEach (1)

| キー                | 値の型           | 件数 | 例          |
| ------------------- | ---------------- | ---- | ----------- |
| `type`              | string           | 1    | `"ForEach"` |
| `expression`        | node(Identifier) | 1    |             |
| `item`              | node(Identifier) | 1    |             |
| `index`             | node(Identifier) | 1    |             |
| `location`          | object           | 1    |             |
| `directiveLocation` | object           | 1    |             |
| `children`          | array            | 1    |             |

### ForOf (1)

| キー                | 値の型           | 件数 | 例        |
| ------------------- | ---------------- | ---- | --------- |
| `type`              | string           | 1    | `"ForOf"` |
| `expression`        | node(Identifier) | 1    |           |
| `iterator`          | node(Identifier) | 1    |           |
| `location`          | object           | 1    |           |
| `directiveLocation` | object           | 1    |           |
| `children`          | array            | 1    |           |

### Identifier (37)

| キー       | 値の型 | 件数 | 例             |
| ---------- | ------ | ---- | -------------- |
| `type`     | string | 37   | `"Identifier"` |
| `start`    | number | 34   | `1`            |
| `end`      | number | 34   | `6`            |
| `name`     | string | 37   | `"title"`      |
| `location` | object | 19   |                |

### IfBlock (4)

| キー                | 値の型                                    | 件数 | 例          |
| ------------------- | ----------------------------------------- | ---- | ----------- |
| `type`              | string                                    | 4    | `"IfBlock"` |
| `condition`         | node(Identifier) / node(MemberExpression) | 4    |             |
| `location`          | object                                    | 4    |             |
| `directiveLocation` | object                                    | 4    |             |
| `children`          | array                                     | 4    |             |
| `else`              | node(ElseBlock) / node(ElseifBlock)       | 2    |             |

### Literal (18)

| キー    | 値の型 | 件数 | 例                   |
| ------- | ------ | ---- | -------------------- |
| `type`  | string | 18   | `"Literal"`          |
| `value` | string | 18   | `"standard:account"` |

### MemberExpression (10)

| キー       | 値の型                                    | 件数 | 例                   |
| ---------- | ----------------------------------------- | ---- | -------------------- |
| `type`     | string                                    | 10   | `"MemberExpression"` |
| `start`    | number                                    | 10   | `1`                  |
| `end`      | number                                    | 10   | `7`                  |
| `object`   | node(Identifier) / node(MemberExpression) | 10   |                      |
| `property` | node(Identifier)                          | 10   |                      |
| `computed` | boolean                                   | 10   | `false`              |
| `optional` | boolean                                   | 10   | `false`              |
| `location` | object                                    | 8    |                      |

### Property (7)

| キー            | 値の型                                                    | 件数 | 例           |
| --------------- | --------------------------------------------------------- | ---- | ------------ |
| `type`          | string                                                    | 7    | `"Property"` |
| `name`          | string                                                    | 7    | `"title"`    |
| `attributeName` | string                                                    | 7    | `"title"`    |
| `value`         | node(Identifier) / node(Literal) / node(MemberExpression) | 7    |              |
| `location`      | object                                                    | 7    |              |

### Root (3)

| キー         | 値の型 | 件数 | 例       |
| ------------ | ------ | ---- | -------- |
| `type`       | string | 3    | `"Root"` |
| `location`   | object | 3    |          |
| `directives` | array  | 3    |          |
| `children`   | array  | 3    |          |

### Slot (1)

| キー         | 値の型 | 件数 | 例                               |
| ------------ | ------ | ---- | -------------------------------- |
| `type`       | string | 1    | `"Slot"`                         |
| `name`       | string | 1    | `"slot"`                         |
| `namespace`  | string | 1    | `"http://www.w3.org/1999/xhtml"` |
| `slotName`   | string | 1    | `"footer"`                       |
| `location`   | object | 1    |                                  |
| `attributes` | array  | 1    |                                  |
| `properties` | array  | 1    |                                  |
| `directives` | array  | 1    |                                  |
| `listeners`  | array  | 1    |                                  |
| `children`   | array  | 1    |                                  |

### Text (9)

| キー       | 値の型                                                    | 件数 | 例               |
| ---------- | --------------------------------------------------------- | ---- | ---------------- |
| `type`     | string                                                    | 9    | `"Text"`         |
| `raw`      | string                                                    | 9    | `"{parentName}"` |
| `value`    | node(Identifier) / node(Literal) / node(MemberExpression) | 9    |                  |
| `location` | object                                                    | 9    |                  |

## parseXml

### (attributes) (28)

| キー      | 値の型 | 件数 | 例                                          |
| --------- | ------ | ---- | ------------------------------------------- |
| `xmlns`   | string | 4    | `"http://soap.sforce.com/2006/04/metadata"` |
| `targets` | string | 2    | `"lightning__RecordPage"`                   |
| `name`    | string | 3    | `"title"`                                   |
| `type`    | string | 5    | `"String"`                                  |
| `label`   | string | 3    | `"タイトル"`                                |
| `default` | string | 2    | `"取引先一覧"`                              |
| `min`     | string | 1    | `"1"`                                       |
| `max`     | string | 1    | `"50"`                                      |

### (end) (28)

| キー     | 値の型 | 件数 | 例    |
| -------- | ------ | ---- | ----- |
| `offset` | number | 28   | `147` |
| `line`   | number | 28   | `3`   |
| `column` | number | 28   | `33`  |

### (start) (28)

| キー     | 値の型 | 件数 | 例    |
| -------- | ------ | ---- | ----- |
| `offset` | number | 28   | `118` |
| `line`   | number | 28   | `3`   |
| `column` | number | 28   | `4`   |

### apiVersion (4)

| キー         | 値の型 | 件数 | 例             |
| ------------ | ------ | ---- | -------------- |
| `name`       | string | 4    | `"apiVersion"` |
| `attributes` | object | 4    |                |
| `children`   | array  | 4    |                |
| `text`       | string | 4    | `"61.0"`       |
| `start`      | object | 4    |                |
| `end`        | object | 4    |                |

### description (1)

| キー         | 値の型 | 件数 | 例                                 |
| ------------ | ------ | ---- | ---------------------------------- |
| `name`       | string | 1    | `"description"`                    |
| `attributes` | object | 1    |                                    |
| `children`   | array  | 1    |                                    |
| `text`       | string | 1    | `"親レコードに紐づく取引先の一覧"` |
| `start`      | object | 1    |                                    |
| `end`        | object | 1    |                                    |

### isExposed (4)

| キー         | 値の型 | 件数 | 例            |
| ------------ | ------ | ---- | ------------- |
| `name`       | string | 4    | `"isExposed"` |
| `attributes` | object | 4    |               |
| `children`   | array  | 4    |               |
| `text`       | string | 4    | `"true"`      |
| `start`      | object | 4    |               |
| `end`        | object | 4    |               |

### LightningComponentBundle (4)

| キー         | 値の型 | 件数 | 例                           |
| ------------ | ------ | ---- | ---------------------------- |
| `name`       | string | 4    | `"LightningComponentBundle"` |
| `attributes` | object | 4    |                              |
| `children`   | array  | 4    |                              |
| `text`       | string | 4    | `""`                         |
| `start`      | object | 4    |                              |
| `end`        | object | 4    |                              |

### masterLabel (1)

| キー         | 値の型 | 件数 | 例              |
| ------------ | ------ | ---- | --------------- |
| `name`       | string | 1    | `"masterLabel"` |
| `attributes` | object | 1    |                 |
| `children`   | array  | 1    |                 |
| `text`       | string | 1    | `"取引先一覧"`  |
| `start`      | object | 1    |                 |
| `end`        | object | 1    |                 |

### object (1)

| キー         | 値の型 | 件数 | 例          |
| ------------ | ------ | ---- | ----------- |
| `name`       | string | 1    | `"object"`  |
| `attributes` | object | 1    |             |
| `children`   | array  | 1    |             |
| `text`       | string | 1    | `"Account"` |
| `start`      | object | 1    |             |
| `end`        | object | 1    |             |

### objects (1)

| キー         | 値の型 | 件数 | 例          |
| ------------ | ------ | ---- | ----------- |
| `name`       | string | 1    | `"objects"` |
| `attributes` | object | 1    |             |
| `children`   | array  | 1    |             |
| `text`       | string | 1    | `""`        |
| `start`      | object | 1    |             |
| `end`        | object | 1    |             |

### property (3)

| キー         | 値の型 | 件数 | 例           |
| ------------ | ------ | ---- | ------------ |
| `name`       | string | 3    | `"property"` |
| `attributes` | object | 3    |              |
| `children`   | array  | 3    |              |
| `text`       | string | 3    | `""`         |
| `start`      | object | 3    |              |
| `end`        | object | 3    |              |

### supportedFormFactor (2)

| キー         | 値の型 | 件数 | 例                      |
| ------------ | ------ | ---- | ----------------------- |
| `name`       | string | 2    | `"supportedFormFactor"` |
| `attributes` | object | 2    |                         |
| `children`   | array  | 2    |                         |
| `text`       | string | 2    | `""`                    |
| `start`      | object | 2    |                         |
| `end`        | object | 2    |                         |

### supportedFormFactors (1)

| キー         | 値の型 | 件数 | 例                       |
| ------------ | ------ | ---- | ------------------------ |
| `name`       | string | 1    | `"supportedFormFactors"` |
| `attributes` | object | 1    |                          |
| `children`   | array  | 1    |                          |
| `text`       | string | 1    | `""`                     |
| `start`      | object | 1    |                          |
| `end`        | object | 1    |                          |

### target (2)

| キー         | 値の型 | 件数 | 例                        |
| ------------ | ------ | ---- | ------------------------- |
| `name`       | string | 2    | `"target"`                |
| `attributes` | object | 2    |                           |
| `children`   | array  | 2    |                           |
| `text`       | string | 2    | `"lightning__RecordPage"` |
| `start`      | object | 2    |                           |
| `end`        | object | 2    |                           |

### targetConfig (2)

| キー         | 値の型 | 件数 | 例               |
| ------------ | ------ | ---- | ---------------- |
| `name`       | string | 2    | `"targetConfig"` |
| `attributes` | object | 2    |                  |
| `children`   | array  | 2    |                  |
| `text`       | string | 2    | `""`             |
| `start`      | object | 2    |                  |
| `end`        | object | 2    |                  |

### targetConfigs (1)

| キー         | 値の型 | 件数 | 例                |
| ------------ | ------ | ---- | ----------------- |
| `name`       | string | 1    | `"targetConfigs"` |
| `attributes` | object | 1    |                   |
| `children`   | array  | 1    |                   |
| `text`       | string | 1    | `""`              |
| `start`      | object | 1    |                   |
| `end`        | object | 1    |                   |

### targets (1)

| キー         | 値の型 | 件数 | 例          |
| ------------ | ------ | ---- | ----------- |
| `name`       | string | 1    | `"targets"` |
| `attributes` | object | 1    |             |
| `children`   | array  | 1    |             |
| `text`       | string | 1    | `""`        |
| `start`      | object | 1    |             |
| `end`        | object | 1    |             |

## @babel/parser

### (extra) (47)

| キー            | 値の型          | 件数 | 例        |
| --------------- | --------------- | ---- | --------- |
| `rawValue`      | string / number | 40   | `"lwc"`   |
| `raw`           | string          | 40   | `"'lwc'"` |
| `trailingComma` | number          | 3    | `2261`    |
| `topLevelAwait` | boolean         | 4    | `false`   |

### (loc.end) (616)

| キー     | 値の型 | 件数 | 例     |
| -------- | ------ | ---- | ------ |
| `line`   | number | 616  | `87`   |
| `column` | number | 616  | `0`    |
| `index`  | number | 616  | `2858` |

### (loc.start) (616)

| キー     | 値の型 | 件数 | 例  |
| -------- | ------ | ---- | --- |
| `line`   | number | 616  | `1` |
| `column` | number | 616  | `0` |
| `index`  | number | 616  | `0` |

### (loc) (616)

| キー             | 値の型 | 件数 | 例                   |
| ---------------- | ------ | ---- | -------------------- |
| `start`          | object | 616  |                      |
| `end`            | object | 616  |                      |
| `identifierName` | string | 206  | `"LightningElement"` |

### ArrayExpression (2)

| キー       | 値の型 | 件数 | 例                  |
| ---------- | ------ | ---- | ------------------- |
| `type`     | string | 2    | `"ArrayExpression"` |
| `start`    | number | 2    | `999`               |
| `end`      | number | 2    | `1001`              |
| `loc`      | object | 2    |                     |
| `elements` | array  | 2    |                     |

### ArrowFunctionExpression (3)

| キー         | 値の型                                                               | 件数 | 例                          |
| ------------ | -------------------------------------------------------------------- | ---- | --------------------------- |
| `type`       | string                                                               | 3    | `"ArrowFunctionExpression"` |
| `start`      | number                                                               | 3    | `1889`                      |
| `end`        | number                                                               | 3    | `1926`                      |
| `loc`        | object                                                               | 3    |                             |
| `id`         | null                                                                 | 3    |                             |
| `generator`  | boolean                                                              | 3    | `false`                     |
| `async`      | boolean                                                              | 3    | `false`                     |
| `params`     | array                                                                | 3    |                             |
| `body`       | node(BinaryExpression) / node(CallExpression) / node(TSAsExpression) | 3    |                             |
| `returnType` | node(TSTypeAnnotation)                                               | 1    |                             |

### AssignmentExpression (3)

| キー       | 値の型                                  | 件数 | 例                       |
| ---------- | --------------------------------------- | ---- | ------------------------ |
| `type`     | string                                  | 3    | `"AssignmentExpression"` |
| `start`    | number                                  | 3    | `1425`                   |
| `end`      | number                                  | 3    | `1449`                   |
| `loc`      | object                                  | 3    |                          |
| `operator` | string                                  | 3    | `"="`                    |
| `left`     | node(MemberExpression)                  | 3    |                          |
| `right`    | node(CallExpression) / node(Identifier) | 3    |                          |

### AwaitExpression (1)

| キー       | 値の型               | 件数 | 例                  |
| ---------- | -------------------- | ---- | ------------------- |
| `type`     | string               | 1    | `"AwaitExpression"` |
| `start`    | number               | 1    | `2582`              |
| `end`      | number               | 1    | `2615`              |
| `loc`      | object               | 1    |                     |
| `argument` | node(CallExpression) | 1    |                     |

### BinaryExpression (3)

| キー       | 値の型                                                                     | 件数 | 例                   |
| ---------- | -------------------------------------------------------------------------- | ---- | -------------------- |
| `type`     | string                                                                     | 3    | `"BinaryExpression"` |
| `start`    | number                                                                     | 3    | `1705`               |
| `end`      | number                                                                     | 3    | `1725`               |
| `loc`      | object                                                                     | 3    |                      |
| `left`     | node(MemberExpression) / node(Identifier)                                  | 3    |                      |
| `operator` | string                                                                     | 3    | `">"`                |
| `right`    | node(NumericLiteral) / node(StringLiteral) / node(ParenthesizedExpression) | 3    |                      |

### BlockStatement (15)

| キー         | 値の型 | 件数 | 例                 |
| ------------ | ------ | ---- | ------------------ |
| `type`       | string | 15   | `"BlockStatement"` |
| `start`      | number | 15   | `1391`             |
| `end`        | number | 15   | `1526`             |
| `loc`        | object | 15   |                    |
| `body`       | array  | 15   |                    |
| `directives` | array  | 15   |                    |

### BooleanLiteral (2)

| キー    | 値の型  | 件数 | 例                 |
| ------- | ------- | ---- | ------------------ |
| `type`  | string  | 2    | `"BooleanLiteral"` |
| `start` | number  | 2    | `2208`             |
| `end`   | number  | 2    | `2212`             |
| `loc`   | object  | 2    |                    |
| `value` | boolean | 2    | `true`             |

### CallExpression (15)

| キー        | 値の型                                    | 件数 | 例                 |
| ----------- | ----------------------------------------- | ---- | ------------------ |
| `type`      | string                                    | 15   | `"CallExpression"` |
| `start`     | number                                    | 15   | `832`              |
| `end`       | number                                    | 15   | `865`              |
| `loc`       | object                                    | 15   |                    |
| `callee`    | node(Identifier) / node(MemberExpression) | 15   |                    |
| `arguments` | array                                     | 15   |                    |
| `extra`     | object                                    | 1    |                    |

### CatchClause (1)

| キー    | 値の型               | 件数 | 例              |
| ------- | -------------------- | ---- | --------------- |
| `type`  | string               | 1    | `"CatchClause"` |
| `start` | number               | 1    | `2720`          |
| `end`   | number               | 1    | `2777`          |
| `loc`   | object               | 1    |                 |
| `param` | node(Identifier)     | 1    |                 |
| `body`  | node(BlockStatement) | 1    |                 |

### ClassBody (3)

| キー    | 値の型 | 件数 | 例            |
| ------- | ------ | ---- | ------------- |
| `type`  | string | 3    | `"ClassBody"` |
| `start` | number | 3    | `866`         |
| `end`   | number | 3    | `2857`        |
| `loc`   | object | 3    |               |
| `body`  | array  | 3    |               |

### ClassDeclaration (3)

| キー         | 値の型                                  | 件数 | 例                   |
| ------------ | --------------------------------------- | ---- | -------------------- |
| `type`       | string                                  | 3    | `"ClassDeclaration"` |
| `start`      | number                                  | 3    | `806`                |
| `end`        | number                                  | 3    | `2857`               |
| `loc`        | object                                  | 3    |                      |
| `id`         | node(Identifier)                        | 3    |                      |
| `superClass` | node(CallExpression) / node(Identifier) | 3    |                      |
| `body`       | node(ClassBody)                         | 3    |                      |

### ClassMethod (10)

| キー         | 値の型                 | 件数 | 例              |
| ------------ | ---------------------- | ---- | --------------- |
| `type`       | string                 | 10   | `"ClassMethod"` |
| `start`      | number                 | 10   | `1242`          |
| `end`        | number                 | 10   | `1526`          |
| `loc`        | object                 | 10   |                 |
| `decorators` | array                  | 2    |                 |
| `static`     | boolean                | 10   | `false`         |
| `key`        | node(Identifier)       | 10   |                 |
| `computed`   | boolean                | 10   | `false`         |
| `kind`       | string                 | 10   | `"method"`      |
| `id`         | null                   | 10   |                 |
| `generator`  | boolean                | 10   | `false`         |
| `async`      | boolean                | 10   | `false`         |
| `params`     | array                  | 10   |                 |
| `returnType` | node(TSTypeAnnotation) | 10   |                 |
| `body`       | node(BlockStatement)   | 10   |                 |

### ClassProperty (12)

| キー             | 値の型                                                                                       | 件数 | 例                |
| ---------------- | -------------------------------------------------------------------------------------------- | ---- | ----------------- |
| `type`           | string                                                                                       | 12   | `"ClassProperty"` |
| `start`          | number                                                                                       | 12   | `872`             |
| `end`            | number                                                                                       | 12   | `895`             |
| `loc`            | object                                                                                       | 12   |                   |
| `decorators`     | array                                                                                        | 9    |                   |
| `static`         | boolean                                                                                      | 12   | `false`           |
| `key`            | node(Identifier)                                                                             | 12   |                   |
| `computed`       | boolean                                                                                      | 12   | `false`           |
| `definite`       | boolean                                                                                      | 2    | `true`            |
| `typeAnnotation` | node(TSTypeAnnotation)                                                                       | 12   |                   |
| `value`          | null / node(Identifier) / node(NumericLiteral) / node(ArrayExpression) / node(StringLiteral) | 12   |                   |
| `optional`       | boolean                                                                                      | 4    | `true`            |
| `accessibility`  | string                                                                                       | 1    | `"private"`       |

### Decorator (12)

| キー         | 値の型                                  | 件数 | 例            |
| ------------ | --------------------------------------- | ---- | ------------- |
| `type`       | string                                  | 12   | `"Decorator"` |
| `start`      | number                                  | 12   | `872`         |
| `end`        | number                                  | 12   | `876`         |
| `loc`        | object                                  | 12   |               |
| `expression` | node(Identifier) / node(CallExpression) | 12   |               |

### ExportDefaultDeclaration (3)

| キー          | 値の型                 | 件数 | 例                           |
| ------------- | ---------------------- | ---- | ---------------------------- |
| `type`        | string                 | 3    | `"ExportDefaultDeclaration"` |
| `start`       | number                 | 3    | `791`                        |
| `end`         | number                 | 3    | `2857`                       |
| `loc`         | object                 | 3    |                              |
| `exportKind`  | string                 | 3    | `"value"`                    |
| `declaration` | node(ClassDeclaration) | 3    |                              |

### ExportNamedDeclaration (4)

| キー          | 値の型                                                                                                              | 件数 | 例                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------- | ---- | -------------------------- |
| `type`        | string                                                                                                              | 4    | `"ExportNamedDeclaration"` |
| `start`       | number                                                                                                              | 4    | `0`                        |
| `end`         | number                                                                                                              | 4    | `43`                       |
| `loc`         | object                                                                                                              | 4    |                            |
| `exportKind`  | string                                                                                                              | 4    | `"type"`                   |
| `specifiers`  | array                                                                                                               | 4    |                            |
| `source`      | null                                                                                                                | 4    |                            |
| `attributes`  | array                                                                                                               | 4    |                            |
| `declaration` | node(TSTypeAliasDeclaration) / node(TSInterfaceDeclaration) / node(VariableDeclaration) / node(FunctionDeclaration) | 4    |                            |

### ExpressionStatement (9)

| キー         | 値の型                                                                                                   | 件数 | 例                      |
| ------------ | -------------------------------------------------------------------------------------------------------- | ---- | ----------------------- |
| `type`       | string                                                                                                   | 9    | `"ExpressionStatement"` |
| `start`      | number                                                                                                   | 9    | `1425`                  |
| `end`        | number                                                                                                   | 9    | `1450`                  |
| `loc`        | object                                                                                                   | 9    |                         |
| `expression` | node(AssignmentExpression) / node(CallExpression) / node(AwaitExpression) / node(OptionalCallExpression) | 9    |                         |

### File (4)

| キー       | 値の型        | 件数 | 例       |
| ---------- | ------------- | ---- | -------- |
| `type`     | string        | 4    | `"File"` |
| `start`    | number        | 4    | `0`      |
| `end`      | number        | 4    | `2858`   |
| `loc`      | object        | 4    |          |
| `errors`   | array         | 4    |          |
| `program`  | node(Program) | 4    |          |
| `comments` | array         | 4    |          |

### FunctionDeclaration (1)

| キー         | 値の型                 | 件数 | 例                      |
| ------------ | ---------------------- | ---- | ----------------------- |
| `type`       | string                 | 1    | `"FunctionDeclaration"` |
| `start`      | number                 | 1    | `305`                   |
| `end`        | number                 | 1    | `402`                   |
| `loc`        | object                 | 1    |                         |
| `id`         | node(Identifier)       | 1    |                         |
| `generator`  | boolean                | 1    | `false`                 |
| `async`      | boolean                | 1    | `false`                 |
| `params`     | array                  | 1    |                         |
| `returnType` | node(TSTypeAnnotation) | 1    |                         |
| `body`       | node(BlockStatement)   | 1    |                         |

### Identifier (206)

| キー             | 値の型                 | 件数 | 例                   |
| ---------------- | ---------------------- | ---- | -------------------- |
| `type`           | string                 | 206  | `"Identifier"`       |
| `start`          | number                 | 206  | `9`                  |
| `end`            | number                 | 206  | `25`                 |
| `loc`            | object                 | 206  |                      |
| `name`           | string                 | 206  | `"LightningElement"` |
| `typeAnnotation` | node(TSTypeAnnotation) | 4    |                      |

### IfStatement (2)

| キー         | 値の型                   | 件数 | 例              |
| ------------ | ------------------------ | ---- | --------------- |
| `type`       | string                   | 2    | `"IfStatement"` |
| `start`      | number                   | 2    | `1401`          |
| `end`        | number                   | 2    | `1520`          |
| `loc`        | object                   | 2    |                 |
| `test`       | node(Identifier)         | 2    |                 |
| `consequent` | node(BlockStatement)     | 2    |                 |
| `alternate`  | node(IfStatement) / null | 2    |                 |

### ImportDeclaration (14)

| キー         | 値の型              | 件数 | 例                    |
| ------------ | ------------------- | ---- | --------------------- |
| `type`       | string              | 14   | `"ImportDeclaration"` |
| `start`      | number              | 14   | `0`                   |
| `end`        | number              | 14   | `57`                  |
| `loc`        | object              | 14   |                       |
| `importKind` | string              | 14   | `"value"`             |
| `specifiers` | array               | 14   |                       |
| `source`     | node(StringLiteral) | 14   |                       |
| `attributes` | array               | 14   |                       |

### ImportDefaultSpecifier (5)

| キー    | 値の型           | 件数 | 例                         |
| ------- | ---------------- | ---- | -------------------------- |
| `type`  | string           | 5    | `"ImportDefaultSpecifier"` |
| `start` | number           | 5    | `254`                      |
| `end`   | number           | 5    | `265`                      |
| `loc`   | object           | 5    |                            |
| `local` | node(Identifier) | 5    |                            |

### ImportSpecifier (18)

| キー         | 値の型           | 件数 | 例                  |
| ------------ | ---------------- | ---- | ------------------- |
| `type`       | string           | 18   | `"ImportSpecifier"` |
| `start`      | number           | 18   | `9`                 |
| `end`        | number           | 18   | `25`                |
| `loc`        | object           | 18   |                     |
| `imported`   | node(Identifier) | 18   |                     |
| `importKind` | string           | 18   | `"value"`           |
| `local`      | node(Identifier) | 18   |                     |

### LogicalExpression (2)

| キー       | 値の型                 | 件数 | 例                    |
| ---------- | ---------------------- | ---- | --------------------- |
| `type`     | string                 | 2    | `"LogicalExpression"` |
| `start`    | number                 | 2    | `1910`                |
| `end`      | number                 | 2    | `1925`                |
| `loc`      | object                 | 2    |                       |
| `left`     | node(MemberExpression) | 2    |                       |
| `operator` | string                 | 2    | `"??"`                |
| `right`    | node(NumericLiteral)   | 2    |                       |

### MemberExpression (26)

| キー       | 値の型                                                                                           | 件数 | 例                   |
| ---------- | ------------------------------------------------------------------------------------------------ | ---- | -------------------- |
| `type`     | string                                                                                           | 26   | `"MemberExpression"` |
| `start`    | number                                                                                           | 26   | `1425`               |
| `end`      | number                                                                                           | 26   | `1434`               |
| `loc`      | object                                                                                           | 26   |                      |
| `object`   | node(ThisExpression) / node(MemberExpression) / node(Identifier) / node(ParenthesizedExpression) | 26   |                      |
| `computed` | boolean                                                                                          | 26   | `false`              |
| `property` | node(Identifier) / node(MemberExpression)                                                        | 26   |                      |

### NewExpression (4)

| キー            | 値の型                                    | 件数 | 例                |
| --------------- | ----------------------------------------- | ---- | ----------------- |
| `type`          | string                                    | 4    | `"NewExpression"` |
| `start`         | number                                    | 4    | `2089`            |
| `end`           | number                                    | 4    | `2261`            |
| `loc`           | object                                    | 4    |                   |
| `callee`        | node(Identifier) / node(MemberExpression) | 4    |                   |
| `typeArguments` | node(TSTypeParameterInstantiation)        | 1    |                   |
| `arguments`     | array                                     | 4    |                   |

### NumericLiteral (5)

| キー    | 値の型 | 件数 | 例                 |
| ------- | ------ | ---- | ------------------ |
| `type`  | string | 5    | `"NumericLiteral"` |
| `start` | number | 5    | `962`              |
| `end`   | number | 5    | `964`              |
| `loc`   | object | 5    |                    |
| `extra` | object | 5    |                    |
| `value` | number | 5    | `10`               |

### ObjectExpression (11)

| キー         | 値の型 | 件数 | 例                   |
| ------------ | ------ | ---- | -------------------- |
| `type`       | string | 11   | `"ObjectExpression"` |
| `start`      | number | 11   | `1122`               |
| `end`        | number | 11   | `1185`               |
| `loc`        | object | 11   |                      |
| `properties` | array  | 11   |                      |
| `extra`      | object | 2    |                      |

### ObjectPattern (2)

| キー             | 値の型                 | 件数 | 例                |
| ---------------- | ---------------------- | ---- | ----------------- |
| `type`           | string                 | 2    | `"ObjectPattern"` |
| `start`          | number                 | 2    | `1329`            |
| `end`            | number                 | 2    | `1383`            |
| `loc`            | object                 | 2    |                   |
| `properties`     | array                  | 2    |                   |
| `typeAnnotation` | node(TSTypeAnnotation) | 1    |                   |

### ObjectProperty (24)

| キー        | 値の型                                                                                                                                  | 件数 | 例                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------ |
| `type`      | string                                                                                                                                  | 24   | `"ObjectProperty"` |
| `start`     | number                                                                                                                                  | 24   | `1124`             |
| `end`       | number                                                                                                                                  | 24   | `1145`             |
| `loc`       | object                                                                                                                                  | 24   |                    |
| `method`    | boolean                                                                                                                                 | 24   | `false`            |
| `key`       | node(Identifier)                                                                                                                        | 24   |                    |
| `computed`  | boolean                                                                                                                                 | 24   | `false`            |
| `shorthand` | boolean                                                                                                                                 | 24   | `false`            |
| `value`     | node(StringLiteral) / node(ArrayExpression) / node(Identifier) / node(ObjectExpression) / node(BooleanLiteral) / node(MemberExpression) | 24   |                    |

### OptionalCallExpression (1)

| キー        | 値の型                         | 件数 | 例                         |
| ----------- | ------------------------------ | ---- | -------------------------- |
| `type`      | string                         | 1    | `"OptionalCallExpression"` |
| `start`     | number                         | 1    | `2824`                     |
| `end`       | number                         | 1    | `2848`                     |
| `loc`       | object                         | 1    |                            |
| `callee`    | node(OptionalMemberExpression) | 1    |                            |
| `optional`  | boolean                        | 1    | `false`                    |
| `arguments` | array                          | 1    |                            |

### OptionalMemberExpression (2)

| キー       | 値の型                 | 件数 | 例                           |
| ---------- | ---------------------- | ---- | ---------------------------- |
| `type`     | string                 | 2    | `"OptionalMemberExpression"` |
| `start`    | number                 | 2    | `1600`                       |
| `end`      | number                 | 2    | `1617`                       |
| `loc`      | object                 | 2    |                              |
| `object`   | node(MemberExpression) | 2    |                              |
| `computed` | boolean                | 2    | `false`                      |
| `property` | node(Identifier)       | 2    |                              |
| `optional` | boolean                | 2    | `true`                       |

### ParenthesizedExpression (2)

| キー         | 値の型                                         | 件数 | 例                          |
| ------------ | ---------------------------------------------- | ---- | --------------------------- |
| `type`       | string                                         | 2    | `"ParenthesizedExpression"` |
| `start`      | number                                         | 2    | `1909`                      |
| `end`        | number                                         | 2    | `1926`                      |
| `loc`        | object                                         | 2    |                             |
| `expression` | node(LogicalExpression) / node(TSAsExpression) | 2    |                             |

### Program (4)

| キー          | 値の型 | 件数 | 例          |
| ------------- | ------ | ---- | ----------- |
| `type`        | string | 4    | `"Program"` |
| `start`       | number | 4    | `0`         |
| `end`         | number | 4    | `2858`      |
| `loc`         | object | 4    |             |
| `sourceType`  | string | 4    | `"module"`  |
| `interpreter` | null   | 4    |             |
| `body`        | array  | 4    |             |
| `directives`  | array  | 4    |             |
| `extra`       | object | 4    |             |

### ReturnStatement (6)

| キー       | 値の型                                                               | 件数 | 例                  |
| ---------- | -------------------------------------------------------------------- | ---- | ------------------- |
| `type`     | string                                                               | 6    | `"ReturnStatement"` |
| `start`    | number                                                               | 6    | `1579`              |
| `end`      | number                                                               | 6    | `1653`              |
| `loc`      | object                                                               | 6    |                     |
| `argument` | node(TSAsExpression) / node(BinaryExpression) / node(CallExpression) | 6    |                     |

### StringLiteral (35)

| キー    | 値の型 | 件数 | 例                |
| ------- | ------ | ---- | ----------------- |
| `type`  | string | 35   | `"StringLiteral"` |
| `start` | number | 35   | `51`              |
| `end`   | number | 35   | `56`              |
| `loc`   | object | 35   |                   |
| `extra` | object | 35   |                   |
| `value` | string | 35   | `"lwc"`           |

### ThisExpression (14)

| キー    | 値の型 | 件数 | 例                 |
| ------- | ------ | ---- | ------------------ |
| `type`  | string | 14   | `"ThisExpression"` |
| `start` | number | 14   | `1425`             |
| `end`   | number | 14   | `1429`             |
| `loc`   | object | 14   |                    |

### TryStatement (1)

| キー        | 値の型               | 件数 | 例               |
| ----------- | -------------------- | ---- | ---------------- |
| `type`      | string               | 1    | `"TryStatement"` |
| `start`     | number               | 1    | `2564`           |
| `end`       | number               | 1    | `2777`           |
| `loc`       | object               | 1    |                  |
| `block`     | node(BlockStatement) | 1    |                  |
| `handler`   | node(CatchClause)    | 1    |                  |
| `finalizer` | null                 | 1    |                  |

### TSArrayType (4)

| キー          | 値の型                                         | 件数 | 例              |
| ------------- | ---------------------------------------------- | ---- | --------------- |
| `type`        | string                                         | 4    | `"TSArrayType"` |
| `start`       | number                                         | 4    | `991`           |
| `end`         | number                                         | 4    | `996`           |
| `loc`         | object                                         | 4    |                 |
| `elementType` | node(TSTypeReference) / node(TSUnknownKeyword) | 4    |                 |

### TSAsExpression (3)

| キー             | 値の型                                                           | 件数 | 例                 |
| ---------------- | ---------------------------------------------------------------- | ---- | ------------------ |
| `type`           | string                                                           | 3    | `"TSAsExpression"` |
| `start`          | number                                                           | 3    | `1586`             |
| `end`            | number                                                           | 3    | `1652`             |
| `loc`            | object                                                           | 3    |                    |
| `expression`     | node(CallExpression) / node(MemberExpression) / node(Identifier) | 3    |                    |
| `typeAnnotation` | node(TSUnionType) / node(TSTypeReference)                        | 3    |                    |

### TSBooleanKeyword (2)

| キー    | 値の型 | 件数 | 例                   |
| ------- | ------ | ---- | -------------------- |
| `type`  | string | 2    | `"TSBooleanKeyword"` |
| `start` | number | 2    | `1680`               |
| `end`   | number | 2    | `1687`               |
| `loc`   | object | 2    |                      |

### TSInterfaceBody (2)

| キー    | 値の型 | 件数 | 例                  |
| ------- | ------ | ---- | ------------------- |
| `type`  | string | 2    | `"TSInterfaceBody"` |
| `start` | number | 2    | `745`               |
| `end`   | number | 2    | `789`               |
| `loc`   | object | 2    |                     |
| `body`  | array  | 2    |                     |

### TSInterfaceDeclaration (2)

| キー    | 値の型                | 件数 | 例                         |
| ------- | --------------------- | ---- | -------------------------- |
| `type`  | string                | 2    | `"TSInterfaceDeclaration"` |
| `start` | number                | 2    | `722`                      |
| `end`   | number                | 2    | `789`                      |
| `loc`   | object                | 2    |                            |
| `id`    | node(Identifier)      | 2    |                            |
| `body`  | node(TSInterfaceBody) | 2    |                            |

### TSLiteralType (4)

| キー      | 値の型              | 件数 | 例                |
| --------- | ------------------- | ---- | ----------------- |
| `type`    | string              | 4    | `"TSLiteralType"` |
| `start`   | number              | 4    | `703`             |
| `end`     | number              | 4    | `710`             |
| `loc`     | object              | 4    |                   |
| `literal` | node(StringLiteral) | 4    |                   |

### TSNonNullExpression (1)

| キー         | 値の型                 | 件数 | 例                      |
| ------------ | ---------------------- | ---- | ----------------------- |
| `type`       | string                 | 1    | `"TSNonNullExpression"` |
| `start`      | number                 | 1    | `2513`                  |
| `end`        | number                 | 1    | `2554`                  |
| `loc`        | object                 | 1    |                         |
| `expression` | node(MemberExpression) | 1    |                         |

### TSNumberKeyword (5)

| キー    | 値の型 | 件数 | 例                  |
| ------- | ------ | ---- | ------------------- |
| `type`  | string | 5    | `"TSNumberKeyword"` |
| `start` | number | 5    | `780`               |
| `end`   | number | 5    | `786`               |
| `loc`   | object | 5    |                     |

### TSPropertySignature (9)

| キー             | 値の型                 | 件数 | 例                      |
| ---------------- | ---------------------- | ---- | ----------------------- |
| `type`           | string                 | 9    | `"TSPropertySignature"` |
| `start`          | number                 | 9    | `751`                   |
| `end`            | number                 | 9    | `768`                   |
| `loc`            | object                 | 9    |                         |
| `key`            | node(Identifier)       | 9    |                         |
| `computed`       | boolean                | 9    | `false`                 |
| `typeAnnotation` | node(TSTypeAnnotation) | 9    |                         |
| `optional`       | boolean                | 5    | `true`                  |

### TSStringKeyword (13)

| キー    | 値の型 | 件数 | 例                  |
| ------- | ------ | ---- | ------------------- |
| `type`  | string | 13   | `"TSStringKeyword"` |
| `start` | number | 13   | `761`               |
| `end`   | number | 13   | `767`               |
| `loc`   | object | 13   |                     |

### TSTypeAliasDeclaration (2)

| キー             | 値の型            | 件数 | 例                         |
| ---------------- | ----------------- | ---- | -------------------------- |
| `type`           | string            | 2    | `"TSTypeAliasDeclaration"` |
| `start`          | number            | 2    | `687`                      |
| `end`            | number            | 2    | `720`                      |
| `loc`            | object            | 2    |                            |
| `id`             | node(Identifier)  | 2    |                            |
| `typeAnnotation` | node(TSUnionType) | 2    |                            |

### TSTypeAnnotation (38)

| キー             | 値の型                                                                                                                                                                                                      | 件数 | 例                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | -------------------- |
| `type`           | string                                                                                                                                                                                                      | 38   | `"TSTypeAnnotation"` |
| `start`          | number                                                                                                                                                                                                      | 38   | `759`                |
| `end`            | number                                                                                                                                                                                                      | 38   | `767`                |
| `loc`            | object                                                                                                                                                                                                      | 38   |                      |
| `typeAnnotation` | node(TSStringKeyword) / node(TSNumberKeyword) / node(TSArrayType) / node(TSTypeReference) / node(TSUnknownKeyword) / node(TSTypeLiteral) / node(TSVoidKeyword) / node(TSUnionType) / node(TSBooleanKeyword) | 38   |                      |

### TSTypeLiteral (2)

| キー      | 値の型 | 件数 | 例                |
| --------- | ------ | ---- | ----------------- |
| `type`    | string | 2    | `"TSTypeLiteral"` |
| `start`   | number | 2    | `1200`            |
| `end`     | number | 2    | `1235`            |
| `loc`     | object | 2    |                   |
| `members` | array  | 2    |                   |

### TSTypeParameterInstantiation (3)

| キー     | 値の型 | 件数 | 例                               |
| -------- | ------ | ---- | -------------------------------- |
| `type`   | string | 3    | `"TSTypeParameterInstantiation"` |
| `start`  | number | 3    | `1975`                           |
| `end`    | number | 3    | `1989`                           |
| `loc`    | object | 3    |                                  |
| `params` | array  | 3    |                                  |

### TSTypeReference (11)

| キー            | 値の型                             | 件数 | 例                  |
| --------------- | ---------------------------------- | ---- | ------------------- |
| `type`          | string                             | 11   | `"TSTypeReference"` |
| `start`         | number                             | 11   | `991`               |
| `end`           | number                             | 11   | `994`               |
| `loc`           | object                             | 11   |                     |
| `typeName`      | node(Identifier)                   | 11   |                     |
| `typeArguments` | node(TSTypeParameterInstantiation) | 2    |                     |

### TSUndefinedKeyword (2)

| キー    | 値の型 | 件数 | 例                     |
| ------- | ------ | ---- | ---------------------- |
| `type`  | string | 2    | `"TSUndefinedKeyword"` |
| `start` | number | 2    | `1559`                 |
| `end`   | number | 2    | `1568`                 |
| `loc`   | object | 2    |                        |

### TSUnionType (4)

| キー    | 値の型 | 件数 | 例              |
| ------- | ------ | ---- | --------------- |
| `type`  | string | 4    | `"TSUnionType"` |
| `start` | number | 4    | `703`           |
| `end`   | number | 4    | `719`           |
| `loc`   | object | 4    |                 |
| `types` | array  | 4    |                 |

### TSUnknownKeyword (6)

| キー    | 値の型 | 件数 | 例                   |
| ------- | ------ | ---- | -------------------- |
| `type`  | string | 6    | `"TSUnknownKeyword"` |
| `start` | number | 6    | `1091`               |
| `end`   | number | 6    | `1098`               |
| `loc`   | object | 6    |                      |

### TSVoidKeyword (5)

| キー    | 値の型 | 件数 | 例                |
| ------- | ------ | ---- | ----------------- |
| `type`  | string | 5    | `"TSVoidKeyword"` |
| `start` | number | 5    | `1386`            |
| `end`   | number | 5    | `1390`            |
| `loc`   | object | 5    |                   |

### VariableDeclaration (4)

| キー           | 値の型 | 件数 | 例                      |
| -------------- | ------ | ---- | ----------------------- |
| `type`         | string | 4    | `"VariableDeclaration"` |
| `start`        | number | 4    | `2007`                  |
| `end`          | number | 4    | `2048`                  |
| `loc`          | object | 4    |                         |
| `declarations` | array  | 4    |                         |
| `kind`         | string | 4    | `"const"`               |

### VariableDeclarator (4)

| キー    | 値の型                                                                                                   | 件数 | 例                     |
| ------- | -------------------------------------------------------------------------------------------------------- | ---- | ---------------------- |
| `type`  | string                                                                                                   | 4    | `"VariableDeclarator"` |
| `start` | number                                                                                                   | 4    | `2013`                 |
| `end`   | number                                                                                                   | 4    | `2047`                 |
| `loc`   | object                                                                                                   | 4    |                        |
| `id`    | node(ObjectPattern) / node(Identifier)                                                                   | 4    |                        |
| `init`  | node(MemberExpression) / node(TSNonNullExpression) / node(NewExpression) / node(ArrowFunctionExpression) | 4    |                        |

## @lwc/compiler

### (root.error.location) (1)

| キー     | 値の型 | 件数 | 例    |
| -------- | ------ | ---- | ----- |
| `line`   | number | 1    | `4`   |
| `column` | number | 1    | `4`   |
| `start`  | number | 1    | `112` |
| `length` | number | 1    | `4`   |

### (root.error) (1)

| キー       | 値の型 | 件数 | 例                                                             |
| ---------- | ------ | ---- | -------------------------------------------------------------- |
| `message`  | string | 1    | `"SyntaxError: broken.js: LWC1093: @api method or property ca` |
| `code`     | number | 1    | `1093`                                                         |
| `filename` | string | 1    | `"broken.js"`                                                  |
| `location` | object | 1    |                                                                |

### (root) (4)

| キー       | 値の型 | 件数 | 例                                                             |
| ---------- | ------ | ---- | -------------------------------------------------------------- |
| `warnings` | array  | 3    |                                                                |
| `code`     | string | 3    | `"import { registerDecorators as _registerDecorators } from \` |
| `error`    | object | 1    |                                                                |
