# Diff の結果

`run-diff.ts` が出力する。unchanged 以外の差分だけを並べる。

## anonymous_broken

- 単位: **unchanged**（filePath: "broken.apex"）

（中身の差分なし）

## anonymous_parser

- 単位: **unchanged**（filePath: "parser.apex"）

（中身の差分なし）

## anonymous_script

- 単位: **changed**（filePath: "script.apex"）

- **changed** 
  - **changed** source
    - **changed** field (key): L1 `Integer limitSize = 10;` → L1 `Integer limitSize = 20;`
      - **changed** variants (key)
        - **changed** integer (slot): L1 `10` → L1 `20`
          - **changed** value: "10" → "20"
    - **changed** method (key): L3 `void helper(Integer n) { System.debug(n); }` → L3 `void helper(Integer n) { System.debug(LoggingLevel.WARN, n); }`
      - **changed** expression (recovery): L4 `System.debug(n);` → L4 `System.debug(LoggingLevel.WARN, n);`
        - **changed** memberAccess (slot): L4 `System.debug(n)` → L4 `System.debug(LoggingLevel.WARN, n)`
          - **added** memberAccess: L4 `LoggingLevel.WARN`
    - **moved** expression (identical): L16 `System.debug('end');` → L7 `System.debug('end');` ⟵ 移動元 block[2]
    - **changed** for (recovery): L7 `for (Integer k = 0; k < 3; k++) { if (k == 1) { continue; } if (k == 2…` → L8 `for (Integer k = 0; k < 5; k++) { if (k == 1) { System.debug('skip'); …`
      - **changed** condition
        - **changed** binary (slot): L7 `k < 3` → L8 `k < 5`
          - **changed** integer (slot): L7 `3` → L8 `5`
            - **changed** value: "3" → "5"
      - **changed** if (recovery): L8 `if (k == 1) { continue; }` → L9 `if (k == 1) { System.debug('skip'); continue; }`
        - **changed** conditionBlock (slot)
          - **added** expression: L10 `System.debug('skip');`
      - **changed** if (recovery): L11 `if (k == 2) { break; }` → L13 `if (k >= 2) { System.debug('stop'); break; }`
        - **changed** conditionBlock (slot)
          - **changed** binary (slot): L11 `k == 2` → L13 `k >= 2`
            - **changed** operator: "==" → ">="
          - **added** expression: L14 `System.debug('stop');`

## class_AccountService

- 単位: **changed**（filePath: "AccountService.cls"）

