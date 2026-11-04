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
    - **changed** expression (recovery): L17 `counter=0;` → L17 `counter=1;`
      - **changed** value
        - **changed** right
          - **changed** value: "0" → "1"
  - **changed** property (key): L24 `Stringlabel{get;set;}` → L24 `Stringlabel{get;privateset;}`
    - **added** modifier PRIVATE: L24 `private`
  - **changed** property (key): L26 `Integertotal{get{returntotal;}privateset{total=value;}}` → L26 `Integertotal{get{returntotal==null?0:total;}privateset{total=value;}}`
    - **changed** return (recovery): L27 `returntotal;` → L27 `returntotal==null?0:total;`
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
    - **changed** expression (recovery): L47 `this('default');` → L49 `this('anonymous');`
      - **changed** memberAccess (slot): L47 `this('default')` → L49 `this('anonymous')`
        - **changed** memberArg (slot)
          - **changed** value: "'default'" → "'anonymous'"
  - **changed** method (key): L55 `voidsync(Set<Id>ids){List<Account>accounts=[SELECTId,NameFROMAccountWH…` → L57 `voidsync(Set<Id>ids){List<Account>accounts=[SELECTName,IdFROMAccountWH…`
    - **changed** localVariable (similar): L56 `List<Account>accounts=[SELECTId,NameFROMAccountWHEREIdIN:idsORDERBYNam…` → L58 `List<Account>accounts=[SELECTName,IdFROMAccountWHEREIdIN:idsORDERBYNam…`
      - **changed** variable
        - **changed** variants (key)
          - **changed** soql (slot): L56 `SELECTId,NameFROMAccountWHEREIdIN:idsORDERBYNameASCLIMIT100` → L58 `SELECTName,IdFROMAccountWHEREIdIN:idsORDERBYNameASCLIMIT200`
            - **changed** limitClause (slot): L56 `LIMIT100` → L58 `LIMIT200`
              - **changed** value: "100" → "200"
    - **changed** annotation Future (key): L54 `@Future(callout=true)` → L56 `@Future(callout=false)`
      - **changed** callout: {"key":"callout","value":"true","valueType":"boolean"} → {"key":"callout","value":"false","valueType":"boolean"}
  - **changed** method (key): L63 `Integercalc(Integera,Integerb){Integerresult=a+b;if(result>MAX_SIZE){r…` → L65 `Integercalc(Integera,Integerb){Integerresult=a+b;if(result>=MAX_SIZE){…`
    - **changed** if (similar): L65 `if(result>MAX_SIZE){result=MAX_SIZE;}elseif(result<0){result=0;}` → L67 `if(result>=MAX_SIZE){result=MAX_SIZE;}elseif(result<0){result=0;}`
      - **changed** conditionBlock (slot)
        - **changed** ifCondition (slot): L65 `(result>MAX_SIZE)` → L67 `(result>=MAX_SIZE)`
          - **changed** condition
            - **changed** operator: ">" → ">="
  - **changed** method (key): L73 `voidprocess(List<Account>accounts){Integeri=0;while(i<accounts.size())…` → L79 `voidprocess(List<Account>accounts){Integeri=0;while(i<=accounts.size()…`
    - **changed** while (similar): L75 `while(i<accounts.size()){i++;}` → L81 `while(i<=accounts.size()){i++;}`
      - **changed** whileCondition (slot): L75 `(i<accounts.size())` → L81 `(i<=accounts.size())`
        - **changed** condition
          - **changed** operator: "<" → "<="
    - **changed** doWhile (similar): L78 `do{i--;}while(i>0);` → L84 `do{i--;}while(i>=0);`
      - **changed** doWhileCondition (slot): L80 `(i>0)` → L86 `(i>=0)`
        - **changed** condition
          - **changed** operator: ">" → ">="
    - **changed** for (similar): L81 `for(Integerj=0;j<10;j++){if(j==1){continue;}if(j==2){break;}log(j);}` → L87 `for(Integerj=0;j<10;j+=2){if(j==0){continue;}if(j==3){break;}log(j);}`
      - **changed** forCondition (slot): L81 `Integerj=0;j<10;j++` → L87 `Integerj=0;j<10;j+=2`
        - **changed** update (slot): {"variant":"j","operator":"++","operatorLocation":"back"} → {"left":"j","operator":"+=","right":{"value":"2","valueType":"integer"…
      - **changed** if (recovery): L82 `if(j==1){continue;}` → L88 `if(j==0){continue;}`
        - **changed** conditionBlock (slot)
          - **changed** ifCondition (slot): L82 `(j==1)` → L88 `(j==0)`
            - **changed** condition
              - **changed** right
                - **changed** value: "1" → "0"
      - **changed** if (recovery): L85 `if(j==2){break;}` → L91 `if(j==3){break;}`
        - **changed** conditionBlock (slot)
          - **changed** ifCondition (slot): L85 `(j==2)` → L91 `(j==3)`
            - **changed** condition
              - **changed** right
                - **changed** value: "2" → "3"
    - **changed** try (similar): L90 `try{insertaccounts;}catch(DmlExceptione){log(e.getMessage());}finally{…` → L96 `try{insertasuseraccounts;}catch(DmlExceptione){log('done');log(e.getMe…`
      - **changed** block (slot)
        - **changed** insert (recovery): L91 `insertaccounts;` → L97 `insertasuseraccounts;`
          - **added** accessLevel: "USER"
      - **changed** block (slot)
        - **moved** expression (identical): L95 `log('done');` → L99 `log('done');` ⟵ 移動元 block[0]
        - **changed** catchCondition (slot): L92 `catch(DmlExceptione){log(e.getMessage());}` → L98 `catch(DmlExceptione){log('done');log(e.getMessage());}`
      - **removed** block: L95 `log('done');`
  - **changed** method (key): L99 `Stringdescribe(Statuss){switchons{whenACTIVE{return'active';}whenelse{…` → L104 `Stringdescribe(Statuss){switchons{whenACTIVE,PENDING{return'active';}w…`
    - **changed** switch (similar): L100 `switchons{whenACTIVE{return'active';}whenelse{return'other';}}` → L105 `switchons{whenACTIVE,PENDING{return'active';}whenINACTIVE,DELETED{retu…`
      - **changed** block (slot)
        - **changed** switchCondition (slot): L101 `ACTIVE` → L106 `ACTIVE,PENDING`
          - **added** condition: {"value":["PENDING"],"valueType":"id"}
      - **added** block: L109 `INACTIVE,DELETED`
  - **changed** method (key): L110 `voidsearch(Stringkey){List<List<SObject>>found=[FIND:keyINALLFIELDSRET…` → L118 `voidsearch(Stringkey){List<List<SObject>>found=[FIND:keyINALLFIELDSRET…`
    - **changed** localVariable (similar): L111 `List<List<SObject>>found=[FIND:keyINALLFIELDSRETURNINGAccount(Id,Name)…` → L119 `List<List<SObject>>found=[FIND:keyINALLFIELDSRETURNINGAccount(Id,Name,…`
      - **changed** variable
        - **changed** variants (key)
          - **changed** sosl (slot): L111 `[FIND:keyINALLFIELDSRETURNINGAccount(Id,Name),Contact]` → L119 `[FIND:keyINALLFIELDSRETURNINGAccount(Id,Name,Phone),Contact,Lead]`
            - **changed** fieldSpec (slot)
              - **added** soslField: L119 `Phone`
            - **added** fieldSpec: {"object":["Lead"]}
    - **changed** runAs (similar): L112 `System.runAs(newUser(Id=UserInfo.getUserId())){delete[SELECTIdFROMCont…` → L120 `System.runAs(newUser(Id=UserInfo.getUserId())){delete[SELECTIdFROMCont…`
      - **changed** delete (similar): L113 `delete[SELECTIdFROMContactWHERELastName='x'];` → L121 `delete[SELECTIdFROMContactWHERELastName='y'];`
        - **changed** soql (slot): L113 `SELECTIdFROMContactWHERELastName='x'` → L121 `SELECTIdFROMContactWHERELastName='y'`
          - **changed** condition
            - **removed** singleCondition: L113 `LastName='x'`
            - **added** singleCondition: L121 `LastName='y'`
    - **changed** upsert (similar): L115 `upsertnewAccount(Name=key)Account.Id;` → L123 `upsertnewAccount(Name=key)Account.External__c;`
      - **changed** key (slot): "Id" → "External__c"
    - **changed** throw (similar): L118 `thrownewServiceException('not supported');` → L126 `thrownewServiceException('unsupported operation');`
      - **changed** value
        - **changed** arg (slot)
          - **changed** value: "'not supported'" → "'unsupported operation'"
  - **changed** method (key): L121 `List<AggregateResult>stats(){return[SELECTName,COUNT(Id)cnt,(SELECTIdF…` → L129 `List<AggregateResult>stats(){return[SELECTCOUNT(Id)cnt,Name,(SELECTIdF…`
    - **changed** return (similar): L122 `return[SELECTName,COUNT(Id)cnt,(SELECTIdFROMContacts)FROMAccountaUSING…` → L130 `return[SELECTCOUNT(Id)cnt,Name,(SELECTIdFROMContactsWHERELastName!=nul…`
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
            - **removed** singleCondition: L129 `COUNT(Id)>1`
            - **added** singleCondition: L137 `COUNT(Id)>2`
        - **changed** orderField (slot): L130 `NameDESCNULLSLAST` → L138 `NameASCNULLSFIRST`
          - **changed** field
          - **changed** direction: "DESC" → "ASC"
          - **changed** nulls: "LAST" → "FIRST"
        - **changed** limitClause (slot): L131 `LIMIT10` → L139 `LIMIT20`
          - **changed** value: "10" → "20"
        - **changed** offsetClause (slot): L132 `OFFSET5` → L140 `OFFSET10`
          - **changed** value: "5" → "10"
  - **changed** method (key): L137 `Objectexpressions(Objectvalue,List<Integer>numbers){Integerx=(Integer)…` → L145 `Objectexpressions(Objectvalue,List<Integer>numbers){Integerx=(Long)val…`
    - **changed** localVariable (recovery): L138 `Integerx=(Integer)value;` → L146 `Integerx=(Long)value;`
      - **changed** variable
        - **changed** variants (key)
          - **changed** init
            - **changed** type (slot): L138 `Integer` → L146 `Long`
              - **changed** primitiveType: "Integer" → "Long"
    - **changed** localVariable (recovery): L139 `BooleanisText=valueinstanceofString;` → L147 `BooleanisText=valueinstanceofId;`
      - **changed** variable
        - **changed** variants (key)
          - **changed** init
            - **changed** type (slot): L139 `String` → L147 `Id`
              - **changed** primitiveType: "String" → "Id"
    - **changed** localVariable (recovery): L140 `Integery=-numbers[0]+(x*2);` → L148 `Integery=+numbers[1]-(x*3);`
      - **changed** variable
        - **changed** variants (key)
          - **changed** init
            - **changed** left
              - **changed** variant
              - **changed** operator: "-" → "+"
            - **changed** operator: "+" → "-"
            - **changed** right
              - **changed** value
                - **changed** right
                  - **changed** value: "2" → "3"
    - **changed** localVariable (recovery): L141 `Integerz=isText?x:y;` → L149 `Integerz=isText?y:x;`
      - **changed** variable
        - **changed** variants (key)
          - **changed** init
            - **changed** trueValue: "x" → "y"
            - **changed** falseValue: "y" → "x"
    - **changed** localVariable (similar): L142 `Map<String,Integer>counts=newMap<String,Integer>{'a'=>1};` → L150 `Map<String,Integer>counts=newMap<String,Integer>{'a'=>2};`
      - **changed** variable
        - **changed** variants (key)
          - **changed** init
            - **changed** init (slot)
              - **changed** value
                - **changed** value: "1" → "2"
    - **changed** localVariable (similar): L143 `Set<String>keys=newSet<String>{'a','b'};` → L151 `Set<String>keys=newSet<String>{'b','a'};`
      - **changed** variable
        - **changed** variants (key)
          - **changed** init
            - **moved** init (identical)
    - **changed** localVariable (similar): L144 `Integer[]matrix=newInteger[3];` → L152 `Integer[]matrix=newInteger[4];`
      - **changed** variable
        - **changed** variants (key)
          - **changed** init
            - **changed** size
              - **changed** value: "3" → "4"
    - **changed** localVariable (recovery): L145 `List<Account>rows=[SELECTIdFROMAccountALLROWS];` → L153 `List<Account>rows=[SELECTNameFROMAccountALLROWS];`
      - **changed** variable
        - **changed** variants (key)
          - **changed** soql (slot): L145 `SELECTIdFROMAccountALLROWS` → L153 `SELECTNameFROMAccountALLROWS`
            - **removed** selectEntry: L145 `Id`
            - **added** selectEntry: L153 `Name`
    - **changed** localVariable (similar): L146 `List<Account>locked=[SELECTIdFROMAccountLIMIT:xFORUPDATE];` → L154 `List<Account>locked=[SELECTIdFROMAccountLIMIT:yFORUPDATE];`
      - **changed** variable
        - **changed** variants (key)
          - **changed** soql (slot): L146 `SELECTIdFROMAccountLIMIT:xFORUPDATE` → L154 `SELECTIdFROMAccountLIMIT:yFORUPDATE`
            - **changed** limitClause (slot): L146 `LIMIT:x` → L154 `LIMIT:y`
              - **changed** value: "x" → "y"
    - **changed** localVariable (similar): L147 `List<Account>tracked=[SELECTIdFROMAccountUPDATETRACKING];` → L155 `List<Account>tracked=[SELECTIdFROMAccountUPDATEVIEWSTAT];`
      - **changed** variable
        - **changed** variants (key)
          - **changed** soql (slot): L147 `SELECTIdFROMAccountUPDATETRACKING` → L155 `SELECTIdFROMAccountUPDATEVIEWSTAT`
            - **changed** updateClause (slot): L147 `TRACKING` → L155 `VIEWSTAT`
              - **removed** value: "TRACKING"
              - **added** value: "VIEWSTAT"
    - **changed** return (recovery): L148 `returnz;` → L156 `returnx;`
      - **changed** field: "z" → "x"
  - **removed** method loop: L151 `voidloop(){for(Integerk=0;k<3;k++){if(k==1){continue;}if(k==2){break;}…`
  - **added** field: L12 `Integerfirst=1,second=3,third;`
  - **added** method calc: L75 `Decimalcalc(Decimala,Decimalb){returna+b;}`
  - **added** method report: L159 `voidreport(){System.debug(LoggingLevel.INFO,'report');}`
  - **removed** modifier WITH_SHARING: L6 `withsharing`
  - **changed** annotation RestResource (key): L5 `@RestResource(urlMapping='/accounts/*')` → L5 `@RestResource(urlMapping='/v2/accounts/*')`
    - **changed** urlMapping: {"key":"urlMapping","value":"'/accounts/*'","valueType":"string"} → {"key":"urlMapping","value":"'/v2/accounts/*'","valueType":"string"}
  - **added** modifier WITHOUT_SHARING: L6 `withoutsharing`

## AccountService.cls-meta.xml

- ファイル: **changed**（dataType: "apexClassMeta"）

- **changed** apexClassMeta (slot): L2 `<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata"> <apiVersio…` → L2 `<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata"> <apiVersio…`
  - **changed** apiVersion: "59.0" → "61.0"

## AccountTrigger.trigger

- ファイル: **changed**（dataType: "trigger"）

- **removed** triggerCase: L1 `beforeinsert`
- **added** triggerCase: L1 `beforedelete`
- **added** expression: L2 `System.debug('start');`
- **changed** if (similar): L2 `if(Trigger.isBefore){AccountService.validate(Trigger.new);}` → L3 `if(Trigger.isBefore&&Trigger.isInsert){AccountService.validate(Trigger…`
  - **changed** conditionBlock (slot)
    - **changed** ifCondition (slot): L2 `(Trigger.isBefore)` → L3 `(Trigger.isBefore&&Trigger.isInsert)`
      - **changed** memberAccess → -: {"type":"object","object":"Trigger","operator":".","member":"isBefore"… → {"left":{"kind":"memberAccess","sourceKeys":{"objectKey":"dotExpressio…

## AccountTrigger.trigger-meta.xml

- ファイル: **changed**（dataType: "apexTriggerMeta"）

- **changed** apexTriggerMeta (slot): L2 `<ApexTrigger xmlns="http://soap.sforce.com/2006/04/metadata"> <apiVers…` → L2 `<ApexTrigger xmlns="http://soap.sforce.com/2006/04/metadata"> <apiVers…`
  - **changed** status: "Active" → "Inactive"
  - **added** packageVersions: [{"namespace":"acme","majorNumber":1,"minorNumber":4}]

## Broken.cls

- ファイル: **changed**（dataType: "cls"）
- 構文エラー: 解消 0 件 / 発生 2 件

- **changed** class (slot): L1 `classBroken{publicvoidrun(){Integerx=1;foo(1,2);b();}}` → L1 `classBroken{publicvoidrun(){Integerx=;foo(1,);b();}}`
  - **changed** method (key): L2 `voidrun(){Integerx=1;foo(1,2);b();}` → L2 `voidrun(){Integerx=;foo(1,);b();}`
    - **removed** localVariable: L3 `Integerx=1;`
    - **removed** expression: L4 `foo(1,2);`
    - **added** error: L3 `Integerx=;foo(1,);`

## Broken.cls-meta.xml

- ファイル: **changed**（dataType: {"before":"apexClassMeta","after":"error"}）
- 構文エラー: 解消 0 件 / 発生 1 件

（中身の差分なし）

## Level.cls

- ファイル: **changed**（dataType: "cls"）

- **changed** enum (slot): L1 `enumLevel{LOW,HIGH}` → L1 `enumLevel{LOW,MEDIUM,HIGH}`
  - **added** enumConstant MEDIUM: L3 `MEDIUM`

## OldHelper.cls

- ファイル: **removed**（dataType: "cls"）

## OldHelper.cls-meta.xml

- ファイル: **removed**（dataType: "apexClassMeta"）

## Shape.cls

- ファイル: **changed**（dataType: "cls"）

- **changed** interface → class (slot): {"name":"Shape","block":[{"kind":"interfaceMethod","sourceKeys":{"base… → {"name":"Shape","block":[{"kind":"method","sourceKeys":{"base":{"objec…

## Unchanged.cls

- ファイル: **unchanged**（dataType: "cls"）

（中身の差分なし）

## Unchanged.cls-meta.xml

- ファイル: **unchanged**（dataType: "apexClassMeta"）

（中身の差分なし）

## script.apex

- ファイル: **changed**（dataType: "anonymous"）

- **changed** field (key): L1 `IntegerlimitSize=10;` → L1 `IntegerlimitSize=20;`
  - **changed** variants (key)
    - **changed** init
      - **changed** value: "10" → "20"
- **changed** method (key): L3 `voidhelper(Integern){System.debug(n);}` → L3 `voidhelper(Integern){System.debug(LoggingLevel.WARN,n);}`
  - **changed** expression (recovery): L4 `System.debug(n);` → L4 `System.debug(LoggingLevel.WARN,n);`
    - **changed** memberAccess (slot): L4 `System.debug(n)` → L4 `System.debug(LoggingLevel.WARN,n)`
      - **added** memberAccess: L4 `LoggingLevel.WARN`
- **moved** expression (identical): L16 `System.debug('end');` → L7 `System.debug('end');` ⟵ 移動元 block[2]
- **changed** for (recovery): L7 `for(Integerk=0;k<3;k++){if(k==1){continue;}if(k==2){break;}}` → L8 `for(Integerk=0;k<5;k++){if(k==1){System.debug('skip');continue;}if(k>=…`
  - **changed** forCondition (slot): L7 `Integerk=0;k<3;k++` → L8 `Integerk=0;k<5;k++`
    - **changed** condition
      - **changed** right
        - **changed** value: "3" → "5"
  - **changed** if (recovery): L8 `if(k==1){continue;}` → L9 `if(k==1){System.debug('skip');continue;}`
    - **changed** conditionBlock (slot)
      - **added** expression: L10 `System.debug('skip');`
  - **changed** if (recovery): L11 `if(k==2){break;}` → L13 `if(k>=2){System.debug('stop');break;}`
    - **changed** conditionBlock (slot)
      - **changed** ifCondition (slot): L11 `(k==2)` → L13 `(k>=2)`
        - **changed** condition
          - **changed** operator: "==" → ">="
      - **added** expression: L14 `System.debug('stop');`

## NewHelper.cls

- ファイル: **added**（dataType: "cls"）

## NewHelper.cls-meta.xml

- ファイル: **added**（dataType: "apexClassMeta"）

