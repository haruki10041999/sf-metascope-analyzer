# unknown 引数の一覧：解析本体

[集計条件・全体の目次](./unknown-parameters.md)。181 件。

## src/analyzer/parser/commons.ts

### [src/analyzer/parser/commons.ts](../src/analyzer/parser/commons.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [56](../src/analyzer/parser/commons.ts#L56) | `makeJsonSaveData` | `data: unknown` | 実装 |

## src/analyzer/parser/Lwc

### [src/analyzer/parser/Lwc/script.ts](../src/analyzer/parser/Lwc/script.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [17](../src/analyzer/parser/Lwc/script.ts#L17) | `isBabelSyntaxError` | `error: unknown` | 実装 |

### [src/analyzer/parser/Lwc/stylesheet.ts](../src/analyzer/parser/Lwc/stylesheet.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [32](../src/analyzer/parser/Lwc/stylesheet.ts#L32) | `isCssError` | `value: unknown` | 実装 |

### [src/analyzer/parser/Lwc/validate/javascript.ts](../src/analyzer/parser/Lwc/validate/javascript.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [32](../src/analyzer/parser/Lwc/validate/javascript.ts#L32) | `isCompilerDiagnostic` | `value: unknown` | 実装 |

## src/analyzer/processor/Apex

### [src/analyzer/processor/Apex/calls.ts](../src/analyzer/processor/Apex/calls.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [21](../src/analyzer/processor/Apex/calls.ts#L21) | `isRecord` | `value: unknown` | 実装 |
| [24](../src/analyzer/processor/Apex/calls.ts#L24) | `str` | `value: unknown` | 実装 |
| [147](../src/analyzer/processor/Apex/calls.ts#L147) | `apexDmlTargetOf` | `field: unknown` | 実装 |
| [167](../src/analyzer/processor/Apex/calls.ts#L167) | `staticOwnerOf` | `object: unknown` | 実装 |
| [227](../src/analyzer/processor/Apex/calls.ts#L227) | `accessLevelOf` | `args: unknown[]` | 実装 |

### [src/analyzer/processor/Apex/commons.ts](../src/analyzer/processor/Apex/commons.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [41](../src/analyzer/processor/Apex/commons.ts#L41) | `_extractConvertKeys` | `target: unknown` | 実装 |
| [79](../src/analyzer/processor/Apex/commons.ts#L79) | `extractConvert` | `target: unknown` | 実装 |
| [108](../src/analyzer/processor/Apex/commons.ts#L108) | `_findConvertKeys` | `target: unknown` | 実装 |
| [124](../src/analyzer/processor/Apex/commons.ts#L124) | `findConvertKeys` | `target: unknown` | 実装 |
| [131](../src/analyzer/processor/Apex/commons.ts#L131) | `_findJson` | `target: unknown` | 実装 |
| [178](../src/analyzer/processor/Apex/commons.ts#L178) | `findJson` | `target: unknown` | 実装 |
| [197](../src/analyzer/processor/Apex/commons.ts#L197) | `_matchedObjectJson` | `target: unknown` | 実装 |
| [232](../src/analyzer/processor/Apex/commons.ts#L232) | `matchedObjectJson` | `target: unknown` | 実装 |

### [src/analyzer/processor/Apex/diff/query/soqlFunction.ts](../src/analyzer/processor/Apex/diff/query/soqlFunction.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [51](../src/analyzer/processor/Apex/diff/query/soqlFunction.ts#L51) | `isStringArray` | `value: unknown` | 実装 |
| [54](../src/analyzer/processor/Apex/diff/query/soqlFunction.ts#L54) | `isDateFieldName` | `value: unknown` | 実装 |
| [62](../src/analyzer/processor/Apex/diff/query/soqlFunction.ts#L62) | `isDistanceValue` | `value: unknown` | 実装 |
| [70](../src/analyzer/processor/Apex/diff/query/soqlFunction.ts#L70) | `isNestedFunction` | `value: unknown` | 実装 |

### [src/analyzer/processor/Apex/diff/statement.ts](../src/analyzer/processor/Apex/diff/statement.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [304](../src/analyzer/processor/Apex/diff/statement.ts#L304) | `BlockDiffer.(function type)` | `before: unknown[]; after: unknown[]` | 型・宣言 |
| [369](../src/analyzer/processor/Apex/diff/statement.ts#L369) | `makeGumTreeBlockDiff` | `before: unknown[]; after: unknown[]` | 実装 |

### [src/analyzer/processor/Apex/walker.ts](../src/analyzer/processor/Apex/walker.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [72](../src/analyzer/processor/Apex/walker.ts#L72) | `isRecord` | `value: unknown` | 実装 |
| [75](../src/analyzer/processor/Apex/walker.ts#L75) | `str` | `value: unknown` | 実装 |
| [76](../src/analyzer/processor/Apex/walker.ts#L76) | `bool` | `value: unknown` | 実装 |
| [143](../src/analyzer/processor/Apex/walker.ts#L143) | `apexCustomTypeName` | `customType: unknown` | 実装 |
| [150](../src/analyzer/processor/Apex/walker.ts#L150) | `apexElementTypeOf` | `type: unknown` | 実装 |
| [162](../src/analyzer/processor/Apex/walker.ts#L162) | `apexCustomTypesOf` | `type: unknown` | 実装 |
| [179](../src/analyzer/processor/Apex/walker.ts#L179) | `apexIdentifierOf` | `value: unknown` | 実装 |
| [182](../src/analyzer/processor/Apex/walker.ts#L182) | `apexThisOf` | `value: unknown` | 実装 |
| [185](../src/analyzer/processor/Apex/walker.ts#L185) | `apexSuperOf` | `value: unknown` | 実装 |
| [189](../src/analyzer/processor/Apex/walker.ts#L189) | `apexStringLiteralOf` | `value: unknown` | 実装 |
| [192](../src/analyzer/processor/Apex/walker.ts#L192) | `apexIntegerLiteralOf` | `value: unknown` | 実装 |
| [195](../src/analyzer/processor/Apex/walker.ts#L195) | `apexLongLiteralOf` | `value: unknown` | 実装 |
| [198](../src/analyzer/processor/Apex/walker.ts#L198) | `apexDecimalLiteralOf` | `value: unknown` | 実装 |
| [201](../src/analyzer/processor/Apex/walker.ts#L201) | `apexBooleanLiteralOf` | `value: unknown` | 実装 |
| [204](../src/analyzer/processor/Apex/walker.ts#L204) | `apexNullLiteralOf` | `value: unknown` | 実装 |
| [207](../src/analyzer/processor/Apex/walker.ts#L207) | `apexElementLiteralOf` | `value: unknown` | 実装 |
| [209](../src/analyzer/processor/Apex/walker.ts#L209) | `literalOfs (function type)` | `value: unknown` | 型・宣言 |
| [227](../src/analyzer/processor/Apex/walker.ts#L227) | `apexDottedNameOf` | `value: unknown` | 実装 |
| [269](../src/analyzer/processor/Apex/walker.ts#L269) | `declare` | `name: unknown; type: unknown` | 実装 |
| [373](../src/analyzer/processor/Apex/walker.ts#L373) | `walkApexJson` | `root: unknown` | 実装 |
| [378](../src/analyzer/processor/Apex/walker.ts#L378) | `walk` | `value: unknown` | 実装 |

## src/analyzer/processor/commons

### [src/analyzer/processor/commons/diff/change.ts](../src/analyzer/processor/commons/diff/change.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [4](../src/analyzer/processor/commons/diff/change.ts#L4) | `hasChange` | `diff: unknown` | 実装 |

### [src/analyzer/processor/commons/diff/commons.ts](../src/analyzer/processor/commons/diff/commons.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [62](../src/analyzer/processor/commons/diff/commons.ts#L62) | `isNode` | `value: unknown` | 実装 |
| [66](../src/analyzer/processor/commons/diff/commons.ts#L66) | `getValueKey` | `value: unknown` | 実装 |
| [111](../src/analyzer/processor/commons/diff/commons.ts#L111) | `isSameValue` | `before: unknown; after: unknown` | 実装 |

### [src/analyzer/processor/commons/diff/gumtree/tree.ts](../src/analyzer/processor/commons/diff/gumtree/tree.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [58](../src/analyzer/processor/commons/diff/gumtree/tree.ts#L58) | `GumTreeLanguage.groupProperty (function type)` | `value: unknown` | 型・宣言 |
| [66](../src/analyzer/processor/commons/diff/gumtree/tree.ts#L66) | `GumTreeLanguage.fieldValues (function type)` | `value: unknown` | 型・宣言 |
| [73](../src/analyzer/processor/commons/diff/gumtree/tree.ts#L73) | `isPrimitive` | `value: unknown` | 実装 |
| [76](../src/analyzer/processor/commons/diff/gumtree/tree.ts#L76) | `isRecord` | `value: unknown` | 実装 |
| [79](../src/analyzer/processor/commons/diff/gumtree/tree.ts#L79) | `isJsonNode` | `value: unknown` | 実装 |
| [82](../src/analyzer/processor/commons/diff/gumtree/tree.ts#L82) | `isValueLike` | `value: unknown` | 実装 |
| [160](../src/analyzer/processor/commons/diff/gumtree/tree.ts#L160) | `makeBlockNode` | `value: unknown` | 実装 |
| [170](../src/analyzer/processor/commons/diff/gumtree/tree.ts#L170) | `makeTreeNode` | `value: unknown` | 実装 |
| [217](../src/analyzer/processor/commons/diff/gumtree/tree.ts#L217) | `makeBlockTree` | `statements: unknown[]` | 実装 |

### [src/analyzer/processor/commons/diff/present.ts](../src/analyzer/processor/commons/diff/present.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [39](../src/analyzer/processor/commons/diff/present.ts#L39) | `splitItem` | `item: unknown` | 実装 |

### [src/analyzer/processor/commons/diff/typed.ts](../src/analyzer/processor/commons/diff/typed.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [18](../src/analyzer/processor/commons/diff/typed.ts#L18) | `TypedDiffBuilder.(function type)` | `before: unknown[]; after: unknown[]` | 型・宣言 |
| [41](../src/analyzer/processor/commons/diff/typed.ts#L41) | `getSourceKeyFromKeys` | `keys: unknown` | 実装 |
| [44](../src/analyzer/processor/commons/diff/typed.ts#L44) | `getSourceKey` | `value: unknown` | 実装 |
| [47](../src/analyzer/processor/commons/diff/typed.ts#L47) | `collectSourceNodes` | `value: unknown` | 実装 |
| [58](../src/analyzer/processor/commons/diff/typed.ts#L58) | `makeTypedDiffContext` | `before: unknown[]; after: unknown[]` | 実装 |
| [93](../src/analyzer/processor/commons/diff/typed.ts#L93) | `isDiffNode` | `value: unknown` | 実装 |
| [100](../src/analyzer/processor/commons/diff/typed.ts#L100) | `isObject` | `value: unknown` | 実装 |

## src/analyzer/processor/dependency

### [src/analyzer/processor/dependency/apex.ts](../src/analyzer/processor/dependency/apex.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [41](../src/analyzer/processor/dependency/apex.ts#L41) | `isRecord` | `value: unknown` | 実装 |
| [54](../src/analyzer/processor/dependency/apex.ts#L54) | `str` | `value: unknown` | 実装 |
| [57](../src/analyzer/processor/dependency/apex.ts#L57) | `fieldOfPath` | `field: unknown` | 実装 |
| [95](../src/analyzer/processor/dependency/apex.ts#L95) | `soqlLiteralOf` | `value: unknown` | 実装 |
| [101](../src/analyzer/processor/dependency/apex.ts#L101) | `isNoNamespace` | `value: unknown` | 実装 |
| [108](../src/analyzer/processor/dependency/apex.ts#L108) | `namespacedNameArg` | `args: unknown[]` | 実装 |
| [123](../src/analyzer/processor/dependency/apex.ts#L123) | `walkQuery` | `node: unknown` | 実装 |
| [137](../src/analyzer/processor/dependency/apex.ts#L137) | `queryFieldRefs (function type)` | `field: unknown` | 型・宣言 |
| [191](../src/analyzer/processor/dependency/apex.ts#L191) | `typeRefs` | `type: unknown` | 実装 |
| [520](../src/analyzer/processor/dependency/apex.ts#L520) | `eventTypeOf` | `arg: unknown` | 実装 |

### [src/analyzer/processor/dependency/formula.ts](../src/analyzer/processor/dependency/formula.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [78](../src/analyzer/processor/dependency/formula.ts#L78) | `isNodeRecord` | `value: unknown` | 実装 |
| [82](../src/analyzer/processor/dependency/formula.ts#L82) | `namesOf` | `node: unknown` | 実装 |

### [src/analyzer/processor/dependency/units.ts](../src/analyzer/processor/dependency/units.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [29](../src/analyzer/processor/dependency/units.ts#L29) | `isRecord` | `value: unknown` | 実装 |
| [32](../src/analyzer/processor/dependency/units.ts#L32) | `keysOf` | `node: unknown` | 実装 |
| [35](../src/analyzer/processor/dependency/units.ts#L35) | `str` | `value: unknown` | 実装 |
| [63](../src/analyzer/processor/dependency/units.ts#L63) | `formulaOf` | `value: unknown` | 実装 |
| [67](../src/analyzer/processor/dependency/units.ts#L67) | `formulaReferences` | `formula: unknown` | 実装 |
| [101](../src/analyzer/processor/dependency/units.ts#L101) | `def` | `node?: unknown` | 実装 |
| [495](../src/analyzer/processor/dependency/units.ts#L495) | `walk` | `node: unknown` | 実装 |
| [748](../src/analyzer/processor/dependency/units.ts#L748) | `getUnitDependencies` | `result: unknown` | 実装 |

## src/analyzer/processor/Lwc

### [src/analyzer/processor/Lwc/analysis.ts](../src/analyzer/processor/Lwc/analysis.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [127](../src/analyzer/processor/Lwc/analysis.ts#L127) | `lwcWireReactiveParamsOf` | `value: unknown` | 実装 |

### [src/analyzer/processor/Lwc/calls.ts](../src/analyzer/processor/Lwc/calls.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [237](../src/analyzer/processor/Lwc/calls.ts#L237) | `referencesOf` | `node: unknown` | 実装 |
| [255](../src/analyzer/processor/Lwc/calls.ts#L255) | `lwcImportReferencesOf` | `node: unknown` | 実装 |
| [319](../src/analyzer/processor/Lwc/calls.ts#L319) | `promiseUsesIn` | `roots: unknown[]` | 実装 |
| [321](../src/analyzer/processor/Lwc/calls.ts#L321) | `useOf` | `node: unknown` | 実装 |
| [374](../src/analyzer/processor/Lwc/calls.ts#L374) | `analyzeLwcCallsIn` | `roots: unknown[]` | 実装 |

### [src/analyzer/processor/Lwc/diff/body.ts](../src/analyzer/processor/Lwc/diff/body.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [67](../src/analyzer/processor/Lwc/diff/body.ts#L67) | `isRecord` | `value: unknown` | 実装 |
| [70](../src/analyzer/processor/Lwc/diff/body.ts#L70) | `isNode` | `value: unknown` | 実装 |
| [77](../src/analyzer/processor/Lwc/diff/body.ts#L77) | `isSameShape` | `before: unknown; after: unknown` | 実装 |
| [119](../src/analyzer/processor/Lwc/diff/body.ts#L119) | `makeValueDiffOf` | `before: unknown; after: unknown` | 実装 |

### [src/analyzer/processor/Lwc/diff/template.ts](../src/analyzer/processor/Lwc/diff/template.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [44](../src/analyzer/processor/Lwc/diff/template.ts#L44) | `isAttributeValue` | `value: unknown` | 実装 |

### [src/analyzer/processor/Lwc/walker.ts](../src/analyzer/processor/Lwc/walker.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [122](../src/analyzer/processor/Lwc/walker.ts#L122) | `isRecord` | `value: unknown` | 実装 |
| [162](../src/analyzer/processor/Lwc/walker.ts#L162) | `walkLwcJson` | `root: unknown` | 実装 |
| [167](../src/analyzer/processor/Lwc/walker.ts#L167) | `walk` | `value: unknown` | 実装 |
| [178](../src/analyzer/processor/Lwc/walker.ts#L178) | `walk (function type)` | `node: unknown` | 型・宣言 |

## src/analyzer/processor/Metadata

### [src/analyzer/processor/Metadata/flowRefs.ts](../src/analyzer/processor/Metadata/flowRefs.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [59](../src/analyzer/processor/Metadata/flowRefs.ts#L59) | `isRecord` | `value: unknown` | 実装 |
| [62](../src/analyzer/processor/Metadata/flowRefs.ts#L62) | `str` | `value: unknown` | 実装 |
| [65](../src/analyzer/processor/Metadata/flowRefs.ts#L65) | `rows` | `json: unknown` | 実装 |
| [143](../src/analyzer/processor/Metadata/flowRefs.ts#L143) | `namesIn` | `node: unknown` | 実装 |
| [148](../src/analyzer/processor/Metadata/flowRefs.ts#L148) | `scan` | `node: unknown` | 実装 |

### [src/analyzer/processor/Metadata/labelAnalysis.ts](../src/analyzer/processor/Metadata/labelAnalysis.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [23](../src/analyzer/processor/Metadata/labelAnalysis.ts#L23) | `isRecord` | `value: unknown` | 実装 |
| [27](../src/analyzer/processor/Metadata/labelAnalysis.ts#L27) | `walkJsonNodes` | `value: unknown` | 実装 |

### [src/analyzer/processor/Metadata/markup.ts](../src/analyzer/processor/Metadata/markup.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [10](../src/analyzer/processor/Metadata/markup.ts#L10) | `markupTagsOf` | `body: unknown` | 実装 |
| [27](../src/analyzer/processor/Metadata/markup.ts#L27) | `mergeTextsOf` | `tree: unknown` | 実装 |

### [src/analyzer/processor/Metadata/refs.ts](../src/analyzer/processor/Metadata/refs.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [51](../src/analyzer/processor/Metadata/refs.ts#L51) | `isRecord` | `value: unknown` | 実装 |
| [53](../src/analyzer/processor/Metadata/refs.ts#L53) | `str` | `value: unknown` | 実装 |
| [108](../src/analyzer/processor/Metadata/refs.ts#L108) | `declarationTexts` | `declarations: unknown` | 実装 |
| [140](../src/analyzer/processor/Metadata/refs.ts#L140) | `principalRefs` | `tree: unknown` | 実装 |
| [157](../src/analyzer/processor/Metadata/refs.ts#L157) | `criteriaFieldRefs` | `tree: unknown` | 実装 |
| [300](../src/analyzer/processor/Metadata/refs.ts#L300) | `approverRefs` | `tree: unknown` | 実装 |

### [src/analyzer/processor/Metadata/walker.ts](../src/analyzer/processor/Metadata/walker.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [62](../src/analyzer/processor/Metadata/walker.ts#L62) | `isRecord` | `value: unknown` | 実装 |
| [65](../src/analyzer/processor/Metadata/walker.ts#L65) | `str` | `value: unknown` | 実装 |
| [142](../src/analyzer/processor/Metadata/walker.ts#L142) | `walkMetadataJson` | `value: unknown` | 実装 |
| [169](../src/analyzer/processor/Metadata/walker.ts#L169) | `metadataValuesOf` | `tree: unknown` | 実装 |
| [180](../src/analyzer/processor/Metadata/walker.ts#L180) | `metadataRecordsOf` | `tree: unknown` | 実装 |

## src/analyzer/report/apexFlow.ts

### [src/analyzer/report/apexFlow.ts](../src/analyzer/report/apexFlow.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [51](../src/analyzer/report/apexFlow.ts#L51) | `contains` | `value: unknown` | 実装 |

## src/analyzer/report/commons.ts

### [src/analyzer/report/commons.ts](../src/analyzer/report/commons.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [87](../src/analyzer/report/commons.ts#L87) | `sameNode` | `before: unknown; after: unknown` | 実装 |
| [88](../src/analyzer/report/commons.ts#L88) | `keyOf` | `value: unknown` | 実装 |

## src/analyzer/report/index.ts

### [src/analyzer/report/index.ts](../src/analyzer/report/index.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [43](../src/analyzer/report/index.ts#L43) | `runReportProvider` | `args?: unknown` | 実装 |
| [50](../src/analyzer/report/index.ts#L50) | `provider (function type)` | `args?: unknown` | 型・宣言 |

## src/analyzer/report/lwc.ts

### [src/analyzer/report/lwc.ts](../src/analyzer/report/lwc.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [89](../src/analyzer/report/lwc.ts#L89) | `keysOf` | `keys: unknown` | 実装 |

## src/analyzer/report/lwcEventFlow.ts

### [src/analyzer/report/lwcEventFlow.ts](../src/analyzer/report/lwcEventFlow.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [26](../src/analyzer/report/lwcEventFlow.ts#L26) | `isRecord` | `value: unknown` | 実装 |
| [39](../src/analyzer/report/lwcEventFlow.ts#L39) | `nodesOfKind` | `value: unknown` | 実装 |
| [52](../src/analyzer/report/lwcEventFlow.ts#L52) | `thisCallsIn` | `content: unknown` | 実装 |
| [63](../src/analyzer/report/lwcEventFlow.ts#L63) | `thisReferencesIn` | `value: unknown` | 実装 |
| [70](../src/analyzer/report/lwcEventFlow.ts#L70) | `literal` | `value: unknown` | 実装 |

## src/analyzer/report/mask.ts

### [src/analyzer/report/mask.ts](../src/analyzer/report/mask.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [28](../src/analyzer/report/mask.ts#L28) | `maskValue` | `value: unknown` | 実装 |
| [48](../src/analyzer/report/mask.ts#L48) | `walk` | `value: unknown` | 実装 |
| [73](../src/analyzer/report/mask.ts#L73) | `maskContexts` | `value: unknown` | 実装 |

## src/analyzer/report/members.ts

### [src/analyzer/report/members.ts](../src/analyzer/report/members.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [16](../src/analyzer/report/members.ts#L16) | `record` | `value: unknown` | 実装 |
| [21](../src/analyzer/report/members.ts#L21) | `text` | `value: unknown` | 実装 |
| [27](../src/analyzer/report/members.ts#L27) | `detailsOf` | `value: unknown` | 実装 |

## src/analyzer/report/metadata.ts

### [src/analyzer/report/metadata.ts](../src/analyzer/report/metadata.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [36](../src/analyzer/report/metadata.ts#L36) | `record` | `value: unknown` | 実装 |
| [41](../src/analyzer/report/metadata.ts#L41) | `text` | `value: unknown` | 実装 |
| [136](../src/analyzer/report/metadata.ts#L136) | `leafOf` | `value: unknown` | 実装 |
| [172](../src/analyzer/report/metadata.ts#L172) | `isLeafArray` | `value: unknown[]` | 実装 |
| [175](../src/analyzer/report/metadata.ts#L175) | `itemName` | `item: unknown` | 実装 |
| [185](../src/analyzer/report/metadata.ts#L185) | `propertiesOf` | `value: unknown` | 実装 |

## src/analyzer/report/registry.ts

### [src/analyzer/report/registry.ts](../src/analyzer/report/registry.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [747](../src/analyzer/report/registry.ts#L747) | `(anonymous)` | `args?: unknown` | 実装 |

## src/analyzer/types/apex

### [src/analyzer/types/apex/commons/source.ts](../src/analyzer/types/apex/commons/source.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [11](../src/analyzer/types/apex/commons/source.ts#L11) | `isConvertKeys` | `value: unknown` | 実装 |
| [17](../src/analyzer/types/apex/commons/source.ts#L17) | `_gatherSourceKeys` | `target: unknown` | 実装 |
| [52](../src/analyzer/types/apex/commons/source.ts#L52) | `gatherSourceKeys` | `target: unknown` | 実装 |
| [58](../src/analyzer/types/apex/commons/source.ts#L58) | `regenerateSourceObjects` | `target: unknown` | 実装 |

### [src/analyzer/types/apex/expression.ts](../src/analyzer/types/apex/expression.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [445](../src/analyzer/types/apex/expression.ts#L445) | `isExpressionJson` | `value: unknown` | 実装 |

### [src/analyzer/types/apex/query/commons.ts](../src/analyzer/types/apex/query/commons.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [245](../src/analyzer/types/apex/query/commons.ts#L245) | `isLogicalConditionJson` | `value: unknown` | 実装 |

## src/analyzer/types/commons

### [src/analyzer/types/commons/ir.ts](../src/analyzer/types/commons/ir.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [8](../src/analyzer/types/commons/ir.ts#L8) | `hash` | `value: unknown` | 実装 |
| [10](../src/analyzer/types/commons/ir.ts#L10) | `(anonymous)` | `v: unknown` | 実装 |
| [22](../src/analyzer/types/commons/ir.ts#L22) | `keyBodyJson` | `value: unknown` | 実装 |
| [51](../src/analyzer/types/commons/ir.ts#L51) | `isRecord` | `value: unknown` | 実装 |
| [158](../src/analyzer/types/commons/ir.ts#L158) | `CommonTypeClass.findChildren.(function type)` | `target: unknown` | 型・宣言 |
| [162](../src/analyzer/types/commons/ir.ts#L162) | `CommonTypeClass.findChildren.find` | `target: unknown` | 実装 |

### [src/analyzer/types/commons/json.ts](../src/analyzer/types/commons/json.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [11](../src/analyzer/types/commons/json.ts#L11) | `isRecord` | `value: unknown` | 実装 |
| [14](../src/analyzer/types/commons/json.ts#L14) | `isConvertKeys` | `value: unknown` | 実装 |
| [18](../src/analyzer/types/commons/json.ts#L18) | `isJsonType` | `target: unknown` | 実装 |
| [21](../src/analyzer/types/commons/json.ts#L21) | `isSpecificJsonType` | `target: unknown` | 実装 |
| [37](../src/analyzer/types/commons/json.ts#L37) | `isStructureJsonType` | `target: unknown` | 実装 |

### [src/analyzer/types/commons/spanJson.ts](../src/analyzer/types/commons/spanJson.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [73](../src/analyzer/types/commons/spanJson.ts#L73) | `stripSourceKeys` | `value: unknown` | 実装 |

### [src/analyzer/types/commons/utils.ts](../src/analyzer/types/commons/utils.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [3](../src/analyzer/types/commons/utils.ts#L3) | `isRecord` | `value: unknown` | 実装 |
| [10](../src/analyzer/types/commons/utils.ts#L10) | `hash` | `value: unknown` | 実装 |
| [15](../src/analyzer/types/commons/utils.ts#L15) | `sortKeys` | `value: unknown` | 実装 |

## src/analyzer/types/lwc

### [src/analyzer/types/lwc/commons.ts](../src/analyzer/types/lwc/commons.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [15](../src/analyzer/types/lwc/commons.ts#L15) | `isLwcNode` | `value: unknown` | 実装 |

## src/analyzer/types/metadata

### [src/analyzer/types/metadata/criteria.ts](../src/analyzer/types/metadata/criteria.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [239](../src/analyzer/types/metadata/criteria.ts#L239) | `formulaNameOf` | `value: unknown` | 実装 |
| [249](../src/analyzer/types/metadata/criteria.ts#L249) | `criterionFieldsOf` | `criterion: unknown` | 実装 |

### [src/analyzer/types/metadata/formula.ts](../src/analyzer/types/metadata/formula.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [84](../src/analyzer/types/metadata/formula.ts#L84) | `isFxJson` | `value: unknown` | 実装 |
| [581](../src/analyzer/types/metadata/formula.ts#L581) | `templateMergesOf` | `value: unknown` | 実装 |
| [612](../src/analyzer/types/metadata/formula.ts#L612) | `text` | `child: unknown` | 実装 |

## src/analyzer/unit/processor.ts

### [src/analyzer/unit/processor.ts](../src/analyzer/unit/processor.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [76](../src/analyzer/unit/processor.ts#L76) | `objectsOf` | `results: readonly unknown[]` | 実装 |
| [81](../src/analyzer/unit/processor.ts#L81) | `translationsOf` | `results: readonly unknown[]` | 実装 |
| [86](../src/analyzer/unit/processor.ts#L86) | `objectInfosOf` | `results: readonly unknown[]` | 実装 |

## src/analyzer/unit/storeTree.ts

### [src/analyzer/unit/storeTree.ts](../src/analyzer/unit/storeTree.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [64](../src/analyzer/unit/storeTree.ts#L64) | `isRecord` | `value: unknown` | 実装 |
| [67](../src/analyzer/unit/storeTree.ts#L67) | `isNode` | `value: unknown` | 実装 |
| [73](../src/analyzer/unit/storeTree.ts#L73) | `flattenUnit` | `data: unknown` | 実装 |
| [79](../src/analyzer/unit/storeTree.ts#L79) | `flatten` | `value: unknown` | 実装 |
| [194](../src/analyzer/unit/storeTree.ts#L194) | `build` | `value: unknown` | 実装 |

## src/analyzer/unit/storeWriter.ts

### [src/analyzer/unit/storeWriter.ts](../src/analyzer/unit/storeWriter.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [100](../src/analyzer/unit/storeWriter.ts#L100) | `(anonymous)` | `e: unknown` | 実装 |

## src/analyzer/worker/unitWorker.ts

### [src/analyzer/worker/unitWorker.ts](../src/analyzer/worker/unitWorker.ts)

| 行 | 関数・シグネチャ | 対象の引数 | 種別 |
| --- | --- | --- | --- |
| [125](../src/analyzer/worker/unitWorker.ts#L125) | `UnitWorker.batch.(anonymous)` | `e: unknown` | 実装 |

