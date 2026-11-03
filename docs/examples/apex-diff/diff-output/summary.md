# Diff の結果

`run-diff.ts` が出力する。unchanged 以外の差分だけを並べる。

## AccountService.cls

- ファイル: **changed**（dataType: "cls"）

- **changed** class (slot): L6 `classAccountServiceextendsBaseServiceimplementsSchedulable{publicstati…` → L6 `classAccountServiceextendsBaseServiceimplementsSchedulable,Queueable{p…`
  - **added** type: L6 `Queueable`
  - **changed** field (key): L8 `IntegerMAX_SIZE=100;` → L8 `IntegerMAX_SIZE=200;`
    - **changed** variants (key)
      - **changed** init
        - **changed** value: "100" → "200"
  - **changed** field (key): L10 `Stringname='default';` → L10 `Stringname='default';`
    - **removed** modifier PRIVATE: L10 `private`
    - **added** modifier PROTECTED: L10 `protected`
  - **removed** field: L12 `Integerfirst=1,second=2;`
  - **changed** initializer (slot)
    - **changed** block (recovery)
      - **changed** expression (slot): L17 `counter=0;` → L17 `counter=1;`
        - **changed** value
          - **changed** right
            - **changed** value: "0" → "1"
  - **changed** property (key): L24 `Stringlabel{get;set;}` → L24 `Stringlabel{get;privateset;}`
    - **added** modifier PRIVATE: L24 `private`
  - **changed** property (key): L26 `Integertotal{get{returntotal;}privateset{total=value;}}` → L26 `Integertotal{get{returntotal==null?0:total;}privateset{total=value;}}`
    - **changed** block (recovery)
      - **changed** return (slot): L27 `returntotal;` → L27 `returntotal==null?0:total;`
        - **changed** field: "total" → {"condition":{"left":"total","operator":"==","right":{"value":"null","…
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
    - **changed** block (recovery)
      - **changed** expression (slot): L47 `this('default');` → L49 `this('anonymous');`
        - **changed** memberAccess (slot): L47 `this('default')` → L49 `this('anonymous')`
          - **changed** memberArg (slot)
            - **changed** value
              - **changed** value: "'default'" → "'anonymous'"
  - **changed** method (key): L55 `voidsync(Set<Id>ids){List<Account>accounts=[SELECTId,NameFROMAccountWH…` → L57 `voidsync(Set<Id>ids){List<Account>accounts=[SELECTName,IdFROMAccountWH…`
    - **changed** block (similar)
      - **changed** localVariable (slot): L56 `List<Account>accounts=[SELECTId,NameFROMAccountWHEREIdIN:idsORDERBYNam…` → L58 `List<Account>accounts=[SELECTName,IdFROMAccountWHEREIdIN:idsORDERBYNam…`
        - **changed** variable
          - **changed** variants (slot)
            - **changed** value
              - **changed** soql (slot): L56 `SELECTId,NameFROMAccountWHEREIdIN:idsORDERBYNameASCLIMIT100` → L58 `SELECTName,IdFROMAccountWHEREIdIN:idsORDERBYNameASCLIMIT200`
                - **changed** limitClause (slot): L56 `LIMIT100` → L58 `LIMIT200`
                  - **changed** value: "100" → "200"
    - **changed** modifier Future (key): L54 `@Future(callout=true)` → L56 `@Future(callout=false)`
      - **changed** callout: {"key":"callout","value":"true","valueType":"boolean"} → {"key":"callout","value":"false","valueType":"boolean"}
  - **changed** method (key): L63 `Integercalc(Integera,Integerb){Integerresult=a+b;if(result>MAX_SIZE){r…` → L65 `Integercalc(Integera,Integerb){Integerresult=a+b;if(result>=MAX_SIZE){…`
    - **changed** block (similar)
      - **changed** if (slot): L65 `if(result>MAX_SIZE){result=MAX_SIZE;}elseif(result<0){result=0;}` → L67 `if(result>=MAX_SIZE){result=MAX_SIZE;}elseif(result<0){result=0;}`
        - **changed** conditionBlock (slot)
          - **changed** value
            - **changed** ifCondition (slot): L65 `(result>MAX_SIZE)` → L67 `(result>=MAX_SIZE)`
              - **changed** condition
                - **changed** operator: ">" → ">="
  - **changed** method (key): L73 `voidprocess(List<Account>accounts){Integeri=0;while(i<accounts.size())…` → L79 `voidprocess(List<Account>accounts){Integeri=0;while(i<=accounts.size()…`
    - **changed** block (similar)
      - **changed** while (slot): L75 `while(i<accounts.size()){i++;}` → L81 `while(i<=accounts.size()){i++;}`
        - **changed** whileCondition (slot): L75 `(i<accounts.size())` → L81 `(i<=accounts.size())`
          - **changed** condition
            - **changed** operator: "<" → "<="
    - **changed** block (similar)
      - **changed** doWhile (slot): L78 `do{i--;}while(i>0);` → L84 `do{i--;}while(i>=0);`
        - **changed** doWhileCondition (slot): L80 `(i>0)` → L86 `(i>=0)`
          - **changed** condition
            - **changed** operator: ">" → ">="
    - **changed** block (similar)
      - **changed** for (slot): L81 `for(Integerj=0;j<10;j++){if(j==1){continue;}if(j==2){break;}log(j);}` → L87 `for(Integerj=0;j<10;j+=2){if(j==0){continue;}if(j==3){break;}log(j);}`
        - **changed** forCondition (slot): L81 `Integerj=0;j<10;j++` → L87 `Integerj=0;j<10;j+=2`
          - **changed** update (slot)
            - **changed** value: {"variant":"j","operator":"++","operatorLocation":"back"} → {"left":"j","operator":"+=","right":{"value":"2","valueType":"integer"…
        - **changed** block (recovery)
          - **changed** if (slot): L82 `if(j==1){continue;}` → L88 `if(j==0){continue;}`
            - **changed** conditionBlock (slot)
              - **changed** value
                - **changed** ifCondition (slot): L82 `(j==1)` → L88 `(j==0)`
                  - **changed** condition
                    - **changed** right
                      - **changed** value: "1" → "0"
        - **changed** block (recovery)
          - **changed** if (slot): L85 `if(j==2){break;}` → L91 `if(j==3){break;}`
            - **changed** conditionBlock (slot)
              - **changed** value
                - **changed** ifCondition (slot): L85 `(j==2)` → L91 `(j==3)`
                  - **changed** condition
                    - **changed** right
                      - **changed** value: "2" → "3"
    - **changed** block (similar)
      - **changed** try (slot): L90 `try{insertaccounts;}catch(DmlExceptione){log(e.getMessage());}finally{…` → L96 `try{insertasuseraccounts;}catch(DmlExceptione){log('done');log(e.getMe…`
        - **changed** block (slot)
          - **changed** value
            - **changed** block (recovery)
              - **changed** insert (slot): L91 `insertaccounts;` → L97 `insertasuseraccounts;`
                - **added** accessLevel: "USER"
        - **changed** block (slot)
          - **changed** value
            - **moved** block (identical) ⟵ 移動元 block[0]
            - **changed** catchCondition (slot): L92 `catch(DmlExceptione){log(e.getMessage());}` → L98 `catch(DmlExceptione){log('done');log(e.getMessage());}`
        - **removed** block: L95 `log('done');`
  - **changed** method (key): L99 `Stringdescribe(Statuss){switchons{whenACTIVE{return'active';}whenelse{…` → L104 `Stringdescribe(Statuss){switchons{whenACTIVE,PENDING{return'active';}w…`
    - **changed** block (similar)
      - **changed** switch (slot): L100 `switchons{whenACTIVE{return'active';}whenelse{return'other';}}` → L105 `switchons{whenACTIVE,PENDING{return'active';}whenINACTIVE,DELETED{retu…`
        - **changed** block (slot)
          - **changed** value
            - **changed** switchCondition (slot): L101 `ACTIVE` → L106 `ACTIVE,PENDING`
              - **added** condition: {"value":["PENDING"],"valueType":"id"}
        - **added** block: L109 `INACTIVE,DELETED`
  - **changed** method (key): L110 `voidsearch(Stringkey){List<List<SObject>>found=[FIND:keyINALLFIELDSRET…` → L118 `voidsearch(Stringkey){List<List<SObject>>found=[FIND:keyINALLFIELDSRET…`
    - **changed** block (similar)
      - **changed** localVariable (slot): L111 `List<List<SObject>>found=[FIND:keyINALLFIELDSRETURNINGAccount(Id,Name)…` → L119 `List<List<SObject>>found=[FIND:keyINALLFIELDSRETURNINGAccount(Id,Name,…`
        - **changed** variable
          - **changed** variants (slot)
            - **changed** value
              - **changed** sosl (slot): L111 `[FIND:keyINALLFIELDSRETURNINGAccount(Id,Name),Contact]` → L119 `[FIND:keyINALLFIELDSRETURNINGAccount(Id,Name,Phone),Contact,Lead]`
                - **changed** fieldSpec
                  - **changed** value
                    - **added** soslField: L119 `Phone`
                - **changed** fieldSpec
                - **added** fieldSpec: {"object":["Lead"]}
    - **changed** block (similar)
      - **changed** runAs (slot): L112 `System.runAs(newUser(Id=UserInfo.getUserId())){delete[SELECTIdFROMCont…` → L120 `System.runAs(newUser(Id=UserInfo.getUserId())){delete[SELECTIdFROMCont…`
        - **changed** block (similar)
          - **changed** delete (slot): L113 `delete[SELECTIdFROMContactWHERELastName='x'];` → L121 `delete[SELECTIdFROMContactWHERELastName='y'];`
            - **changed** soql (slot): L113 `SELECTIdFROMContactWHERELastName='x'` → L121 `SELECTIdFROMContactWHERELastName='y'`
              - **changed** condition
                - **removed** condition: L113 `LastName='x'`
                - **added** condition: L121 `LastName='y'`
    - **changed** block (similar)
      - **changed** upsert (slot): L115 `upsertnewAccount(Name=key)Account.Id;` → L123 `upsertnewAccount(Name=key)Account.External__c;`
        - **changed** field: {"collection":["Account"],"kind":"class","arg":[{"left":"Name","operat… → {"collection":["Account"],"kind":"class","arg":[{"left":"Name","operat…
        - **changed** key (slot)
          - **changed** value: "Id" → "External__c"
    - **changed** block (similar)
      - **changed** throw (slot): L118 `thrownewServiceException('not supported');` → L126 `thrownewServiceException('unsupported operation');`
        - **changed** value: {"collection":["ServiceException"],"kind":"class","arg":[{"value":"'no… → {"collection":["ServiceException"],"kind":"class","arg":[{"value":"'un…
  - **changed** method (key): L121 `List<AggregateResult>stats(){return[SELECTName,COUNT(Id)cnt,(SELECTIdF…` → L129 `List<AggregateResult>stats(){return[SELECTCOUNT(Id)cnt,Name,(SELECTIdF…`
    - **changed** block (similar)
      - **changed** return (slot): L122 `return[SELECTName,COUNT(Id)cnt,(SELECTIdFROMContacts)FROMAccountaUSING…` → L130 `return[SELECTCOUNT(Id)cnt,Name,(SELECTIdFROMContactsWHERELastName!=nul…`
        - **changed** soql (slot): L123 `SELECTName,COUNT(Id)cnt,(SELECTIdFROMContacts)FROMAccountaUSINGSCOPEmi…` → L131 `SELECTCOUNT(Id)cnt,Name,(SELECTIdFROMContactsWHERELastName!=null)FROMA…`
          - **changed** subQuery (key): L123 `SELECTIdFROMContacts` → L131 `SELECTIdFROMContactsWHERELastName!=null`
            - **added** where: L131 `LastName!=null`
          - **changed** condition
            - **removed** condition: L126 `NameLIKE'a%'`
            - **removed** condition: L126 `Rating='Hot'`
            - **added** condition: L134 `Industry='IT'`
            - **added** condition: L134 `Rating='Warm'`
          - **changed** forClause (slot): L133 `FORVIEW` → L141 `FORREFERENCE`
            - **removed** value: "VIEW"
            - **added** value: "REFERENCE"
          - **changed** usingScopeClause (slot): L125 `USINGSCOPEmine` → L133 `USINGSCOPEteam`
            - **changed** value: "mine" → "team"
          - **changed** with
            - **removed** categoryCondition: L127 `Geography__cAT(usa__c)`
            - **added** categoryCondition: L135 `Geography__cBELOW(usa__c)`
          - **changed** groupBy (slot): L128 `GROUPBYROLLUP(Name)HAVINGCOUNT(Id)>1` → L136 `GROUPBYCUBE(Name)HAVINGCOUNT(Id)>2`
            - **changed** mode: "ROLLUP" → "CUBE"
            - **changed** having
              - **removed** condition: L129 `COUNT(Id)>1`
              - **added** condition: L137 `COUNT(Id)>2`
          - **changed** orderField (slot): L130 `NameDESCNULLSLAST` → L138 `NameASCNULLSFIRST`
            - **changed** direction: "DESC" → "ASC"
            - **changed** nulls: "LAST" → "FIRST"
          - **changed** limitClause (slot): L131 `LIMIT10` → L139 `LIMIT20`
            - **changed** value: "10" → "20"
          - **changed** offsetClause (slot): L132 `OFFSET5` → L140 `OFFSET10`
            - **changed** value: "5" → "10"
  - **changed** method (key): L137 `Objectexpressions(Objectvalue,List<Integer>numbers){Integerx=(Integer)…` → L145 `Objectexpressions(Objectvalue,List<Integer>numbers){Integerx=(Long)val…`
    - **changed** block (recovery)
      - **changed** localVariable (slot): L138 `Integerx=(Integer)value;` → L146 `Integerx=(Long)value;`
        - **changed** variable
          - **changed** variants (slot)
            - **changed** value
              - **changed** init
                - **changed** type (slot): L138 `Integer` → L146 `Long`
                  - **changed** primitiveType: "Integer" → "Long"
    - **changed** block (recovery)
      - **changed** localVariable (slot): L139 `BooleanisText=valueinstanceofString;` → L147 `BooleanisText=valueinstanceofId;`
        - **changed** variable
          - **changed** variants (slot)
            - **changed** value
              - **changed** init
                - **changed** type (slot): L139 `String` → L147 `Id`
                  - **changed** primitiveType: "String" → "Id"
    - **changed** block (recovery)
      - **changed** localVariable (slot): L140 `Integery=-numbers[0]+(x*2);` → L148 `Integery=+numbers[1]-(x*3);`
        - **changed** variable
          - **changed** variants (slot)
            - **changed** value
              - **changed** init
                - **changed** left
                  - **changed** variant
                  - **changed** operator: "-" → "+"
                - **changed** operator: "+" → "-"
                - **changed** right
                  - **changed** value
                    - **changed** right
                      - **changed** value: "2" → "3"
    - **changed** block (recovery)
      - **changed** localVariable (slot): L141 `Integerz=isText?x:y;` → L149 `Integerz=isText?y:x;`
        - **changed** variable
          - **changed** variants (slot)
            - **changed** value
              - **changed** init
                - **changed** trueValue: "x" → "y"
                - **changed** falseValue: "y" → "x"
    - **changed** block (similar)
      - **changed** localVariable (slot): L142 `Map<String,Integer>counts=newMap<String,Integer>{'a'=>1};` → L150 `Map<String,Integer>counts=newMap<String,Integer>{'a'=>2};`
        - **changed** variable
          - **changed** variants (slot)
            - **changed** value
              - **changed** init: {"collection":["Map"],"generic":[{"kind":"type","sourceKeys":{"objectK… → {"collection":["Map"],"generic":[{"kind":"type","sourceKeys":{"objectK…
    - **changed** block (similar)
      - **changed** localVariable (slot): L143 `Set<String>keys=newSet<String>{'a','b'};` → L151 `Set<String>keys=newSet<String>{'b','a'};`
        - **changed** variable
          - **changed** variants (slot)
            - **changed** value
              - **changed** init: {"collection":["Set"],"generic":[{"kind":"type","sourceKeys":{"objectK… → {"collection":["Set"],"generic":[{"kind":"type","sourceKeys":{"objectK…
    - **changed** block (similar)
      - **changed** localVariable (slot): L144 `Integer[]matrix=newInteger[3];` → L152 `Integer[]matrix=newInteger[4];`
        - **changed** variable
          - **changed** variants (slot)
            - **changed** value
              - **changed** init: {"collection":["Integer"],"kind":"array","size":{"value":"3","valueTyp… → {"collection":["Integer"],"kind":"array","size":{"value":"4","valueTyp…
    - **changed** block (recovery)
      - **changed** localVariable (slot): L145 `List<Account>rows=[SELECTIdFROMAccountALLROWS];` → L153 `List<Account>rows=[SELECTNameFROMAccountALLROWS];`
        - **changed** variable
          - **changed** variants (slot)
            - **changed** value
              - **changed** soql (slot): L145 `SELECTIdFROMAccountALLROWS` → L153 `SELECTNameFROMAccountALLROWS`
                - **removed** selectEntry: L145 `Id`
                - **added** selectEntry: L153 `Name`
    - **changed** block (similar)
      - **changed** localVariable (slot): L146 `List<Account>locked=[SELECTIdFROMAccountLIMIT:xFORUPDATE];` → L154 `List<Account>locked=[SELECTIdFROMAccountLIMIT:yFORUPDATE];`
        - **changed** variable
          - **changed** variants (slot)
            - **changed** value
              - **changed** soql (slot): L146 `SELECTIdFROMAccountLIMIT:xFORUPDATE` → L154 `SELECTIdFROMAccountLIMIT:yFORUPDATE`
                - **changed** limitClause (slot): L146 `LIMIT:x` → L154 `LIMIT:y`
                  - **changed** value: "x" → "y"
    - **changed** block (similar)
      - **changed** localVariable (slot): L147 `List<Account>tracked=[SELECTIdFROMAccountUPDATETRACKING];` → L155 `List<Account>tracked=[SELECTIdFROMAccountUPDATEVIEWSTAT];`
        - **changed** variable
          - **changed** variants (slot)
            - **changed** value
              - **changed** soql (slot): L147 `SELECTIdFROMAccountUPDATETRACKING` → L155 `SELECTIdFROMAccountUPDATEVIEWSTAT`
                - **changed** updateClause (slot): L147 `TRACKING` → L155 `VIEWSTAT`
                  - **removed** value: "TRACKING"
                  - **added** value: "VIEWSTAT"
    - **changed** block (recovery)
      - **changed** return (slot): L148 `returnz;` → L156 `returnx;`
        - **changed** field: "z" → "x"
  - **removed** method loop: L151 `voidloop(){for(Integerk=0;k<3;k++){if(k==1){continue;}if(k==2){break;}…`
  - **added** field: L12 `Integerfirst=1,second=3,third;`
  - **added** method calc: L75 `Decimalcalc(Decimala,Decimalb){returna+b;}`
  - **added** method report: L159 `voidreport(){System.debug(LoggingLevel.INFO,'report');}`
  - **removed** modifier WITH_SHARING: L6 `withsharing`
  - **changed** modifier RestResource (key): L5 `@RestResource(urlMapping='/accounts/*')` → L5 `@RestResource(urlMapping='/v2/accounts/*')`
    - **changed** urlMapping: {"key":"urlMapping","value":"'/accounts/*'","valueType":"string"} → {"key":"urlMapping","value":"'/v2/accounts/*'","valueType":"string"}
  - **added** modifier WITHOUT_SHARING: L6 `withoutsharing`

## AccountTrigger.trigger

- ファイル: **changed**（dataType: "trigger"）

- **removed** triggerCase: L1 `beforeinsert`
- **added** triggerCase: L1 `beforedelete`
- **added** statement: L2 `System.debug('start');`
- **changed** statement (similar)
  - **changed** if (slot): L2 `if(Trigger.isBefore){AccountService.validate(Trigger.new);}` → L3 `if(Trigger.isBefore&&Trigger.isInsert){AccountService.validate(Trigger…`
    - **changed** conditionBlock (slot)
      - **changed** value
        - **changed** ifCondition (slot): L2 `(Trigger.isBefore)` → L3 `(Trigger.isBefore&&Trigger.isInsert)`
          - **changed** condition: {"kind":"memberAccess","sourceKeys":{"objectKey":"dotExpression_f51120… → {"left":{"kind":"memberAccess","sourceKeys":{"objectKey":"dotExpressio…

## Broken.cls

- ファイル: **changed**（dataType: "cls"）
- 構文エラー: 解消 0 件 / 発生 2 件

- **changed** class (slot): L1 `classBroken{publicvoidrun(){Integerx=1;foo(1,2);b();}}` → L1 `classBroken{publicvoidrun(){Integerx=;foo(1,);b();}}`
  - **changed** method (key): L2 `voidrun(){Integerx=1;foo(1,2);b();}` → L2 `voidrun(){Integerx=;foo(1,);b();}`
    - **removed** block: L3 `Integerx=1;`
    - **removed** block: L4 `foo(1,2);`
    - **added** block: L3 `Integerx=;foo(1,);`

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
    - **changed** init
      - **changed** value: "10" → "20"
- **changed** method (key): L3 `voidhelper(Integern){System.debug(n);}` → L3 `voidhelper(Integern){System.debug(LoggingLevel.WARN,n);}`
  - **changed** block (recovery)
    - **changed** expression (slot): L4 `System.debug(n);` → L4 `System.debug(LoggingLevel.WARN,n);`
      - **changed** memberAccess (slot): L4 `System.debug(n)` → L4 `System.debug(LoggingLevel.WARN,n)`
        - **added** memberArg: L4 `LoggingLevel.WARN`
- **moved** statement (identical) ⟵ 移動元 block[2]
- **changed** statement (recovery)
  - **changed** for (slot): L7 `for(Integerk=0;k<3;k++){if(k==1){continue;}if(k==2){break;}}` → L8 `for(Integerk=0;k<5;k++){if(k==1){System.debug('skip');continue;}if(k>=…`
    - **changed** forCondition (slot): L7 `Integerk=0;k<3;k++` → L8 `Integerk=0;k<5;k++`
      - **changed** condition
        - **changed** right
          - **changed** value: "3" → "5"
    - **changed** block (recovery)
      - **changed** if (slot): L8 `if(k==1){continue;}` → L9 `if(k==1){System.debug('skip');continue;}`
        - **changed** conditionBlock (slot)
          - **changed** value
            - **added** block: L10 `System.debug('skip');`
    - **changed** block (recovery)
      - **changed** if (slot): L11 `if(k==2){break;}` → L13 `if(k>=2){System.debug('stop');break;}`
        - **changed** conditionBlock (slot)
          - **changed** value
            - **changed** ifCondition (slot): L11 `(k==2)` → L13 `(k>=2)`
              - **changed** condition
                - **changed** operator: "==" → ">="
            - **added** block: L14 `System.debug('stop');`

## NewHelper.cls

- ファイル: **added**（dataType: "cls"）