- **changed** 
  - **changed** source
    - **changed** class (slot): L6 `class AccountService extends BaseService implements Schedulable { publ…` → L6 `class AccountService extends BaseService implements Schedulable, Queue…`
      - **added** type: L6 `Queueable`
      - **changed** field (key): L8 `Integer MAX_SIZE = 100;` → L8 `Integer MAX_SIZE = 200;`
        - **changed** variants (key)
          - **changed** integer (slot): L8 `100` → L8 `200`
            - **changed** value: "100" → "200"
      - **changed** field (key): L10 `String name = 'default';` → L10 `String name = 'default';`
        - **removed** modifier PRIVATE: L10 `private`
        - **added** modifier PROTECTED: L10 `protected`
      - **removed** field: L12 `Integer first = 1, second = 2;`
      - **changed** initializer (slot)
        - **changed** expression (recovery): L17 `counter = 0;` → L17 `counter = 1;`
          - **changed** assignment (slot): L17 `counter = 0` → L17 `counter = 1`
            - **changed** integer (slot): L17 `0` → L17 `1`
              - **changed** value: "0" → "1"
      - **changed** property (key): L24 `String label { get; set; }` → L24 `String label { get; private set; }`
        - **added** modifier PRIVATE: L24 `private`
      - **changed** property (key): L26 `Integer total { get { return total; } private set { total = value; } }` → L26 `Integer total { get { return total == null ? 0 : total; } private set …`
        - **changed** return (recovery): L27 `return total;` → L27 `return total == null ? 0 : total;`
          - **changed** identifier → conditional: {"name":"total"} → {"condition":{"kind":"binary","sourceKeys":{"objectKey":"equalityExpre…
      - **changed** enum (key): L31 `enum Status { ACTIVE, INACTIVE, DELETED }` → L31 `enum Status { ACTIVE, PENDING, INACTIVE, DELETED }`
        - **added** enumConstant PENDING: L31 `PENDING`
      - **changed** interface (key): L33 `interface Handler { void handle(Account acc); Integer count(); }` → L33 `interface Handler { void handle(Account acc); Long count(); void reset…`
        - **changed** interfaceMethod (key): L35 `Integer count();` → L35 `Long count();`
          - **changed** type (slot): L35 `Integer` → L35 `Long`
            - **changed** primitiveType: "Integer" → "Long"
        - **added** interfaceMethod reset: L36 `void reset();`
      - **changed** class (key): L38 `class Wrapper { public Account record; public Wrapper(Account record) …` → L39 `class Wrapper { public Account record; public Boolean selected = false…`
        - **added** field: L41 `Boolean selected = false;`
      - **changed** constructor (key): L46 `AccountService() { this('default'); }` → L48 `AccountService() { this('anonymous'); }`
        - **changed** expression (recovery): L47 `this('default');` → L49 `this('anonymous');`
          - **changed** call (slot): L47 `this('default')` → L49 `this('anonymous')`
            - **changed** string (slot): L47 `'default'` → L49 `'anonymous'`
              - **changed** value: "default" → "anonymous"
      - **changed** method (key): L55 `void sync(Set<Id> ids) { List<Account> accounts = [SELECT Id, Name FRO…` → L57 `void sync(Set<Id> ids) { List<Account> accounts = [SELECT Name, Id FRO…`
        - **changed** localVariable (similar): L56 `List<Account> accounts = [SELECT Id, Name FROM Account WHERE Id IN :id…` → L58 `List<Account> accounts = [SELECT Name, Id FROM Account WHERE Id IN :id…`
          - **changed** variant (key): L56 `accounts = [SELECT Id, Name FROM Account WHERE Id IN :ids ORDER BY Nam…` → L58 `accounts = [SELECT Name, Id FROM Account WHERE Id IN :ids ORDER BY Nam…`
            - **changed** soql (slot): L56 `SELECT Id, Name FROM Account WHERE Id IN :ids ORDER BY Name ASC LIMIT …` → L58 `SELECT Name, Id FROM Account WHERE Id IN :ids ORDER BY Name ASC LIMIT …`
              - **changed** limitClause (slot): L56 `LIMIT 100` → L58 `LIMIT 200`
                - **changed** value: "100" → "200"
        - **changed** annotation Future (key): L54 `@Future(callout=true)` → L56 `@Future(callout=false)`
          - **changed** boolean (slot): L54 `true` → L56 `false`
            - **changed** value: true → false
      - **changed** method (key): L63 `Integer calc(Integer a, Integer b) { Integer result = a + b; if (resul…` → L65 `Integer calc(Integer a, Integer b) { Integer result = a + b; if (resul…`
        - **changed** if (similar): L65 `if (result > MAX_SIZE) { result = MAX_SIZE; } else if (result < 0) { r…` → L67 `if (result >= MAX_SIZE) { result = MAX_SIZE; } else if (result < 0) { …`
          - **changed** conditionBlock (slot)
            - **changed** binary (slot): L65 `result > MAX_SIZE` → L67 `result >= MAX_SIZE`
              - **changed** operator: ">" → ">="
      - **changed** method (key): L73 `void process(List<Account> accounts) { Integer i = 0; while (i < accou…` → L79 `void process(List<Account> accounts) { Integer i = 0; while (i <= acco…`
        - **changed** while (similar): L75 `while (i < accounts.size()) { i++; }` → L81 `while (i <= accounts.size()) { i++; }`
          - **changed** binary (slot): L75 `i < accounts.size()` → L81 `i <= accounts.size()`
            - **changed** operator: "<" → "<="
        - **changed** doWhile (similar): L78 `do { i--; } while (i > 0);` → L84 `do { i--; } while (i >= 0);`
          - **changed** binary (slot): L80 `i > 0` → L86 `i >= 0`
            - **changed** operator: ">" → ">="
        - **changed** for (similar): L81 `for (Integer j = 0; j < 10; j++) { if (j == 1) { continue; } if (j == …` → L87 `for (Integer j = 0; j < 10; j += 2) { if (j == 0) { continue; } if (j …`
          - **changed** condition
            - **changed** unary → assignment (slot): {"operator":"++","operatorLocation":"back","argument":{"kind":"identif… → {"left":{"kind":"identifier","sourceKeys":{"objectKey":"idPrimary_3fc8…
          - **changed** if (recovery): L82 `if (j == 1) { continue; }` → L88 `if (j == 0) { continue; }`
            - **changed** conditionBlock (slot)
              - **changed** binary (slot): L82 `j == 1` → L88 `j == 0`
                - **changed** integer (slot): L82 `1` → L88 `0`
                  - **changed** value: "1" → "0"
          - **changed** if (recovery): L85 `if (j == 2) { break; }` → L91 `if (j == 3) { break; }`
            - **changed** conditionBlock (slot)
              - **changed** binary (slot): L85 `j == 2` → L91 `j == 3`
                - **changed** integer (slot): L85 `2` → L91 `3`
                  - **changed** value: "2" → "3"
        - **changed** try (similar): L90 `try { insert accounts; } catch (DmlException e) { log(e.getMessage());…` → L96 `try { insert as user accounts; } catch (DmlException e) { log('done');…`
          - **changed** block (slot)
            - **changed** insert (recovery): L91 `insert accounts;` → L97 `insert as user accounts;`
              - **added** accessLevel: "USER"
          - **changed** block (slot)
            - **moved** expression (identical): L95 `log('done');` → L99 `log('done');` ⟵ 移動元 block[0]
          - **removed** block: L95 `log('done');`
      - **changed** method (key): L99 `String describe(Status s) { switch on s { when ACTIVE { return 'active…` → L104 `String describe(Status s) { switch on s { when ACTIVE, PENDING { retur…`
        - **changed** switch (recovery): L100 `switch on s { when ACTIVE { return 'active'; } when else { return 'oth…` → L105 `switch on s { when ACTIVE, PENDING { return 'active'; } when INACTIVE,…`
          - **changed** when (slot)
            - **changed** switchCondition (slot): L101 `ACTIVE` → L106 `ACTIVE, PENDING`
              - **added** identifier PENDING: L106 `PENDING`
          - **added** when: L109 `INACTIVE, DELETED`
      - **changed** method (key): L110 `void search(String key) { List<List<SObject>> found = [FIND :key IN AL…` → L118 `void search(String key) { List<List<SObject>> found = [FIND :key IN AL…`
        - **changed** localVariable (similar): L111 `List<List<SObject>> found = [FIND :key IN ALL FIELDS RETURNING Account…` → L119 `List<List<SObject>> found = [FIND :key IN ALL FIELDS RETURNING Account…`
          - **changed** variant (key): L111 `found = [FIND :key IN ALL FIELDS RETURNING Account(Id, Name), Contact]` → L119 `found = [FIND :key IN ALL FIELDS RETURNING Account(Id, Name, Phone), C…`
            - **changed** sosl (slot): L111 `[FIND :key IN ALL FIELDS RETURNING Account(Id, Name), Contact]` → L119 `[FIND :key IN ALL FIELDS RETURNING Account(Id, Name, Phone), Contact, …`
              - **changed** fieldSpec (slot)
                - **added** soslField: L119 `Phone`
              - **added** fieldSpec: {"object":["Lead"]}
        - **changed** runAs (similar): L112 `System.runAs(new User(Id = UserInfo.getUserId())) { delete [SELECT Id …` → L120 `System.runAs(new User(Id = UserInfo.getUserId())) { delete [SELECT Id …`
          - **changed** delete (similar): L113 `delete [SELECT Id FROM Contact WHERE LastName = 'x'];` → L121 `delete [SELECT Id FROM Contact WHERE LastName = 'y'];`
            - **changed** soql (slot): L113 `SELECT Id FROM Contact WHERE LastName = 'x'` → L121 `SELECT Id FROM Contact WHERE LastName = 'y'`
              - **changed** condition
                - **removed** singleCondition: L113 `LastName = 'x'`
                - **added** singleCondition: L121 `LastName = 'y'`
        - **changed** upsert (similar): L115 `upsert new Account(Name = key) Account.Id;` → L123 `upsert new Account(Name = key) Account.External__c;`
          - **changed** key (slot): "Id" → "External__c"
        - **changed** throw (recovery): L118 `throw new ServiceException('not supported');` → L126 `throw new ServiceException('unsupported operation');`
          - **changed** new (slot): L118 `new ServiceException('not supported')` → L126 `new ServiceException('unsupported operation')`
            - **changed** string (slot): L118 `'not supported'` → L126 `'unsupported operation'`
              - **changed** value: "not supported" → "unsupported operation"
      - **changed** method (key): L121 `List<AggregateResult> stats() { return [ SELECT Name, COUNT(Id) cnt, (…` → L129 `List<AggregateResult> stats() { return [ SELECT COUNT(Id) cnt, Name, (…`
        - **changed** return (similar): L122 `return [ SELECT Name, COUNT(Id) cnt, (SELECT Id FROM Contacts) FROM Ac…` → L130 `return [ SELECT COUNT(Id) cnt, Name, (SELECT Id FROM Contacts WHERE La…`
          - **changed** soql (slot): L123 `SELECT Name, COUNT(Id) cnt, (SELECT Id FROM Contacts) FROM Account a U…` → L131 `SELECT COUNT(Id) cnt, Name, (SELECT Id FROM Contacts WHERE LastName !=…`
            - **changed** subQuery (key): L123 `SELECT Id FROM Contacts` → L131 `SELECT Id FROM Contacts WHERE LastName != null`
              - **added** where: L131 `LastName != null`
            - **changed** condition
              - **removed** condition: L126 `Name LIKE 'a%'`
              - **removed** condition: L126 `Rating = 'Hot'`
              - **added** condition: L134 `Industry = 'IT'`
              - **added** condition: L134 `Rating = 'Warm'`
            - **changed** forClause (slot): L133 `FOR VIEW` → L141 `FOR REFERENCE`
              - **removed** value: "VIEW"
              - **added** value: "REFERENCE"
            - **changed** usingScopeClause (slot): L125 `USING SCOPE mine` → L133 `USING SCOPE team`
              - **changed** value: "mine" → "team"
            - **changed** with
              - **removed** categoryCondition: L127 `Geography__c AT (usa__c)`
              - **added** categoryCondition: L135 `Geography__c BELOW (usa__c)`
            - **changed** groupBy (slot): L128 `GROUP BY ROLLUP(Name) HAVING COUNT(Id) > 1` → L136 `GROUP BY CUBE(Name) HAVING COUNT(Id) > 2`
              - **changed** mode: "ROLLUP" → "CUBE"
              - **changed** having
                - **removed** singleCondition: L129 `COUNT(Id) > 1`
                - **added** singleCondition: L137 `COUNT(Id) > 2`
            - **changed** orderField (nearest): L130 `Name DESC NULLS LAST` → L138 `Name ASC NULLS FIRST`
              - **changed** field
              - **changed** direction: "DESC" → "ASC"
              - **changed** nulls: "LAST" → "FIRST"
            - **changed** limitClause (slot): L131 `LIMIT 10` → L139 `LIMIT 20`
              - **changed** value: "10" → "20"
            - **changed** offsetClause (slot): L132 `OFFSET 5` → L140 `OFFSET 10`
              - **changed** value: "5" → "10"
      - **changed** method (key): L137 `Object expressions(Object value, List<Integer> numbers) { Integer x = …` → L145 `Object expressions(Object value, List<Integer> numbers) { Integer x = …`
        - **changed** localVariable (recovery): L138 `Integer x = (Integer) value;` → L146 `Integer x = (Long) value;`
          - **changed** variant (key): L138 `x = (Integer) value` → L146 `x = (Long) value`
            - **changed** cast (slot): L138 `(Integer) value` → L146 `(Long) value`
              - **changed** type (slot): L138 `Integer` → L146 `Long`
                - **changed** primitiveType: "Integer" → "Long"
        - **changed** localVariable (recovery): L139 `Boolean isText = value instanceof String;` → L147 `Boolean isText = value instanceof Id;`
          - **changed** variant (key): L139 `isText = value instanceof String` → L147 `isText = value instanceof Id`
            - **changed** instanceof (slot): L139 `value instanceof String` → L147 `value instanceof Id`
              - **changed** type (slot): L139 `String` → L147 `Id`
                - **changed** primitiveType: "String" → "Id"
        - **changed** localVariable (recovery): L140 `Integer y = -numbers[0] + (x * 2);` → L148 `Integer y = +numbers[1] - (x * 3);`
          - **changed** variant (key): L140 `y = -numbers[0] + (x * 2)` → L148 `y = +numbers[1] - (x * 3)`
            - **changed** binary (slot): L140 `-numbers[0] + (x * 2)` → L148 `+numbers[1] - (x * 3)`
              - **changed** unary (slot): L140 `-numbers[0]` → L148 `+numbers[1]`
                - **changed** operator: "-" → "+"
                - **changed** index (slot): L140 `numbers[0]` → L148 `numbers[1]`
              - **changed** operator: "+" → "-"
              - **changed** parenthesized (slot): L140 `(x * 2)` → L148 `(x * 3)`
                - **changed** binary (slot): L140 `x * 2` → L148 `x * 3`
                  - **changed** integer (slot): L140 `2` → L148 `3`
                    - **changed** value: "2" → "3"
        - **changed** localVariable (recovery): L141 `Integer z = isText ? x : y;` → L149 `Integer z = isText ? y : x;`
          - **changed** variant (key): L141 `z = isText ? x : y` → L149 `z = isText ? y : x`
            - **changed** conditional (slot): L141 `isText ? x : y` → L149 `isText ? y : x`
              - **changed** identifier (slot): L141 `x` → L149 `y`
                - **changed** name: "x" → "y"
              - **changed** identifier (slot): L141 `y` → L149 `x`
                - **changed** name: "y" → "x"
        - **changed** localVariable (recovery): L142 `Map<String, Integer> counts = new Map<String, Integer>{ 'a' => 1 };` → L150 `Map<String, Integer> counts = new Map<String, Integer>{ 'a' => 2 };`
          - **changed** variant (key): L142 `counts = new Map<String, Integer>{ 'a' => 1 }` → L150 `counts = new Map<String, Integer>{ 'a' => 2 }`
            - **changed** new (slot): L142 `new Map<String, Integer>{ 'a' => 1 }` → L150 `new Map<String, Integer>{ 'a' => 2 }`
              - **changed** entries (slot)
                - **changed** integer (slot): L142 `1` → L150 `2`
                  - **changed** value: "1" → "2"
        - **changed** localVariable (recovery): L143 `Set<String> keys = new Set<String>{ 'a', 'b' };` → L151 `Set<String> keys = new Set<String>{ 'b', 'a' };`
          - **changed** variant (key): L143 `keys = new Set<String>{ 'a', 'b' }` → L151 `keys = new Set<String>{ 'b', 'a' }`
            - **changed** new (slot): L143 `new Set<String>{ 'a', 'b' }` → L151 `new Set<String>{ 'b', 'a' }`
              - **moved** string (identical): L143 `'a'` → L151 `'a'`
        - **changed** localVariable (recovery): L144 `Integer[] matrix = new Integer[3];` → L152 `Integer[] matrix = new Integer[4];`
          - **changed** variant (key): L144 `matrix = new Integer[3]` → L152 `matrix = new Integer[4]`
            - **changed** new (slot): L144 `new Integer[3]` → L152 `new Integer[4]`
              - **changed** integer (slot): L144 `3` → L152 `4`
                - **changed** value: "3" → "4"
        - **changed** localVariable (recovery): L145 `List<Account> rows = [SELECT Id FROM Account ALL ROWS];` → L153 `List<Account> rows = [SELECT Name FROM Account ALL ROWS];`
          - **changed** variant (key): L145 `rows = [SELECT Id FROM Account ALL ROWS]` → L153 `rows = [SELECT Name FROM Account ALL ROWS]`
            - **changed** soql (slot): L145 `SELECT Id FROM Account ALL ROWS` → L153 `SELECT Name FROM Account ALL ROWS`
              - **removed** selectEntry: L145 `Id`
              - **added** selectEntry: L153 `Name`
        - **changed** localVariable (similar): L146 `List<Account> locked = [SELECT Id FROM Account LIMIT :x FOR UPDATE];` → L154 `List<Account> locked = [SELECT Id FROM Account LIMIT :y FOR UPDATE];`
          - **changed** variant (key): L146 `locked = [SELECT Id FROM Account LIMIT :x FOR UPDATE]` → L154 `locked = [SELECT Id FROM Account LIMIT :y FOR UPDATE]`
            - **changed** soql (slot): L146 `SELECT Id FROM Account LIMIT :x FOR UPDATE` → L154 `SELECT Id FROM Account LIMIT :y FOR UPDATE`
              - **changed** limitClause (slot): L146 `LIMIT :x` → L154 `LIMIT :y`
                - **changed** identifier: {"name":"x"} → {"name":"y"}
        - **changed** localVariable (similar): L147 `List<Account> tracked = [SELECT Id FROM Account UPDATE TRACKING];` → L155 `List<Account> tracked = [SELECT Id FROM Account UPDATE VIEWSTAT];`
          - **changed** variant (key): L147 `tracked = [SELECT Id FROM Account UPDATE TRACKING]` → L155 `tracked = [SELECT Id FROM Account UPDATE VIEWSTAT]`
            - **changed** soql (slot): L147 `SELECT Id FROM Account UPDATE TRACKING` → L155 `SELECT Id FROM Account UPDATE VIEWSTAT`
              - **changed** updateClause (slot): L147 `TRACKING` → L155 `VIEWSTAT`
                - **removed** value: "TRACKING"
                - **added** value: "VIEWSTAT"
        - **changed** return (recovery): L148 `return z;` → L156 `return x;`
          - **changed** identifier (slot): L148 `z` → L156 `x`
            - **changed** name: "z" → "x"
      - **removed** method loop: L151 `void loop() { for (Integer k = 0; k < 3; k++) { if (k == 1) { continue…`
      - **added** field: L12 `Integer first = 1, second = 3, third;`
      - **added** method calc: L75 `Decimal calc(Decimal a, Decimal b) { return a + b; }`
      - **added** method report: L159 `void report() { System.debug(LoggingLevel.INFO, 'report'); }`
      - **removed** modifier WITH_SHARING: L6 `with sharing`
      - **changed** annotation RestResource (key): L5 `@RestResource(urlMapping='/accounts/*')` → L5 `@RestResource(urlMapping='/v2/accounts/*')`
        - **changed** string (slot): L5 `'/accounts/*'` → L5 `'/v2/accounts/*'`
          - **changed** value: "/accounts/*" → "/v2/accounts/*"
      - **added** modifier WITHOUT_SHARING: L6 `without sharing`
  - **changed** meta
    - **changed** apexClassMeta (slot): L2 `<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata"> <apiVersio…` → L2 `<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata"> <apiVersio…`
      - **changed** apiVersion: "59.0" → "61.0"

## class_Broken

- 単位: **changed**（filePath: "Broken.cls"）
- 構文エラー: 解消 0 件 / 発生 3 件

- **changed** 
  - **changed** source
    - **changed** class (slot): L1 `class Broken { public void run() { Integer x = 1; foo(1, 2); b(); } }` → L1 `class Broken { public void run() { Integer x = ; foo(1, ); b(); } }`
      - **changed** method (key): L2 `void run() { Integer x = 1; foo(1, 2); b(); }` → L2 `void run() { Integer x = ; foo(1, ); b(); }`
        - **changed** localVariable (recovery): L3 `Integer x = 1;` → L3 `Integer x = ; foo(1, );`
          - **changed** variant (key): L3 `x = 1` → L3 `x = ; foo(1, )`
            - **changed** integer → call: {"value":"1"} → {"callee":{"kind":"identifier","sourceKeys":{"objectKey":"id_96a9e32fc…
        - **removed** expression: L4 `foo(1, 2);`
  - **changed** meta
    - **changed** apexClassMeta → -: {"apiVersion":"61.0","status":"Active"} → null

## class_Level

- 単位: **changed**（filePath: "Level.cls"）

- **changed** 
  - **changed** source
    - **changed** enum (slot): L1 `enum Level { LOW, HIGH }` → L1 `enum Level { LOW, MEDIUM, HIGH }`
      - **added** enumConstant MEDIUM: L3 `MEDIUM`

## class_NewHelper

- 単位: **added**（filePath: {"after":"NewHelper.cls"}）

## class_OldHelper

- 単位: **removed**（filePath: {"before":"OldHelper.cls"}）

## class_ParserEnum

- 単位: **unchanged**（filePath: "ParserEnum.cls"）

（中身の差分なし）

## class_ParserInterface

- 単位: **unchanged**（filePath: "ParserInterface.cls"）

（中身の差分なし）

## class_ParserTest

- 単位: **unchanged**（filePath: "ParserTest.cls"）

（中身の差分なし）

## class_Shape

- 単位: **changed**（filePath: "Shape.cls"）

- **changed** 
  - **changed** source
    - **changed** interface → class (slot): {"name":"Shape","block":[{"kind":"interfaceMethod","sourceKeys":{"base… → {"name":"Shape","block":[{"kind":"method","sourceKeys":{"base":{"objec…

## class_Unchanged

- 単位: **unchanged**（filePath: "Unchanged.cls"）

（中身の差分なし）

## trigger_AccountTrigger

- 単位: **changed**（filePath: "AccountTrigger.trigger"）

- **changed** 
  - **changed** source
    - **removed** triggerCase: L1 `before insert`
    - **added** triggerCase: L1 `before delete`
    - **added** expression: L2 `System.debug('start');`
    - **changed** if (similar): L2 `if (Trigger.isBefore) { AccountService.validate(Trigger.new); }` → L3 `if (Trigger.isBefore && Trigger.isInsert) { AccountService.validate(Tr…`
      - **changed** conditionBlock (slot)
        - **changed** memberAccess → logical: {"type":"object","object":{"kind":"identifier","sourceKeys":{"objectKe… → {"left":{"kind":"memberAccess","sourceKeys":{"objectKey":"dotExpressio…
  - **changed** meta
    - **changed** apexTriggerMeta (slot): L2 `<ApexTrigger xmlns="http://soap.sforce.com/2006/04/metadata"> <apiVers…` → L2 `<ApexTrigger xmlns="http://soap.sforce.com/2006/04/metadata"> <apiVers…`
      - **changed** status: "Active" → "Inactive"
      - **added** packageVersions: [{"namespace":"acme","majorNumber":1,"minorNumber":4}]

## trigger_ParserTrigger

- 単位: **unchanged**（filePath: "ParserTrigger.trigger"）

（中身の差分なし）

