# LWC Diff の結果 (before → after)

`npx ttsx --noCheck docs/examples/lwc-diff/run-diff.ts` で生成。unchanged 以外の差分だけを並べる。

## accountList (changed)

- dataType: `"lwcBundle"`
- `accountList.resolvedError[0]`: **added** {"phase":"bundle","code":"TEMPLATE_UNKNOWN_MEMBER","level":"warning","contextType":"isTable","context":"<template lwc...
- `accountList.content`: **changed**
- `accountList.content.modules[accountList.ts]`: **changed** match=key
- `accountList.content.modules[accountList.ts].module`: **changed**
- `accountList.content.modules[accountList.ts].module.imports[@salesforce/label/c.AccountListTitle]` (lwcImport): **removed** {"source":"@salesforce/label/c.AccountListTitle","category":"label","specifiers":[{"kind":"lwcImportSpecifier","speci...
- `accountList.content.modules[accountList.ts].module.imports[@salesforce/apex/AccountController.updateAccount]` (lwcImport): **added** {"source":"@salesforce/apex/AccountController.updateAccount","category":"apex","specifiers":[{"kind":"lwcImportSpecif...
- `accountList.content.modules[accountList.ts].module.component` (lwcComponent): **changed** match=slot
- `accountList.content.modules[accountList.ts].module.component.block[title]` (lwcField): **changed** match=key
- `accountList.content.modules[accountList.ts].module.component.block[title].init`: **changed** "TITLE_LABEL" → "'Accounts'"
- `accountList.content.modules[accountList.ts].module.component.block[title].references[TITLE_LABEL]`: **removed** {"local":"TITLE_LABEL","source":"@salesforce/label/c.AccountListTitle"}
- `accountList.content.modules[accountList.ts].module.component.block[maxRows]` (lwcField): **changed** match=key
- `accountList.content.modules[accountList.ts].module.component.block[maxRows].init`: **changed** "10" → "20"
- `accountList.content.modules[accountList.ts].module.component.block[wiredAccounts]` (lwcMethod): **changed** match=key
- `accountList.content.modules[accountList.ts].module.component.block[wiredAccounts].modifier`: **changed**
- `accountList.content.modules[accountList.ts].module.component.block[wiredAccounts].modifier.decorator[wire]` (lwcDecorator): **changed** match=key
- `accountList.content.modules[accountList.ts].module.component.block[wiredAccounts].modifier.decorator[wire].arg[1]`: **changed** match=slot "{ parentId: '$recordId', limitSize: '$maxRows' }" → "{ parentId: '$recordId', limitSize: '$maxRows', industry: '$industry' }"
- `accountList.content.modules[accountList.ts].module.component.block[wiredAccounts].modifier.decorator[wire].wire`: **changed**
- `accountList.content.modules[accountList.ts].module.component.block[wiredAccounts].modifier.decorator[wire].wire.config[industry]` (lwcWireConfig): **added** {"key":"industry","value":"'$industry'","reactive":"industry","references":[]}
- `accountList.content.modules[accountList.ts].module.component.block[isTable]` (lwcProperty): **removed** {"name":"isTable","isGetter":true,"isSetter":false,"getterContent":{"modifier":{},"body":{"kind":"lwcBody","statement...
- `accountList.content.modules[accountList.ts].module.component.block[handleSelect]` (lwcMethod): **changed** match=key
- `accountList.content.modules[accountList.ts].module.component.block[handleSelect].body` (lwcBody): **changed** match=slot
- `accountList.content.modules[accountList.ts].module.component.block[handleSelect].calls[0]` (lwcCall): **changed** match=nearest
- `accountList.content.modules[accountList.ts].module.component.block[handleSelect].calls[0].arg[0]`: **changed** match=slot "new CustomEvent<SelectDetail>('accountselect', {\n                detail: { recordId, index },\n                bubb... → "new CustomEvent<SelectDetail>('accountselect', {\n                detail: { recordId, index },\n                bubb...
- `accountList.content.modules[accountList.ts].module.component.block[handleSelect].events[accountselect]` (lwcEvent): **changed** match=nearest
- `accountList.content.modules[accountList.ts].module.component.block[handleSelect].events[accountselect].composed`: **changed** false → true
- `accountList.content.modules[accountList.ts].module.component.block[industry]` (lwcField): **added** {"name":"industry","variantType":{"kind":"lwcType","text":"string","type":"primitive","primitiveType":"string"},"refe...
- `accountList.content.modules[accountList.ts].module.component.block[handleSave]` (lwcMethod): **added** {"name":"handleSave","returnType":{"kind":"lwcType","text":"Promise<void>","type":"custom","customType":"Promise","ge...
- `accountList.content.templates[accountList.html]`: **changed** match=key
- `accountList.content.templates[accountList.html].template` (lwcTemplate): **changed** match=slot
- `accountList.content.templates[accountList.html].template.children[lightning-card]` (element:lightning-card): **changed** match=similar
- `accountList.content.templates[accountList.html].template.children[lightning-card].children[0]` (block): **changed** match=similar
- `accountList.content.templates[accountList.html].template.children[lightning-card].children[0].children[lightning-button]` (element:lightning-button): **changed** match=recovery
- `accountList.content.templates[accountList.html].template.children[lightning-card].children[0].children[lightning-button].label`: **changed** "更新" → "再読み込み"
- `accountList.content.templates[accountList.html].template.children[lightning-card].children[0].children[lightning-button].variant`: **added** "brand"
- `accountList.content.templates[accountList.html].template.children[lightning-card].children[0].children[lightning-button]` (element:lightning-button): **added** {"tag":"lightning-button","elementType":"component","component":{"namespace":"lightning","name":"button","module":"li...
- `accountList.content.templates[accountList.html].template.children[lightning-card].children[0].children[2]` (lwcIf): **added** {"branches":[{"kind":"lwcBranch","directive":"lwc:if","condition":{"type":"expression","expression":{"text":"parentNa...
- `accountList.content.templates[accountList.html].template.children[lightning-card].children[0].children[2].children[0]` (lwcIf.branches): **added** [{"kind":"lwcBranch","directive":"lwc:if","condition":{"type":"expression","expression":{"text":"parentName","path":[...
- `accountList.content.templates[accountList.html].template.children[lightning-card].children[0].children[2].children[0].children[0]` (lwcBranch): **added** {"directive":"lwc:if","condition":{"type":"expression","expression":{"text":"parentName","path":["parentName"],"local...
- `accountList.content.templates[accountList.html].template.children[lightning-card].children[0].children[2].children[0].children[0].children[0]` (block): **added** [{"kind":"lwcElement","tag":"p","elementType":"html","attributes":[{"kind":"lwcAttribute","name":"class","value":{"ty...
- `accountList.content.templates[accountList.html].template.children[lightning-card].children[0].children[2].children[0].children[0].children[0].children[p]` (element:p): **moved** match=identical {"tag":"p","elementType":"html","attributes":[{"kind":"lwcAttribute","name":"class","value":{"type":"static","value":...
- `accountList.content.templates[accountList.html].template.children[lightning-card].children[0].children[3]` (lwcIf): **changed** match=similar
- `accountList.content.templates[accountList.html].template.children[lightning-card].children[0].children[3].children[0]` (lwcIf.branches): **changed** match=similar
- `accountList.content.templates[accountList.html].template.children[lightning-card].children[0].children[3].children[0].children[2]` (lwcBranch): **changed** match=recovery
- `accountList.content.templates[accountList.html].template.children[lightning-card].children[0].children[3].children[0].children[2].children[0]` (block): **changed** match=recovery
- `accountList.content.templates[accountList.html].template.children[lightning-card].children[0].children[3].children[0].children[2].children[0].children[p]` (element:p): **changed** match=recovery
- `accountList.content.templates[accountList.html].template.children[lightning-card].children[0].children[3].children[0].children[2].children[0].children[p].children[0]` (block): **changed** match=recovery
- `accountList.content.templates[accountList.html].template.children[lightning-card].children[0].children[3].children[0].children[2].children[0].children[p].children[0].children[該当する取引先がありません]` (lwcText): **changed** match=recovery
- `accountList.content.templates[accountList.html].template.children[lightning-card].children[0].children[3].children[0].children[2].children[0].children[p].children[0].children[該当する取引先がありません].text`: **changed** "取引先がありません" → "該当する取引先がありません"
- `accountList.content.templates[accountList.html].template.children[lightning-card].children[0].children[div]` (element:div): **removed** {"tag":"div","elementType":"html","attributes":[{"kind":"lwcAttribute","name":"class","value":{"type":"static","value...
- `accountList.content.stylesheets[accountList.css]`: **changed** match=key
- `accountList.content.stylesheets[accountList.css].stylesheet` (lwcStylesheet): **changed** match=slot
- `accountList.content.stylesheets[accountList.css].stylesheet.rules[0]` (cssRule): **changed** match=nearest
- `accountList.content.stylesheets[accountList.css].stylesheet.rules[0].declarations[1]`: **changed** match=key {"prop":"--account-list-gap","value":"0.5rem","important":false,"defines":"--account-list-gap"} → {"prop":"--account-list-gap","value":"0.75rem","important":false,"defines":"--account-list-gap"}
- `accountList.content.stylesheets[accountList.css].stylesheet.rules[1]` (cssRule): **changed** match=nearest
- `accountList.content.stylesheets[accountList.css].stylesheet.rules[1].selector`: **changed** ".parent, .total" → ".parent, .total, .summary"
- `accountList.content.stylesheets[accountList.css].stylesheet.rules[1].selectors[2]`: **added** ".summary"
- `accountList.content.stylesheets[accountList.css].stylesheet.rules[2]` (cssRule): **changed** match=nearest
- `accountList.content.stylesheets[accountList.css].stylesheet.rules[2].declarations[1]`: **changed** match=key {"prop":"border-bottom","value":"1px solid var(--slds-g-color-border-base-1, #c9c9c9)","important":true,"uses":["--sl... → {"prop":"border-bottom","value":"1px solid var(--slds-g-color-border-base-1, #c9c9c9)","important":false,"uses":["--s...
- `accountList.content.stylesheets[accountList.css].stylesheet.rules[3]` (cssRule): **added** {"selector":".tile:hover","selectors":[".tile:hover"],"declarations":[{"prop":"background","value":"var(--slds-g-colo...
- `accountList.content.stylesheets[accountList.css].stylesheet.rules[media]` (cssAtRule): **changed** match=nearest
- `accountList.content.stylesheets[accountList.css].stylesheet.rules[media].params`: **changed** "(max-width: 480px)" → "(max-width: 600px)"
- `accountList.content.meta` (lwcBundleMeta): **changed** match=slot
- `accountList.content.meta.apiVersion`: **changed** "61.0" → "62.0"
- `accountList.content.meta.targets[2]`: **added** "lightning__HomePage"
- `accountList.content.meta.targetConfigs[0]` (lwcTargetConfig): **changed** match=key
- `accountList.content.meta.targetConfigs[0].properties[maxRows]` (lwcTargetProperty): **changed** match=key
- `accountList.content.meta.targetConfigs[0].properties[maxRows].default`: **changed** "10" → "20"
- `accountList.content.meta.targetConfigs[0].properties[maxRows].max`: **changed** 50 → 100
- `accountList.content.meta.targetConfigs[0].properties[industry]` (lwcTargetProperty): **added** {"name":"industry","type":"String","label":"業種"}
- `accountList.content.meta.capabilities`: **added** ["lightning__dynamicComponent"]

## accountRow (unchanged)

- dataType: `"lwcBundle"`

## broken (unchanged)

- dataType: `"lwcBundle"`

## newBanner (added)

- dataType: `{"after":"lwcBundle"}`

## oldBanner (removed)

- dataType: `{"before":"lwcBundle"}`

## utils (changed)

- dataType: `"lwcBundle"`
- `utils.resolvedError[0]`: **added** {"phase":"lwc","code":"TS_UNSUPPORTED","level":"error","contextType":"enum","errorMessage":"enum は型を空白にできないため、LWC の検証...
- `utils.content`: **changed**
- `utils.content.modules[utils.ts]`: **changed** match=key
- `utils.content.modules[utils.ts].module`: **changed**
- `utils.content.modules[utils.ts].module.declarations[toRows]` (lwcDeclaration): **changed** match=key
- `utils.content.modules[utils.ts].module.declarations[toRows].param[1]` (lwcParameter): **added** {"variant":"limit","variantType":{"kind":"lwcType","text":"number","type":"primitive","primitiveType":"number"},"opti...
- `utils.content.modules[utils.ts].module.declarations[toRows].body` (lwcBody): **changed** match=slot
- `utils.content.modules[utils.ts].module.typeDeclarations[SortDirection]` (lwcTypeDeclaration): **changed** match=key
- `utils.content.modules[utils.ts].module.typeDeclarations[SortDirection].variantType` (lwcType): **changed** {"text":"'asc' | 'desc'","type":"union","types":[{"type":"literal","value":"'asc'"},{"type":"literal","value":"'desc'... → {"text":"'asc' | 'desc' | 'none'","type":"union","types":[{"type":"literal","value":"'asc'"},{"type":"literal","value...
- `utils.content.modules[utils.ts].module.typeDeclarations[Row]` (lwcTypeDeclaration): **changed** match=key
- `utils.content.modules[utils.ts].module.typeDeclarations[Row].members[industry]`: **added** {"name":"industry","memberType":{"type":"primitive","primitiveType":"string"},"optional":true,"method":false}
- `utils.content.modules[utils.ts].module.typeDeclarations[ViewKind]` (lwcTypeDeclaration): **added** {"name":"ViewKind","exported":true,"declarationType":"enum","enumMembers":["Table","Tile"]}
