# LWC のライブラリの parse 結果の属性 (自動生成)

`run-library-parse.ts` が bundles/ のサンプルから集めたもの。ノードの種類ごとに、出てきたキー・値の型・例 (最初に出た値) を並べる。
`件数` はそのキーを持っていたノードの数 (ノードの数より少なければ、ないこともあるキー)。説明は [docs/lwc-implementation.md](../../../../lwc-implementation.md)。

## postcss

### (inputs) (3)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `hasBOM` | boolean | 3 | `false` |
| `css` | string | 3 | `":host {\n    display: block;\n    --account-list-gap: 0.5re` |
| `file` | string | 3 | `"accountList.css"` |

### (raws) (19)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `semicolon` | boolean | 10 | `false` |
| `after` | string | 10 | `"\n"` |
| `before` | string | 16 | `""` |
| `between` | string | 16 | `" "` |
| `afterName` | string | 1 | `" "` |

### (source.end) (19)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `column` | number | 19 | `19` |
| `line` | number | 19 | `2` |
| `offset` | number | 19 | `27` |

### (source.start) (19)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `column` | number | 19 | `5` |
| `line` | number | 19 | `2` |
| `offset` | number | 19 | `12` |

### (source) (19)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `end` | object | 19 |  |
| `inputId` | number | 19 | `0` |
| `start` | object | 19 |  |

### atrule (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `raws` | object | 1 |  |
| `type` | string | 1 | `"atrule"` |
| `name` | string | 1 | `"media"` |
| `source` | object | 1 |  |
| `params` | string | 1 | `"(max-width: 480px)"` |
| `nodes` | array | 1 |  |

### decl (9)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `raws` | object | 9 |  |
| `type` | string | 9 | `"decl"` |
| `source` | object | 9 |  |
| `prop` | string | 9 | `"display"` |
| `value` | string | 9 | `"block"` |
| `important` | boolean | 1 | `true` |

### root (3)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `raws` | object | 3 |  |
| `type` | string | 3 | `"root"` |
| `nodes` | array | 3 |  |
| `source` | object | 3 |  |
| `inputs` | array | 3 |  |

### rule (6)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `raws` | object | 6 |  |
| `type` | string | 6 | `"rule"` |
| `nodes` | array | 6 |  |
| `source` | object | 6 |  |
| `selector` | string | 6 | `":host"` |

## parse5

### (attrs) (39)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `name` | string | 39 | `"title"` |
| `value` | string | 39 | `"{title}"` |

### (sourceCodeLocation.attrs.*) (39)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `startLine` | number | 39 | `3` |
| `startCol` | number | 39 | `27` |
| `startOffset` | number | 39 | `101` |
| `endLine` | number | 39 | `3` |
| `endCol` | number | 39 | `41` |
| `endOffset` | number | 39 | `115` |

### (sourceCodeLocation.attrs) (25)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `*` | object | 39 |  |

### (sourceCodeLocation.endTag) (33)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `startLine` | number | 33 | `3` |
| `startCol` | number | 33 | `71` |
| `startOffset` | number | 33 | `145` |
| `endLine` | number | 33 | `3` |
| `endCol` | number | 33 | `90` |
| `endOffset` | number | 33 | `164` |

### (sourceCodeLocation.startTag.attrs.*) (39)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `startLine` | number | 39 | `3` |
| `startCol` | number | 39 | `27` |
| `startOffset` | number | 39 | `101` |
| `endLine` | number | 39 | `3` |
| `endCol` | number | 39 | `41` |
| `endOffset` | number | 39 | `115` |

### (sourceCodeLocation.startTag.attrs) (25)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `*` | object | 39 |  |

### (sourceCodeLocation.startTag) (33)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `startLine` | number | 33 | `3` |
| `startCol` | number | 33 | `9` |
| `startOffset` | number | 33 | `83` |
| `endLine` | number | 33 | `3` |
| `endCol` | number | 33 | `71` |
| `endOffset` | number | 33 | `145` |
| `attrs` | object | 25 |  |

### (sourceCodeLocation) (89)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `startLine` | number | 89 | `1` |
| `startCol` | number | 89 | `11` |
| `startOffset` | number | 89 | `10` |
| `endLine` | number | 89 | `2` |
| `endCol` | number | 89 | `5` |
| `endOffset` | number | 89 | `15` |
| `attrs` | object | 25 |  |
| `startTag` | object | 33 |  |
| `endTag` | object | 33 |  |

### #document-fragment (15)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `nodeName` | string | 15 | `"#document-fragment"` |
| `childNodes` | array | 15 |  |
| `sourceCodeLocation` | null | 11 |  |

### #text (56)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `nodeName` | string | 56 | `"#text"` |
| `value` | string | 56 | `"\n    "` |
| `sourceCodeLocation` | object | 56 |  |

