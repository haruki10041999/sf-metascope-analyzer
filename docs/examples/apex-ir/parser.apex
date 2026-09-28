// ============================================================
// Variables
// ============================================================

Id accountId;

String name = 'Test';

Integer count = 0;

Long longValue = 100L;

Double doubleValue = 10.5;

Decimal decimalValue = 100.25;

Boolean enabled = true;

Date today = Date.today();

Datetime now = Datetime.now();

Time timeValue = Time.newInstance(12, 30, 0, 0);


// ============================================================
// Collections
// ============================================================

List<String> names = new List<String>();

Set<Id> ids = new Set<Id>();

Map<Id, Account> accounts =
    new Map<Id, Account>();


// ============================================================
// Collection operations
// ============================================================

names.add('Alice');

names.add('Bob');

names.addAll(
    new List<String>{
        'Charlie',
        'David'
    }
);

System.debug(names.size());

System.debug(names.isEmpty());

System.debug(names.contains('Alice'));


// ============================================================
// Map
// ============================================================

Account account =
    new Account(
        Name = 'Anonymous Account'
    );

insert account;

accountId = account.Id;

accounts.put(
    account.Id,
    account
);

Account retrieved =
    accounts.get(account.Id);

System.debug(retrieved.Name);


// ============================================================
// SOQL
// ============================================================

List<Account> accountList = [
    SELECT
        Id,
        Name,
        Industry,
        AnnualRevenue
    FROM Account
    WHERE Id = :accountId
];


// ============================================================
// SOQL relationship
// ============================================================

List<Contact> contactList = [
    SELECT
        Id,
        Name,
        Account.Name
    FROM Contact
    WHERE AccountId = :accountId
];


// ============================================================
// SOQL aggregate
// ============================================================

List<AggregateResult> results = [
    SELECT
        Industry,
        COUNT(Id),
        AVG(AnnualRevenue)
    FROM Account
    GROUP BY Industry
    HAVING COUNT(Id) > 1
];


// ============================================================
// SOQL functions
// ============================================================

List<Account> functionAccounts = [
    SELECT
        Id,
        TOLABEL(Type),
        FORMAT(CreatedDate),
        CONVERT_CURRENCY(AnnualRevenue)
    FROM Account
];


// ============================================================
// FIELDS
// ============================================================

List<Account> allFields = [
    SELECT FIELDS(ALL)
    FROM Account
    LIMIT 200
];


// ============================================================
// FOR UPDATE
// ============================================================

List<Account> lockedAccounts = [
    SELECT
        Id,
        Name
    FROM Account
    WHERE Id = :accountId
    FOR UPDATE
];


// ============================================================
// WITH USER_MODE
// ============================================================

List<Account> userModeAccounts = [
    SELECT
        Id,
        Name
    FROM Account
    WITH USER_MODE
];


// ============================================================
// If
// ============================================================

if (count == 0) {

    System.debug('zero');

} else if (count > 0) {

    System.debug('positive');

} else {

    System.debug('negative');
}


// ============================================================
// For
// ============================================================

for (Integer i = 0; i < 10; i++) {

    System.debug(i);
}


// ============================================================
// Enhanced for
// ============================================================

for (Account item : accountList) {

    System.debug(item.Name);
}


// ============================================================
// While
// ============================================================

Integer index = 0;

while (index < 5) {

    System.debug(index);

    index++;
}


// ============================================================
// Do While
// ============================================================

Integer retry = 0;

do {

    retry++;

} while (retry < 3);


// ============================================================
// Continue
// ============================================================

for (Integer i = 0; i < 10; i++) {

    if (Math.mod(i, 2) == 0) {
        continue;
    }

    System.debug(i);
}


// ============================================================
// Break
// ============================================================

for (Integer i = 0; i < 10; i++) {

    if (i == 5) {
        break;
    }

    System.debug(i);
}


// ============================================================
// Switch
// ============================================================

String status = 'NEW';

switch on status {

    when 'NEW' {
        System.debug('new');
    }

    when 'PROCESSING' {
        System.debug('processing');
    }

    when 'DONE' {
        System.debug('done');
    }

    when else {
        System.debug('unknown');
    }
}


// ============================================================
// Ternary
// ============================================================

String result =
    enabled
        ? 'enabled'
        : 'disabled';


// ============================================================
// Try / Catch
// ============================================================

try {

    Account a = [
        SELECT Id, Name
        FROM Account
        WHERE Id = :accountId
        LIMIT 1
    ];

    System.debug(a);

} catch (QueryException e) {

    System.debug(e.getMessage());

} catch (Exception e) {

    System.debug(e.getMessage());

} finally {

    System.debug('finished');
}


// ============================================================
// DML
// ============================================================

Account newAccount =
    new Account(
        Name = 'DML Test'
    );

insert newAccount;

newAccount.Name = 'DML Updated';

update newAccount;

delete newAccount;


// ============================================================
// Database DML
// ============================================================

List<Account> dmlAccounts =
    new List<Account>{
        new Account(Name = 'A'),
        new Account(Name = 'B'),
        new Account(Name = 'C')
    };

Database.SaveResult[] saveResults =
    Database.insert(
        dmlAccounts,
        false
    );


// ============================================================
// Method calls
// ============================================================

String upper =
    'hello'.toUpperCase();

Integer stringLength =
    'hello'.length();

String converted =
    String.valueOf(123);


// ============================================================
// Assertions
// ============================================================

System.assertEquals(
    3,
    dmlAccounts.size()
);

System.assert(
    enabled
);


// ============================================================
// SOSL
// ============================================================

List<List<SObject>> searchResults = [
    FIND 'test'
    IN ALL FIELDS
    RETURNING
        Account(Id, Name),
        Contact(Id, Name)
];


// ============================================================
// Nested expressions
// ============================================================

Boolean complexCondition =
    enabled
    && count > 0
    && (
        name == 'Test'
        || name.startsWith('A')
    );


// ============================================================
// Cast
// ============================================================

SObject objectValue = new Account(
    Name = 'Cast Test'
);

Account castedAccount =
    (Account)objectValue;


// ============================================================
// instanceof
// ============================================================

if (objectValue instanceof Account) {

    Account accountValue =
        (Account)objectValue;

    System.debug(
        accountValue.Name
    );
}