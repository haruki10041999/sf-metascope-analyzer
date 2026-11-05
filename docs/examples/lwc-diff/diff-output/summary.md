# LWC Diff の結果 (before → after)

`npx ttsx --noCheck docs/examples/lwc-diff/run-diff.ts` で生成。unchanged 以外の差分だけを並べる。

## accountList (changed)

- dataType: `"lwcBundle"`
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