### <要素> (22)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `nodeName` | string | 22 | `"lightning-card"` |
| `tagName` | string | 22 | `"lightning-card"` |
| `attrs` | array | 22 |  |
| `namespaceURI` | string | 22 | `"http://www.w3.org/1999/xhtml"` |
| `childNodes` | array | 22 |  |
| `sourceCodeLocation` | object | 22 |  |

### template (11)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `nodeName` | string | 11 | `"template"` |
| `tagName` | string | 11 | `"template"` |
| `attrs` | array | 11 |  |
| `namespaceURI` | string | 11 | `"http://www.w3.org/1999/xhtml"` |
| `childNodes` | array | 11 |  |
| `content` | node(#document-fragment) | 11 |  |
| `sourceCodeLocation` | object | 11 |  |

## @lwc/template-compiler

### (directiveLocation) (9)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `startLine` | number | 9 | `5` |
| `startColumn` | number | 9 | `19` |
| `endLine` | number | 9 | `5` |
| `endColumn` | number | 9 | `35` |
| `start` | number | 9 | `226` |
| `end` | number | 9 | `242` |

### (location.endTag) (24)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `startLine` | number | 24 | `43` |
| `startColumn` | number | 24 | `1` |
| `endLine` | number | 24 | `43` |
| `endColumn` | number | 24 | `12` |
| `start` | number | 24 | `1846` |
| `end` | number | 24 | `1857` |

### (location.startTag) (24)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `startLine` | number | 24 | `1` |
| `startColumn` | number | 24 | `1` |
| `endLine` | number | 24 | `1` |
| `endColumn` | number | 24 | `11` |
| `start` | number | 24 | `0` |
| `end` | number | 24 | `10` |

### (location) (97)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `startLine` | number | 97 | `1` |
| `startColumn` | number | 97 | `1` |
| `endLine` | number | 97 | `43` |
| `endColumn` | number | 97 | `12` |
| `start` | number | 97 | `0` |
| `end` | number | 97 | `1857` |
| `startTag` | object | 24 |  |
| `endTag` | object | 24 |  |

### (root.warnings.location) (2)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `line` | number | 2 | `2` |
| `column` | number | 2 | `5` |
| `start` | number | 2 | `15` |
| `length` | number | 2 | `67` |

### (root.warnings) (2)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `code` | number | 2 | `1166` |
| `message` | string | 2 | `"LWC1166: 'if:true' directive cannot be used with 'lwc:if', ` |
| `level` | number | 2 | `1` |
| `location` | object | 2 |  |
| `url` | string | 2 | `""` |

### (root) (4)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `root` | node(Root) | 4 |  |
| `warnings` | array | 4 |  |

### Attribute (11)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 11 | `"Attribute"` |
| `name` | string | 11 | `"slot"` |
| `value` | node(Literal) / node(MemberExpression) | 11 |  |
| `location` | object | 11 |  |

### Component (4)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 4 | `"Component"` |
| `name` | string | 4 | `"lightning-card"` |
| `namespace` | string | 4 | `"http://www.w3.org/1999/xhtml"` |
| `location` | object | 4 |  |
| `attributes` | array | 4 |  |
| `properties` | array | 4 |  |
| `directives` | array | 4 |  |
| `listeners` | array | 4 |  |
| `children` | array | 4 |  |

### Directive (4)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 4 | `"Directive"` |
| `name` | string | 4 | `"Ref"` |
| `value` | node(Literal) / node(MemberExpression) | 4 |  |
| `location` | object | 4 |  |

### Element (15)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 15 | `"Element"` |
| `name` | string | 15 | `"p"` |
| `namespace` | string | 15 | `"http://www.w3.org/1999/xhtml"` |
| `location` | object | 15 |  |
| `attributes` | array | 15 |  |
| `properties` | array | 15 |  |
| `directives` | array | 15 |  |
| `listeners` | array | 15 |  |
| `children` | array | 15 |  |

### ElseBlock (2)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 2 | `"ElseBlock"` |
| `location` | object | 2 |  |
| `directiveLocation` | object | 2 |  |
| `children` | array | 2 |  |

### ElseifBlock (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 1 | `"ElseifBlock"` |
| `condition` | node(Identifier) | 1 |  |
| `location` | object | 1 |  |
| `directiveLocation` | object | 1 |  |
| `children` | array | 1 |  |
| `else` | node(ElseBlock) | 1 |  |

### EventListener (4)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 4 | `"EventListener"` |
| `name` | string | 4 | `"click"` |
| `handler` | node(Identifier) | 4 |  |
| `location` | object | 4 |  |

### ForEach (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 1 | `"ForEach"` |
| `expression` | node(Identifier) | 1 |  |
| `item` | node(Identifier) | 1 |  |
| `index` | node(Identifier) | 1 |  |
| `location` | object | 1 |  |
| `directiveLocation` | object | 1 |  |
| `children` | array | 1 |  |

### ForOf (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 1 | `"ForOf"` |
| `expression` | node(Identifier) | 1 |  |
| `iterator` | node(Identifier) | 1 |  |
| `location` | object | 1 |  |
| `directiveLocation` | object | 1 |  |
| `children` | array | 1 |  |

### Identifier (38)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 38 | `"Identifier"` |
| `start` | number | 35 | `1` |
| `end` | number | 35 | `6` |
| `name` | string | 38 | `"title"` |
| `location` | object | 20 |  |

### IfBlock (4)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 4 | `"IfBlock"` |
| `condition` | node(Identifier) / node(MemberExpression) | 4 |  |
| `location` | object | 4 |  |
| `directiveLocation` | object | 4 |  |
| `children` | array | 4 |  |
| `else` | node(ElseBlock) / node(ElseifBlock) | 2 |  |

### Literal (18)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 18 | `"Literal"` |
| `value` | string | 18 | `"standard:account"` |

### MemberExpression (10)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 10 | `"MemberExpression"` |
| `start` | number | 10 | `1` |
| `end` | number | 10 | `7` |
| `object` | node(Identifier) / node(MemberExpression) | 10 |  |
| `property` | node(Identifier) | 10 |  |
| `computed` | boolean | 10 | `false` |
| `optional` | boolean | 10 | `false` |
| `location` | object | 8 |  |

### Property (7)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 7 | `"Property"` |
| `name` | string | 7 | `"title"` |
| `attributeName` | string | 7 | `"title"` |
| `value` | node(Identifier) / node(Literal) / node(MemberExpression) | 7 |  |
| `location` | object | 7 |  |

### Root (4)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 4 | `"Root"` |
| `location` | object | 4 |  |
| `directives` | array | 4 |  |
| `children` | array | 4 |  |

### Slot (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 1 | `"Slot"` |
| `name` | string | 1 | `"slot"` |
| `namespace` | string | 1 | `"http://www.w3.org/1999/xhtml"` |
| `slotName` | string | 1 | `"footer"` |
| `location` | object | 1 |  |
| `attributes` | array | 1 |  |
| `properties` | array | 1 |  |
| `directives` | array | 1 |  |
| `listeners` | array | 1 |  |
| `children` | array | 1 |  |

### Text (10)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 10 | `"Text"` |
| `raw` | string | 10 | `"{parentName}"` |
| `value` | node(Identifier) / node(Literal) / node(MemberExpression) | 10 |  |
| `location` | object | 10 |  |

## parseXml

### (attributes) (31)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `xmlns` | string | 5 | `"http://soap.sforce.com/2006/04/metadata"` |
| `targets` | string | 2 | `"lightning__RecordPage"` |
| `name` | string | 3 | `"title"` |
| `type` | string | 5 | `"String"` |
| `label` | string | 3 | `"タイトル"` |
| `default` | string | 2 | `"取引先一覧"` |
| `min` | string | 1 | `"1"` |
| `max` | string | 1 | `"50"` |

### (end) (31)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `offset` | number | 31 | `147` |
| `line` | number | 31 | `3` |
| `column` | number | 31 | `33` |

### (start) (31)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `offset` | number | 31 | `118` |
| `line` | number | 31 | `3` |
| `column` | number | 31 | `4` |

### apiVersion (5)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `name` | string | 5 | `"apiVersion"` |
| `attributes` | object | 5 |  |
| `children` | array | 5 |  |
| `text` | string | 5 | `"61.0"` |
| `start` | object | 5 |  |
| `end` | object | 5 |  |

### description (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `name` | string | 1 | `"description"` |
| `attributes` | object | 1 |  |
| `children` | array | 1 |  |
| `text` | string | 1 | `"親レコードに紐づく取引先の一覧"` |
| `start` | object | 1 |  |
| `end` | object | 1 |  |

### isExposed (5)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `name` | string | 5 | `"isExposed"` |
| `attributes` | object | 5 |  |
| `children` | array | 5 |  |
| `text` | string | 5 | `"true"` |
| `start` | object | 5 |  |
| `end` | object | 5 |  |

### LightningComponentBundle (5)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `name` | string | 5 | `"LightningComponentBundle"` |
| `attributes` | object | 5 |  |
| `children` | array | 5 |  |
| `text` | string | 5 | `""` |
| `start` | object | 5 |  |
| `end` | object | 5 |  |

### masterLabel (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `name` | string | 1 | `"masterLabel"` |
| `attributes` | object | 1 |  |
| `children` | array | 1 |  |
| `text` | string | 1 | `"取引先一覧"` |
| `start` | object | 1 |  |
| `end` | object | 1 |  |

### object (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `name` | string | 1 | `"object"` |
| `attributes` | object | 1 |  |
| `children` | array | 1 |  |
| `text` | string | 1 | `"Account"` |
| `start` | object | 1 |  |
| `end` | object | 1 |  |

### objects (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `name` | string | 1 | `"objects"` |
| `attributes` | object | 1 |  |
| `children` | array | 1 |  |
| `text` | string | 1 | `""` |
| `start` | object | 1 |  |
| `end` | object | 1 |  |

### property (3)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `name` | string | 3 | `"property"` |
| `attributes` | object | 3 |  |
| `children` | array | 3 |  |
| `text` | string | 3 | `""` |
| `start` | object | 3 |  |
| `end` | object | 3 |  |

### supportedFormFactor (2)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `name` | string | 2 | `"supportedFormFactor"` |
| `attributes` | object | 2 |  |
| `children` | array | 2 |  |
| `text` | string | 2 | `""` |
| `start` | object | 2 |  |
| `end` | object | 2 |  |

### supportedFormFactors (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `name` | string | 1 | `"supportedFormFactors"` |
| `attributes` | object | 1 |  |
| `children` | array | 1 |  |
| `text` | string | 1 | `""` |
| `start` | object | 1 |  |
| `end` | object | 1 |  |

### target (2)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `name` | string | 2 | `"target"` |
| `attributes` | object | 2 |  |
| `children` | array | 2 |  |
| `text` | string | 2 | `"lightning__RecordPage"` |
| `start` | object | 2 |  |
| `end` | object | 2 |  |

### targetConfig (2)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `name` | string | 2 | `"targetConfig"` |
| `attributes` | object | 2 |  |
| `children` | array | 2 |  |
| `text` | string | 2 | `""` |
| `start` | object | 2 |  |
| `end` | object | 2 |  |

### targetConfigs (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `name` | string | 1 | `"targetConfigs"` |
| `attributes` | object | 1 |  |
| `children` | array | 1 |  |
| `text` | string | 1 | `""` |
| `start` | object | 1 |  |
| `end` | object | 1 |  |

### targets (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `name` | string | 1 | `"targets"` |
| `attributes` | object | 1 |  |
| `children` | array | 1 |  |
| `text` | string | 1 | `""` |
| `start` | object | 1 |  |
| `end` | object | 1 |  |

## @babel/parser

### (extra) (50)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `rawValue` | string / number | 42 | `"lwc"` |
| `raw` | string | 42 | `"'lwc'"` |
| `trailingComma` | number | 3 | `2261` |
| `topLevelAwait` | boolean | 5 | `false` |

### (loc.end) (636)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `line` | number | 636 | `87` |
| `column` | number | 636 | `0` |
| `index` | number | 636 | `2858` |

### (loc.start) (636)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `line` | number | 636 | `1` |
| `column` | number | 636 | `0` |
| `index` | number | 636 | `0` |

### (loc) (636)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `start` | object | 636 |  |
| `end` | object | 636 |  |
| `identifierName` | string | 214 | `"LightningElement"` |

### ArrayExpression (2)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 2 | `"ArrayExpression"` |
| `start` | number | 2 | `999` |
| `end` | number | 2 | `1001` |
| `loc` | object | 2 |  |
| `elements` | array | 2 |  |

### ArrowFunctionExpression (3)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 3 | `"ArrowFunctionExpression"` |
| `start` | number | 3 | `1889` |
| `end` | number | 3 | `1926` |
| `loc` | object | 3 |  |
| `id` | null | 3 |  |
| `generator` | boolean | 3 | `false` |
| `async` | boolean | 3 | `false` |
| `params` | array | 3 |  |
| `body` | node(BinaryExpression) / node(CallExpression) / node(TSAsExpression) | 3 |  |
| `returnType` | node(TSTypeAnnotation) | 1 |  |

### AssignmentExpression (3)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 3 | `"AssignmentExpression"` |
| `start` | number | 3 | `1425` |
| `end` | number | 3 | `1449` |
| `loc` | object | 3 |  |
| `operator` | string | 3 | `"="` |
| `left` | node(MemberExpression) | 3 |  |
| `right` | node(CallExpression) / node(Identifier) | 3 |  |

### AwaitExpression (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 1 | `"AwaitExpression"` |
| `start` | number | 1 | `2582` |
| `end` | number | 1 | `2615` |
| `loc` | object | 1 |  |
| `argument` | node(CallExpression) | 1 |  |

### BinaryExpression (3)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 3 | `"BinaryExpression"` |
| `start` | number | 3 | `1705` |
| `end` | number | 3 | `1725` |
| `loc` | object | 3 |  |
| `left` | node(MemberExpression) / node(Identifier) | 3 |  |
| `operator` | string | 3 | `">"` |
| `right` | node(NumericLiteral) / node(StringLiteral) / node(ParenthesizedExpression) | 3 |  |

### BlockStatement (15)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 15 | `"BlockStatement"` |
| `start` | number | 15 | `1391` |
| `end` | number | 15 | `1526` |
| `loc` | object | 15 |  |
| `body` | array | 15 |  |
| `directives` | array | 15 |  |

### BooleanLiteral (2)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 2 | `"BooleanLiteral"` |
| `start` | number | 2 | `2208` |
| `end` | number | 2 | `2212` |
| `loc` | object | 2 |  |
| `value` | boolean | 2 | `true` |

### CallExpression (15)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 15 | `"CallExpression"` |
| `start` | number | 15 | `832` |
| `end` | number | 15 | `865` |
| `loc` | object | 15 |  |
| `callee` | node(Identifier) / node(MemberExpression) | 15 |  |
| `arguments` | array | 15 |  |
| `extra` | object | 1 |  |

### CatchClause (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 1 | `"CatchClause"` |
| `start` | number | 1 | `2720` |
| `end` | number | 1 | `2777` |
| `loc` | object | 1 |  |
| `param` | node(Identifier) | 1 |  |
| `body` | node(BlockStatement) | 1 |  |

### ClassBody (4)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 4 | `"ClassBody"` |
| `start` | number | 4 | `866` |
| `end` | number | 4 | `2857` |
| `loc` | object | 4 |  |
| `body` | array | 4 |  |

### ClassDeclaration (4)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 4 | `"ClassDeclaration"` |
| `start` | number | 4 | `806` |
| `end` | number | 4 | `2857` |
| `loc` | object | 4 |  |
| `id` | node(Identifier) | 4 |  |
| `superClass` | node(CallExpression) / node(Identifier) | 4 |  |
| `body` | node(ClassBody) | 4 |  |

### ClassMethod (10)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 10 | `"ClassMethod"` |
| `start` | number | 10 | `1242` |
| `end` | number | 10 | `1526` |
| `loc` | object | 10 |  |
| `decorators` | array | 2 |  |
| `static` | boolean | 10 | `false` |
| `key` | node(Identifier) | 10 |  |
| `computed` | boolean | 10 | `false` |
| `kind` | string | 10 | `"method"` |
| `id` | null | 10 |  |
| `generator` | boolean | 10 | `false` |
| `async` | boolean | 10 | `false` |
| `params` | array | 10 |  |
| `returnType` | node(TSTypeAnnotation) | 10 |  |
| `body` | node(BlockStatement) | 10 |  |

### ClassProperty (13)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 13 | `"ClassProperty"` |
| `start` | number | 13 | `872` |
| `end` | number | 13 | `895` |
| `loc` | object | 13 |  |
| `decorators` | array | 10 |  |
| `static` | boolean | 13 | `false` |
| `key` | node(Identifier) | 13 |  |
| `computed` | boolean | 13 | `false` |
| `definite` | boolean | 2 | `true` |
| `typeAnnotation` | node(TSTypeAnnotation) | 12 |  |
| `value` | null / node(Identifier) / node(NumericLiteral) / node(ArrayExpression) / node(StringLiteral) | 13 |  |
| `optional` | boolean | 4 | `true` |
| `accessibility` | string | 1 | `"private"` |

### Decorator (13)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 13 | `"Decorator"` |
| `start` | number | 13 | `872` |
| `end` | number | 13 | `876` |
| `loc` | object | 13 |  |
| `expression` | node(Identifier) / node(CallExpression) | 13 |  |

### ExportDefaultDeclaration (4)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 4 | `"ExportDefaultDeclaration"` |
| `start` | number | 4 | `791` |
| `end` | number | 4 | `2857` |
| `loc` | object | 4 |  |
| `exportKind` | string | 3 | `"value"` |
| `declaration` | node(ClassDeclaration) | 4 |  |

### ExportNamedDeclaration (4)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 4 | `"ExportNamedDeclaration"` |
| `start` | number | 4 | `0` |
| `end` | number | 4 | `43` |
| `loc` | object | 4 |  |
| `exportKind` | string | 4 | `"type"` |
| `specifiers` | array | 4 |  |
| `source` | null | 4 |  |
| `attributes` | array | 4 |  |
| `declaration` | node(TSTypeAliasDeclaration) / node(TSInterfaceDeclaration) / node(VariableDeclaration) / node(FunctionDeclaration) | 4 |  |

### ExpressionStatement (9)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 9 | `"ExpressionStatement"` |
| `start` | number | 9 | `1425` |
| `end` | number | 9 | `1450` |
| `loc` | object | 9 |  |
| `expression` | node(AssignmentExpression) / node(CallExpression) / node(AwaitExpression) / node(OptionalCallExpression) | 9 |  |

### File (5)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 5 | `"File"` |
| `start` | number | 5 | `0` |
| `end` | number | 5 | `2858` |
| `loc` | object | 5 |  |
| `errors` | array | 5 |  |
| `program` | node(Program) | 5 |  |
| `comments` | array | 5 |  |

### FunctionDeclaration (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 1 | `"FunctionDeclaration"` |
| `start` | number | 1 | `305` |
| `end` | number | 1 | `402` |
| `loc` | object | 1 |  |
| `id` | node(Identifier) | 1 |  |
| `generator` | boolean | 1 | `false` |
| `async` | boolean | 1 | `false` |
| `params` | array | 1 |  |
| `returnType` | node(TSTypeAnnotation) | 1 |  |
| `body` | node(BlockStatement) | 1 |  |

### Identifier (214)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 214 | `"Identifier"` |
| `start` | number | 214 | `9` |
| `end` | number | 214 | `25` |
| `loc` | object | 214 |  |
| `name` | string | 214 | `"LightningElement"` |
| `typeAnnotation` | node(TSTypeAnnotation) | 4 |  |

### IfStatement (2)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 2 | `"IfStatement"` |
| `start` | number | 2 | `1401` |
| `end` | number | 2 | `1520` |
| `loc` | object | 2 |  |
| `test` | node(Identifier) | 2 |  |
| `consequent` | node(BlockStatement) | 2 |  |
| `alternate` | node(IfStatement) / null | 2 |  |

### ImportDeclaration (15)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 15 | `"ImportDeclaration"` |
| `start` | number | 15 | `0` |
| `end` | number | 15 | `57` |
| `loc` | object | 15 |  |
| `importKind` | string | 14 | `"value"` |
| `specifiers` | array | 15 |  |
| `source` | node(StringLiteral) | 15 |  |
| `attributes` | array | 15 |  |

### ImportDefaultSpecifier (5)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 5 | `"ImportDefaultSpecifier"` |
| `start` | number | 5 | `254` |
| `end` | number | 5 | `265` |
| `loc` | object | 5 |  |
| `local` | node(Identifier) | 5 |  |

### ImportSpecifier (20)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 20 | `"ImportSpecifier"` |
| `start` | number | 20 | `9` |
| `end` | number | 20 | `25` |
| `loc` | object | 20 |  |
| `imported` | node(Identifier) | 20 |  |
| `importKind` | string | 18 | `"value"` |
| `local` | node(Identifier) | 20 |  |

### LogicalExpression (2)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 2 | `"LogicalExpression"` |
| `start` | number | 2 | `1910` |
| `end` | number | 2 | `1925` |
| `loc` | object | 2 |  |
| `left` | node(MemberExpression) | 2 |  |
| `operator` | string | 2 | `"??"` |
| `right` | node(NumericLiteral) | 2 |  |

### MemberExpression (26)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 26 | `"MemberExpression"` |
| `start` | number | 26 | `1425` |
| `end` | number | 26 | `1434` |
| `loc` | object | 26 |  |
| `object` | node(ThisExpression) / node(MemberExpression) / node(Identifier) / node(ParenthesizedExpression) | 26 |  |
| `computed` | boolean | 26 | `false` |
| `property` | node(Identifier) / node(MemberExpression) | 26 |  |

### NewExpression (4)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 4 | `"NewExpression"` |
| `start` | number | 4 | `2089` |
| `end` | number | 4 | `2261` |
| `loc` | object | 4 |  |
| `callee` | node(Identifier) / node(MemberExpression) | 4 |  |
| `typeArguments` | node(TSTypeParameterInstantiation) | 1 |  |
| `arguments` | array | 4 |  |

### NumericLiteral (5)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 5 | `"NumericLiteral"` |
| `start` | number | 5 | `962` |
| `end` | number | 5 | `964` |
| `loc` | object | 5 |  |
| `extra` | object | 5 |  |
| `value` | number | 5 | `10` |

### ObjectExpression (11)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 11 | `"ObjectExpression"` |
| `start` | number | 11 | `1122` |
| `end` | number | 11 | `1185` |
| `loc` | object | 11 |  |
| `properties` | array | 11 |  |
| `extra` | object | 2 |  |

### ObjectPattern (2)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 2 | `"ObjectPattern"` |
| `start` | number | 2 | `1329` |
| `end` | number | 2 | `1383` |
| `loc` | object | 2 |  |
| `properties` | array | 2 |  |
| `typeAnnotation` | node(TSTypeAnnotation) | 1 |  |

### ObjectProperty (24)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 24 | `"ObjectProperty"` |
| `start` | number | 24 | `1124` |
| `end` | number | 24 | `1145` |
| `loc` | object | 24 |  |
| `method` | boolean | 24 | `false` |
| `key` | node(Identifier) | 24 |  |
| `computed` | boolean | 24 | `false` |
| `shorthand` | boolean | 24 | `false` |
| `value` | node(StringLiteral) / node(ArrayExpression) / node(Identifier) / node(ObjectExpression) / node(BooleanLiteral) / node(MemberExpression) | 24 |  |

### OptionalCallExpression (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 1 | `"OptionalCallExpression"` |
| `start` | number | 1 | `2824` |
| `end` | number | 1 | `2848` |
| `loc` | object | 1 |  |
| `callee` | node(OptionalMemberExpression) | 1 |  |
| `optional` | boolean | 1 | `false` |
| `arguments` | array | 1 |  |

### OptionalMemberExpression (2)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 2 | `"OptionalMemberExpression"` |
| `start` | number | 2 | `1600` |
| `end` | number | 2 | `1617` |
| `loc` | object | 2 |  |
| `object` | node(MemberExpression) | 2 |  |
| `computed` | boolean | 2 | `false` |
| `property` | node(Identifier) | 2 |  |
| `optional` | boolean | 2 | `true` |

### ParenthesizedExpression (2)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 2 | `"ParenthesizedExpression"` |
| `start` | number | 2 | `1909` |
| `end` | number | 2 | `1926` |
| `loc` | object | 2 |  |
| `expression` | node(LogicalExpression) / node(TSAsExpression) | 2 |  |

### Program (5)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 5 | `"Program"` |
| `start` | number | 5 | `0` |
| `end` | number | 5 | `2858` |
| `loc` | object | 5 |  |
| `sourceType` | string | 5 | `"module"` |
| `interpreter` | null | 5 |  |
| `body` | array | 5 |  |
| `directives` | array | 5 |  |
| `extra` | object | 5 |  |

### ReturnStatement (6)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 6 | `"ReturnStatement"` |
| `start` | number | 6 | `1579` |
| `end` | number | 6 | `1653` |
| `loc` | object | 6 |  |
| `argument` | node(TSAsExpression) / node(BinaryExpression) / node(CallExpression) | 6 |  |

### StringLiteral (37)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 37 | `"StringLiteral"` |
| `start` | number | 37 | `51` |
| `end` | number | 37 | `56` |
| `loc` | object | 37 |  |
| `extra` | object | 37 |  |
| `value` | string | 37 | `"lwc"` |

### ThisExpression (14)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 14 | `"ThisExpression"` |
| `start` | number | 14 | `1425` |
| `end` | number | 14 | `1429` |
| `loc` | object | 14 |  |

### TryStatement (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 1 | `"TryStatement"` |
| `start` | number | 1 | `2564` |
| `end` | number | 1 | `2777` |
| `loc` | object | 1 |  |
| `block` | node(BlockStatement) | 1 |  |
| `handler` | node(CatchClause) | 1 |  |
| `finalizer` | null | 1 |  |

### TSArrayType (4)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 4 | `"TSArrayType"` |
| `start` | number | 4 | `991` |
| `end` | number | 4 | `996` |
| `loc` | object | 4 |  |
| `elementType` | node(TSTypeReference) / node(TSUnknownKeyword) | 4 |  |

### TSAsExpression (3)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 3 | `"TSAsExpression"` |
| `start` | number | 3 | `1586` |
| `end` | number | 3 | `1652` |
| `loc` | object | 3 |  |
| `expression` | node(CallExpression) / node(MemberExpression) / node(Identifier) | 3 |  |
| `typeAnnotation` | node(TSUnionType) / node(TSTypeReference) | 3 |  |

### TSBooleanKeyword (2)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 2 | `"TSBooleanKeyword"` |
| `start` | number | 2 | `1680` |
| `end` | number | 2 | `1687` |
| `loc` | object | 2 |  |

### TSInterfaceBody (2)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 2 | `"TSInterfaceBody"` |
| `start` | number | 2 | `745` |
| `end` | number | 2 | `789` |
| `loc` | object | 2 |  |
| `body` | array | 2 |  |

### TSInterfaceDeclaration (2)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 2 | `"TSInterfaceDeclaration"` |
| `start` | number | 2 | `722` |
| `end` | number | 2 | `789` |
| `loc` | object | 2 |  |
| `id` | node(Identifier) | 2 |  |
| `body` | node(TSInterfaceBody) | 2 |  |

### TSLiteralType (4)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 4 | `"TSLiteralType"` |
| `start` | number | 4 | `703` |
| `end` | number | 4 | `710` |
| `loc` | object | 4 |  |
| `literal` | node(StringLiteral) | 4 |  |

### TSNonNullExpression (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 1 | `"TSNonNullExpression"` |
| `start` | number | 1 | `2513` |
| `end` | number | 1 | `2554` |
| `loc` | object | 1 |  |
| `expression` | node(MemberExpression) | 1 |  |

### TSNumberKeyword (5)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 5 | `"TSNumberKeyword"` |
| `start` | number | 5 | `780` |
| `end` | number | 5 | `786` |
| `loc` | object | 5 |  |

### TSPropertySignature (9)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 9 | `"TSPropertySignature"` |
| `start` | number | 9 | `751` |
| `end` | number | 9 | `768` |
| `loc` | object | 9 |  |
| `key` | node(Identifier) | 9 |  |
| `computed` | boolean | 9 | `false` |
| `typeAnnotation` | node(TSTypeAnnotation) | 9 |  |
| `optional` | boolean | 5 | `true` |

### TSStringKeyword (13)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 13 | `"TSStringKeyword"` |
| `start` | number | 13 | `761` |
| `end` | number | 13 | `767` |
| `loc` | object | 13 |  |

### TSTypeAliasDeclaration (2)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 2 | `"TSTypeAliasDeclaration"` |
| `start` | number | 2 | `687` |
| `end` | number | 2 | `720` |
| `loc` | object | 2 |  |
| `id` | node(Identifier) | 2 |  |
| `typeAnnotation` | node(TSUnionType) | 2 |  |

### TSTypeAnnotation (38)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 38 | `"TSTypeAnnotation"` |
| `start` | number | 38 | `759` |
| `end` | number | 38 | `767` |
| `loc` | object | 38 |  |
| `typeAnnotation` | node(TSStringKeyword) / node(TSNumberKeyword) / node(TSArrayType) / node(TSTypeReference) / node(TSUnknownKeyword) / node(TSTypeLiteral) / node(TSVoidKeyword) / node(TSUnionType) / node(TSBooleanKeyword) | 38 |  |

### TSTypeLiteral (2)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 2 | `"TSTypeLiteral"` |
| `start` | number | 2 | `1200` |
| `end` | number | 2 | `1235` |
| `loc` | object | 2 |  |
| `members` | array | 2 |  |

### TSTypeParameterInstantiation (3)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 3 | `"TSTypeParameterInstantiation"` |
| `start` | number | 3 | `1975` |
| `end` | number | 3 | `1989` |
| `loc` | object | 3 |  |
| `params` | array | 3 |  |

### TSTypeReference (11)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 11 | `"TSTypeReference"` |
| `start` | number | 11 | `991` |
| `end` | number | 11 | `994` |
| `loc` | object | 11 |  |
| `typeName` | node(Identifier) | 11 |  |
| `typeArguments` | node(TSTypeParameterInstantiation) | 2 |  |

### TSUndefinedKeyword (2)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 2 | `"TSUndefinedKeyword"` |
| `start` | number | 2 | `1559` |
| `end` | number | 2 | `1568` |
| `loc` | object | 2 |  |

### TSUnionType (4)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 4 | `"TSUnionType"` |
| `start` | number | 4 | `703` |
| `end` | number | 4 | `719` |
| `loc` | object | 4 |  |
| `types` | array | 4 |  |

### TSUnknownKeyword (6)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 6 | `"TSUnknownKeyword"` |
| `start` | number | 6 | `1091` |
| `end` | number | 6 | `1098` |
| `loc` | object | 6 |  |

### TSVoidKeyword (5)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 5 | `"TSVoidKeyword"` |
| `start` | number | 5 | `1386` |
| `end` | number | 5 | `1390` |
| `loc` | object | 5 |  |

### VariableDeclaration (4)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 4 | `"VariableDeclaration"` |
| `start` | number | 4 | `2007` |
| `end` | number | 4 | `2048` |
| `loc` | object | 4 |  |
| `declarations` | array | 4 |  |
| `kind` | string | 4 | `"const"` |

### VariableDeclarator (4)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `type` | string | 4 | `"VariableDeclarator"` |
| `start` | number | 4 | `2013` |
| `end` | number | 4 | `2047` |
| `loc` | object | 4 |  |
| `id` | node(ObjectPattern) / node(Identifier) | 4 |  |
| `init` | node(MemberExpression) / node(TSNonNullExpression) / node(NewExpression) / node(ArrowFunctionExpression) | 4 |  |

## @lwc/compiler

### (root.error.location) (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `line` | number | 1 | `4` |
| `column` | number | 1 | `4` |
| `start` | number | 1 | `112` |
| `length` | number | 1 | `4` |

### (root.error) (1)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `message` | string | 1 | `"SyntaxError: broken.js: LWC1093: @api method or property ca` |
| `code` | number | 1 | `1093` |
| `filename` | string | 1 | `"broken.js"` |
| `location` | object | 1 |  |

### (root) (5)

| キー | 値の型 | 件数 | 例 |
| --- | --- | --- | --- |
| `warnings` | array | 4 |  |
| `code` | string | 4 | `"import { registerDecorators as _registerDecorators } from \` |
| `error` | object | 1 |  |
