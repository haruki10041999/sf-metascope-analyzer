# Diff の結果

`run-diff.ts` が出力する。unchanged 以外の差分だけを並べる。

## AccountService.cls

- ファイル: **changed**（dataType: "cls"）

- **changed** class (slot): L6 `classAccountServiceextendsBaseServiceimplementsSchedulable{publicstati…` → L6 `classAccountServiceextendsBaseServiceimplementsSchedulable,Queueable{p…`
    - **added** type: L6 `Queueable`
    - **changed** field (key): L8 `IntegerMAX_SIZE=100;` → L8 `IntegerMAX_SIZE=200;`
        - **changed** variants (key)
            - **changed** literal (recovery)
    - **changed** field (key): L10 `Stringname='default';` → L10 `Stringname='default';`
        - **removed** modifier PRIVATE: L10 `private`
        - **added** modifier PROTECTED: L10 `protected`
    - **removed** field: L12 `Integerfirst=1,second=2;`
    - **changed** initializer (slot)
        - **changed** expression (recovery): L17 `counter=0;` → L17 `counter=1;`
            - **changed** formula (recovery)
                - **changed** literal (recovery)
    - **changed** property (key): L24 `Stringlabel{get;set;}` → L24 `Stringlabel{get;privateset;}`
        - **added** modifier PRIVATE: L24 `private`
    - **changed** property (key): L26 `Integertotal{get{returntotal;}privateset{total=value;}}` → L26 `Integertotal{get{returntotal==null?0:total;}privateset{total=value;}}`
        - **changed** return (recovery): L27 `returntotal;` → L27 `returntotal==null?0:total;`
            - **removed** field: "total"
            - **added** ternary: {"condition":{"left":"total","operator":"==","right":{"value":"null","…
    - **changed** enum (key): L31 `enumStatus{ACTIVE,INACTIVE,DELETED}` → L31 `enumStatus{ACTIVE,PENDING,INACTIVE,DELETED}`
        - **added** enumConstant PENDING: L31 `PENDING`
    - **changed** interface (key): L33 `interfaceHandler{voidhandle(Accountacc);Integercount();}` → L33 `interfaceHandler{voidhandle(Accountacc);Longcount();voidreset();}`
        - **changed** interfaceMethod (key): L35 `Integercount();` → L35 `Longcount();`
            - **changed** type (slot): L35 `Integer` → L35 `Long`
                - **changed** primitiveType: "Integer" → "Long"
        - **added** interfaceMethod reset: L36 `voidreset();`
    - **changed** class (key): L38 `classWrapper{publicAccountrecord;publicWrapper(Accountrecord){this.rec…` → L39 `classWrapper{publicAccountrecord;publicBooleanselected=false;publicWra…`
        - **added** field: L41 `Booleanselected=false;`
    - **changed** constructor (key): L46 `AccountService(){this('default');}` → L48 `AccountService(){this('anonymous');}`
        - **changed** expression (recovery): L47 `this('default');` → L49 `this('anonymous');`
            - **changed** memberAccess:method (recovery): L47 `this('default')` → L49 `this('anonymous')`
                - **changed** memberAccess:method.memberArg (recovery)
                    - **changed** literal (recovery)
    - **changed** method (key): L55 `voidsync(Set<Id>ids){List<Account>accounts=[SELECTId,NameFROMAccountWH…` → L57 `voidsync(Set<Id>ids){List<Account>accounts=[SELECTName,IdFROMAccountWH…`
        - **changed** localVariable (similar): L56 `List<Account>accounts=[SELECTId,NameFROMAccountWHEREIdIN:idsORDERBYNam…` → L58 `List<Account>accounts=[SELECTName,IdFROMAccountWHEREIdIN:idsORDERBYNam…`
            - **changed** localVariableDeclaration (similar)
                - **changed** localVariableDeclaration.variants (similar)
                    - **changed** variant (similar)
                        - **changed** soql (similar): L56 `SELECTId,NameFROMAccountWHEREIdIN:idsORDERBYNameASCLIMIT100` → L58 `SELECTName,IdFROMAccountWHEREIdIN:idsORDERBYNameASCLIMIT200`
                            - **changed** soql.select (recovery)
                                - **changed** soql.select.field (recovery)
                            - **changed** limitClause:literal (recovery): L56 `LIMIT100` → L58 `LIMIT200`
        - **changed** modifier Future (key): L54 `@Future(callout=true)` → L56 `@Future(callout=false)`
            - **changed** callout: {"key":"callout","value":"true","valueType":"boolean"} → {"key":"callout","value":"false","valueType":"boolean"}
    - **changed** method (key): L63 `Integercalc(Integera,Integerb){Integerresult=a+b;if(result>MAX_SIZE){r…` → L65 `Integercalc(Integera,Integerb){Integerresult=a+b;if(result>=MAX_SIZE){…`
        - **changed** if (similar): L65 `if(result>MAX_SIZE){result=MAX_SIZE;}elseif(result<0){result=0;}` → L67 `if(result>=MAX_SIZE){result=MAX_SIZE;}elseif(result<0){result=0;}`
            - **changed** if.conditionBlock (similar)
                - **changed** if.branch (similar)
                    - **changed** ifCondition (recovery): L65 `(result>MAX_SIZE)` → L67 `(result>=MAX_SIZE)`
                        - **changed** formula (recovery)
                            - **changed** operator: ">" → ">="
    - **changed** method (key): L73 `voidprocess(List<Account>accounts){Integeri=0;while(i<accounts.size())…` → L79 `voidprocess(List<Account>accounts){Integeri=0;while(i<=accounts.size()…`
        - **changed** while (similar): L75 `while(i<accounts.size()){i++;}` → L81 `while(i<=accounts.size()){i++;}`
            - **changed** whileCondition (recovery): L75 `(i<accounts.size())` → L81 `(i<=accounts.size())`
                - **changed** formula (recovery)
                    - **changed** operator: "<" → "<="
        - **changed** doWhile (similar): L78 `do{i--;}while(i>0);` → L84 `do{i--;}while(i>=0);`
            - **changed** doWhileCondition (recovery): L80 `(i>0)` → L86 `(i>=0)`
                - **changed** formula (recovery)
                    - **changed** operator: ">" → ">="
        - **changed** for (similar): L81 `for(Integerj=0;j<10;j++){log(j);}` → L87 `for(Integerj=0;j<10;j+=2){log(j);}`
            - **changed** forCondition:basic (similar): L81 `Integerj=0;j<10;j++` → L87 `Integerj=0;j<10;j+=2`
                - **changed** forCondition:basic.update (recovery)
                    - **removed** unary: {"variant":"j","operator":"++","operatorLocation":"back"}
                    - **added** formula: {"left":"j","operator":"+=","right":{"value":"2","valueType":"integer"…
        - **changed** try (similar): L84 `try{insertaccounts;}catch(DmlExceptione){log(e.getMessage());}finally{…` → L90 `try{insertasuseraccounts;}catch(DmlExceptione){log('done');log(e.getMe…`
            - **changed** try.block (similar)
                - **changed** try.try (recovery)
                    - **changed** block (recovery)
                        - **changed** insert (recovery): L85 `insertaccounts;` → L91 `insertasuseraccounts;`
                            - **added** accessLevel: "USER"
                - **changed** try.catch (similar)
                    - **changed** catchCondition (recovery): L86 `catch(DmlExceptione){log(e.getMessage());}` → L92 `catch(DmlExceptione){log('done');log(e.getMessage());}`
                    - **changed** block (similar)
                        - **moved** expression (identical): L89 `log('done');` → L93 `log('done');` ⟵ 移動元 block[0]
                - **removed** try.finally: L89 `log('done');`
    - **changed** method (key): L93 `Stringdescribe(Statuss){switchons{whenACTIVE{return'active';}whenelse{…` → L98 `Stringdescribe(Statuss){switchons{whenACTIVE,PENDING{return'active';}w…`
        - **changed** switch (recovery): L94 `switchons{whenACTIVE{return'active';}whenelse{return'other';}}` → L99 `switchons{whenACTIVE,PENDING{return'active';}whenINACTIVE,DELETED{retu…`
            - **changed** switch.block (recovery)
                - **changed** switch.when (recovery)
                    - **changed** switchCondition (recovery): L95 `ACTIVE` → L100 `ACTIVE,PENDING`
                        - **changed** switchCondition.condition (recovery)
                            - **added** literal: {"value":["PENDING"],"valueType":"id"}
                - **added** switch.when: L103 `INACTIVE,DELETED`
    - **changed** method (key): L104 `voidsearch(Stringkey){List<List<SObject>>found=[FIND:keyINALLFIELDSRET…` → L112 `voidsearch(Stringkey){List<List<SObject>>found=[FIND:keyINALLFIELDSRET…`
        - **changed** localVariable (recovery): L105 `List<List<SObject>>found=[FIND:keyINALLFIELDSRETURNINGAccount(Id,Name)…` → L113 `List<List<SObject>>found=[FIND:keyINALLFIELDSRETURNINGAccount(Id,Name,…`
            - **changed** localVariableDeclaration (recovery)
                - **changed** localVariableDeclaration.variants (recovery)
                    - **changed** variant (recovery)
                        - **changed** sosl (recovery): L105 `[FIND:keyINALLFIELDSRETURNINGAccount(Id,Name),Contact]` → L113 `[FIND:keyINALLFIELDSRETURNINGAccount(Id,Name,Phone),Contact,Lead]`
                            - **changed** sosl.fieldSpec (recovery)
                                - **changed** sosl.fieldSpec (recovery)
                                    - **changed** sosl.fieldSpec.field (recovery)
                                        - **added** soslField: L113 `Phone`
                                - **added** sosl.fieldSpec: {"object":["Lead"]}
        - **changed** runAs (similar): L106 `System.runAs(newUser(Id=UserInfo.getUserId())){delete[SELECTIdFROMCont…` → L114 `System.runAs(newUser(Id=UserInfo.getUserId())){delete[SELECTIdFROMCont…`
            - **changed** block (similar)
                - **changed** delete (similar): L107 `delete[SELECTIdFROMContactWHERELastName='x'];` → L115 `delete[SELECTIdFROMContactWHERELastName='y'];`
                    - **changed** soql (similar): L107 `SELECTIdFROMContactWHERELastName='x'` → L115 `SELECTIdFROMContactWHERELastName='y'`
                        - **changed** soql.where (recovery)
                            - **changed** soql.where.condition (recovery)
                                - **changed** soql.where.condition.condition (recovery)
                                    - **changed** singleCondition (recovery): L107 `LastName='x'` → L115 `LastName='y'`
                                        - **changed** singleCondition.value (recovery)
        - **changed** upsert (similar): L109 `upsertnewAccount(Name=key)Account.Id;` → L117 `upsertnewAccount(Name=key)Account.External__c;`
            - **changed** key: ["Account","Id"] → ["Account","External__c"]
        - **changed** throw (recovery): L112 `thrownewServiceException('not supported');` → L120 `thrownewServiceException('unsupported operation');`
            - **changed** new:class (recovery)
                - **changed** new:class.arg (recovery)
                    - **changed** literal (recovery)
    - **changed** method (key): L115 `List<AggregateResult>stats(){return[SELECTName,COUNT(Id)cnt,(SELECTIdF…` → L123 `List<AggregateResult>stats(){return[SELECTCOUNT(Id)cnt,Name,(SELECTId,…`
        - **changed** return (similar): L116 `return[SELECTName,COUNT(Id)cnt,(SELECTIdFROMContacts)FROMAccountaUSING…` → L124 `return[SELECTCOUNT(Id)cnt,Name,(SELECTId,NameFROMContacts)FROMAccounta…`
            - **changed** soql (similar): L117 `SELECTName,COUNT(Id)cnt,(SELECTIdFROMContacts)FROMAccountaUSINGSCOPEmi…` → L125 `SELECTCOUNT(Id)cnt,Name,(SELECTId,NameFROMContacts)FROMAccountaccUSING…`
                - **changed** soql.select (similar)
                    - **changed** soql.select.field (similar)
                        - **changed** subQuery (recovery): L117 `SELECTIdFROMContacts` → L125 `SELECTId,NameFROMContacts`
                            - **changed** subQuery.select (recovery)
                                - **changed** subQuery.select.field (recovery)
                                    - **added** selectEntry: L125 `Name`
                - **changed** soql.from (recovery)
                    - **changed** soql.from.field (recovery)
                        - **changed** fromField (recovery): L118 `Account` → L126 `Account`
                            - **changed** alias: "a" → "acc"
                - **changed** soql.where (similar)
                    - **changed** soql.where.condition (similar)
                        - **changed** soql.where.condition.condition (similar)
                            - **changed** soql.where.condition.condition (similar)
                                - **changed** soql.where.condition.condition.condition (similar)
                            - **changed** soql.where.condition.condition (recovery)
                                - **changed** soql.where.condition.condition.condition (recovery)
                                    - **changed** singleCondition (recovery): L120 `Rating='Hot'` → L128 `Rating='Warm'`
                                        - **changed** singleCondition.value (recovery)
                - **changed** forClause (recovery): L127 `FORVIEW` → L135 `FORREFERENCE`
                - **changed** usingScopeClause (recovery): L119 `USINGSCOPEmine` → L127 `USINGSCOPEteam`
                - **changed** soql.with (recovery)
                    - **changed** soql.with.selection (recovery)
                        - **changed** categoryCondition (recovery): L121 `Geography__cAT(usa__c)` → L129 `Geography__cBELOW(usa__c)`
                            - **changed** selector: "AT" → "BELOW"
                - **changed** groupBy (similar): L122 `GROUPBYROLLUP(Name)HAVINGCOUNT(Id)>1` → L130 `GROUPBYCUBE(Name)HAVINGCOUNT(Id)>2`
                    - **changed** mode: "ROLLUP" → "CUBE"
                    - **changed** groupBy.having (similar)
                        - **changed** groupBy.having.condition (similar)
                            - **changed** singleCondition (similar): L123 `COUNT(Id)>1` → L131 `COUNT(Id)>2`
                                - **changed** literal (recovery)
                - **changed** soql.orderBy (recovery)
                    - **changed** soql.orderBy.orderBy (recovery)
                        - **changed** orderField (recovery): L124 `NameDESCNULLSLAST` → L132 `NameASCNULLSFIRST`
                            - **changed** direction: "DESC" → "ASC"
                            - **changed** nulls: "LAST" → "FIRST"
                - **changed** limitClause:literal (recovery): L125 `LIMIT10` → L133 `LIMIT20`
                - **changed** offsetClause:literal (recovery): L126 `OFFSET5` → L134 `OFFSET10`
    - **changed** method (key): L131 `Objectexpressions(Objectvalue,List<Integer>numbers){Integerx=(Integer)…` → L139 `Objectexpressions(Objectvalue,List<Integer>numbers){Integerx=(Long)val…`
        - **changed** localVariable (recovery): L132 `Integerx=(Integer)value;` → L140 `Integerx=(Long)value;`
            - **changed** localVariableDeclaration (recovery)
                - **changed** localVariableDeclaration.variants (recovery)
                    - **changed** variant (recovery)
                        - **changed** cast (recovery)
                            - **changed** type (recovery): L132 `Integer` → L140 `Long`
                                - **changed** type: "{\"type\":\"primitive\",\"primitiveType\":\"Integer\"}" → "{\"type\":\"primitive\",\"primitiveType\":\"Long\"}"
        - **changed** localVariable (recovery): L133 `BooleanisText=valueinstanceofString;` → L141 `BooleanisText=valueinstanceofId;`
            - **changed** localVariableDeclaration (recovery)
                - **changed** localVariableDeclaration.variants (recovery)
                    - **changed** variant (recovery)
                        - **changed** instanceof (recovery)
                            - **changed** type (recovery): L133 `String` → L141 `Id`
                                - **changed** type: "{\"type\":\"primitive\",\"primitiveType\":\"String\"}" → "{\"type\":\"primitive\",\"primitiveType\":\"Id\"}"
        - **changed** localVariable (recovery): L134 `Integery=-numbers[0]+(x*2);` → L142 `Integery=+numbers[1]-(x*3);`
            - **changed** localVariableDeclaration (recovery)
                - **changed** localVariableDeclaration.variants (recovery)
                    - **changed** variant (recovery)
                        - **changed** formula (recovery)
                            - **changed** operator: "+" → "-"
                            - **changed** unary (recovery)
                                - **changed** operator: "-" → "+"
                                - **changed** arrayAccess (recovery)
                                    - **changed** literal (recovery)
                            - **changed** paren (recovery)
                                - **changed** formula (recovery)
                                    - **changed** literal (recovery)
        - **changed** localVariable (recovery): L135 `Integerz=isText?x:y;` → L143 `Integerz=isText?y:x;`
            - **changed** localVariableDeclaration (recovery)
                - **changed** localVariableDeclaration.variants (recovery)
                    - **changed** variant (recovery)
                        - **changed** ternary (recovery)
                            - **changed** trueValue: "x" → "y"
                            - **changed** falseValue: "y" → "x"
        - **changed** localVariable (recovery): L136 `Map<String,Integer>counts=newMap<String,Integer>{'a'=>1};` → L144 `Map<String,Integer>counts=newMap<String,Integer>{'a'=>2};`
            - **changed** localVariableDeclaration (recovery)
                - **changed** localVariableDeclaration.variants (recovery)
                    - **changed** variant (recovery)
                        - **changed** new:map (recovery)
                            - **changed** new:map.init (recovery)
                                - **changed** new:map.init (recovery)
                                    - **changed** literal (recovery)
        - **changed** localVariable (recovery): L137 `Set<String>keys=newSet<String>{'a','b'};` → L145 `Set<String>keys=newSet<String>{'b','a'};`
            - **changed** localVariableDeclaration (recovery)
                - **changed** localVariableDeclaration.variants (recovery)
                    - **changed** variant (recovery)
                        - **changed** new:list || set (recovery)
                            - **changed** new:list || set.init (recovery)
                                - **moved** literal (recovery) ⟵ 移動元 new:list || set.init[0]
        - **changed** localVariable (recovery): L138 `Integer[]matrix=newInteger[3];` → L146 `Integer[]matrix=newInteger[4];`
            - **changed** localVariableDeclaration (recovery)
                - **changed** localVariableDeclaration.variants (recovery)
                    - **changed** variant (recovery)
                        - **changed** new:array (recovery)
                            - **changed** literal (recovery)
        - **changed** localVariable (recovery): L139 `List<Account>rows=[SELECTIdFROMAccountALLROWS];` → L147 `List<Account>rows=[SELECTNameFROMAccountALLROWS];`
            - **changed** localVariableDeclaration (recovery)
                - **changed** localVariableDeclaration.variants (recovery)
                    - **changed** variant (recovery)
                        - **changed** soql (recovery): L139 `SELECTIdFROMAccountALLROWS` → L147 `SELECTNameFROMAccountALLROWS`
                            - **changed** soql.select (recovery)
                                - **changed** soql.select.field (recovery)
                                    - **changed** selectEntry (recovery): L139 `Id` → L147 `Name`
                                        - **changed** field: ["Id"] → ["Name"]
        - **changed** localVariable (similar): L140 `List<Account>locked=[SELECTIdFROMAccountLIMIT:xFORUPDATE];` → L148 `List<Account>locked=[SELECTIdFROMAccountLIMIT:yFORUPDATE];`
            - **changed** localVariableDeclaration (similar)
                - **changed** localVariableDeclaration.variants (similar)
                    - **changed** variant (similar)
                        - **changed** soql (similar): L140 `SELECTIdFROMAccountLIMIT:xFORUPDATE` → L148 `SELECTIdFROMAccountLIMIT:yFORUPDATE`
                            - **changed** limitClause:bind (recovery): L140 `LIMIT:x` → L148 `LIMIT:y`
        - **changed** localVariable (similar): L141 `List<Account>tracked=[SELECTIdFROMAccountUPDATETRACKING];` → L149 `List<Account>tracked=[SELECTIdFROMAccountUPDATEVIEWSTAT];`
            - **changed** localVariableDeclaration (similar)
                - **changed** localVariableDeclaration.variants (similar)
                    - **changed** variant (similar)
                        - **changed** soql (similar): L141 `SELECTIdFROMAccountUPDATETRACKING` → L149 `SELECTIdFROMAccountUPDATEVIEWSTAT`
                            - **changed** updateClause (recovery): L141 `TRACKING` → L149 `VIEWSTAT`
        - **changed** return (recovery): L142 `returnz;` → L150 `returnx;`
            - **changed** field: "z" → "x"
    - **removed** method loop: L145 `voidloop(){for(Integerk=0;k<3;k++){if(k==1){continue;}if(k==2){break;}…`
    - **added** field: L12 `Integerfirst=1,second=3,third;`
    - **added** method calc: L75 `Decimalcalc(Decimala,Decimalb){returna+b;}`
    - **added** method report: L153 `voidreport(){System.debug(LoggingLevel.INFO,'report');}`
    - **removed** modifier WITH_SHARING: L6 `withsharing`
    - **changed** modifier RestResource (key): L5 `@RestResource(urlMapping='/accounts/*')` → L5 `@RestResource(urlMapping='/v2/accounts/*')`
        - **changed** urlMapping: {"key":"urlMapping","value":"'/accounts/_'","valueType":"string"} → {"key":"urlMapping","value":"'/v2/accounts/_'","valueType":"string"}
    - **added** modifier WITHOUT_SHARING: L6 `withoutsharing`

## AccountTrigger.trigger

- ファイル: **changed**（dataType: "trigger"）

- **removed** triggerCase: L1 `beforeinsert`
- **added** triggerCase: L1 `beforedelete`
- **added** statement: L2 `System.debug('start');`
- **changed** statement (similar)
    - **changed** if (similar): L2 `if(Trigger.isBefore){AccountService.validate(Trigger.new);}` → L3 `if(Trigger.isBefore&&Trigger.isInsert){AccountService.validate(Trigger…`
        - **changed** if.conditionBlock (similar)
            - **changed** if.branch (similar)
                - **changed** ifCondition (recovery): L2 `(Trigger.isBefore)` → L3 `(Trigger.isBefore&&Trigger.isInsert)`
                    - **added** formula: L3 `Trigger.isBefore`
                        - **moved** memberAccess:object (identical): L2 `Trigger.isBefore` → L3 `Trigger.isBefore` ⟵ 移動元 ifCondition[0]
                        - **added** memberAccess:object: L3 `Trigger.isInsert`

## Broken.cls

- ファイル: **changed**（dataType: "cls"）
- 構文エラー: 解消 0 件 / 発生 2 件

- **changed** class (slot): L1 `classBroken{publicvoidrun(){Integerx=1;foo(1,2);b();}}` → L1 `classBroken{publicvoidrun(){Integerx=;foo(1,);b();}}`
    - **changed** method (key): L2 `voidrun(){Integerx=1;foo(1,2);b();}` → L2 `voidrun(){Integerx=;foo(1,);b();}`
        - **removed** localVariable: L3 `Integerx=1;`
        - **removed** expression: L4 `foo(1,2);`
        - **added** error:localVariable: L3 `Integerx=;foo(1,);`

## Level.cls

- ファイル: **changed**（dataType: "cls"）

- **changed** enum (slot): L1 `enumLevel{LOW,HIGH}` → L1 `enumLevel{LOW,MEDIUM,HIGH}`
    - **added** enumConstant MEDIUM: L3 `MEDIUM`

## OldHelper.cls

- ファイル: **removed**（dataType: "cls"）

## Shape.cls

- ファイル: **changed**（dataType: "cls"）

- **changed** interface → class (slot): {"name":"Shape","block":[{"kind":"interfaceMethod","sourceKeys":{"base… → {"name":"Shape","block":[{"kind":"method","sourceKeys":{"base":{"objec…

## Unchanged.cls

- ファイル: **unchanged**（dataType: "cls"）

（中身の差分なし）

## script.apex

- ファイル: **changed**（dataType: "anonymous"）

- **changed** field (key): L1 `IntegerlimitSize=10;` → L1 `IntegerlimitSize=20;`
    - **changed** variants (key)
        - **changed** literal (recovery)
- **changed** method (key): L3 `voidhelper(Integern){System.debug(n);}` → L3 `voidhelper(Integern){System.debug(LoggingLevel.WARN,n);}`
    - **changed** expression (recovery): L4 `System.debug(n);` → L4 `System.debug(LoggingLevel.WARN,n);`
        - **changed** memberAccess:method (recovery): L4 `System.debug(n)` → L4 `System.debug(LoggingLevel.WARN,n)`
            - **changed** memberAccess:method.memberArg (recovery)
                - **added** memberAccess:object: L4 `LoggingLevel.WARN`
- **moved** statement (identical) ⟵ 移動元 block[2]
- **changed** statement (recovery)
    - **changed** for (recovery): L7 `for(Integerk=0;k<3;k++){if(k==1){continue;}if(k==2){break;}}` → L8 `for(Integerk=0;k<5;k++){if(k==1){System.debug('skip');continue;}if(k>=…`
        - **changed** forCondition:basic (similar): L7 `Integerk=0;k<3;k++` → L8 `Integerk=0;k<5;k++`
            - **changed** formula (recovery)
                - **changed** literal (recovery)
        - **changed** block (recovery)
            - **changed** if (recovery): L8 `if(k==1){continue;}` → L9 `if(k==1){System.debug('skip');continue;}`
                - **changed** if.conditionBlock (recovery)
                    - **changed** if.branch (recovery)
                        - **changed** block (recovery)
                            - **added** expression: L10 `System.debug('skip');`
            - **changed** if (recovery): L11 `if(k==2){break;}` → L13 `if(k>=2){System.debug('stop');break;}`
                - **changed** if.conditionBlock (recovery)
                    - **changed** if.branch (recovery)
                        - **changed** ifCondition (recovery): L11 `(k==2)` → L13 `(k>=2)`
                            - **changed** formula (recovery)
                                - **changed** operator: "==" → ">="
                        - **changed** block (recovery)
                            - **added** expression: L14 `System.debug('stop');`

## NewHelper.cls

- ファイル: **added**（dataType: "cls"）
