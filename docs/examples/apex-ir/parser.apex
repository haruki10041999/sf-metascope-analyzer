// apex_IR 網羅用サンプル匿名 Apex（匿名ブロック内のメンバー宣言と、全種類の文を含む）

// ============================================================
// 匿名ブロック内のメンバー宣言（クラス / インターフェース / enum / メソッド）
// ============================================================

public class AnonymousHelper {
    public String greet(String name) {
        return 'Hello ' + name;
    }
}

public interface AnonymousHandler {
    void handle(String value);
}

public enum AnonymousStatus {
    OPEN,
    CLOSED
}

static String describe(Object value) {
    return String.valueOf(value);
}

private Integer square(Integer value) {
    return value * value;
}


// ============================================================
// Variables
// ============================================================

Id accountId;

String name = 'Test';

Integer count = 0, total = 10, missing;

Long longValue = 100L;

Double doubleValue = 10.5;

Decimal decimalValue = 100.25;

Boolean enabled = true;

Date today = Date.today();

Datetime now = Datetime.now();

Time timeValue = Time.newInstance(12, 30, 0, 0);

final String CONSTANT = 'constant';


// ============================================================
// Collections
// ============================================================

List<String> names = new List<String>();

Set<Id> ids = new Set<Id>();

Map<Id, Account> accounts = new Map<Id, Account>();

Map<String, Integer> scores = new Map<String, Integer>{ 'a' => 1, 'b' => 2 };

Set<String> tags = new Set<String>{ 'x', 'y' };

Set<String> emptyTags = new Set<String>{};

Integer[] numbers = new Integer[] { 1, 2, 3 };

String[] sized = new String[5];


// ============================================================
// Collection operations
// ============================================================

names.add('Alice');

names.addAll(new List<String>{ 'Charlie', 'David' });

names[0] = 'Bob';

System.debug(names.size());

System.debug(names.isEmpty());

System.debug(names.contains('Alice'));

System.debug(scores.get('a') ?? 0);


// ============================================================
// sObject / DML
// ============================================================

Account account = new Account(Name = 'Anonymous Account');

insert account;

accountId = account.Id;

accounts.put(account.Id, account);

Account retrieved = accounts.get(account.Id);

System.debug(retrieved?.Name);

account.Name = 'Updated';

update as user account;

upsert account Account.Id;

Account duplicate = new Account(Name = 'Duplicate');

insert duplicate;

merge as system account duplicate;

delete account;

undelete account;


// ============================================================
// Database DML
// ============================================================

List<Account> dmlAccounts = new List<Account>{
    new Account(Name = 'A'),
    new Account(Name = 'B'),
    new Account(Name = 'C')
};

Database.SaveResult[] saveResults = Database.insert(dmlAccounts, false);


// ============================================================
// SOQL
// ============================================================

List<Account> accountList = [
    SELECT Id, Name, Industry, AnnualRevenue
    FROM Account
    WHERE Id = :accountId
];

List<Contact> contactList = [
    SELECT Id, Name, Account.Name
    FROM Contact
    WHERE AccountId = :accountId
];

List<AggregateResult> results = [
    SELECT Industry, COUNT(Id), AVG(AnnualRevenue)
    FROM Account
    GROUP BY Industry
    HAVING COUNT(Id) > 1
];

List<Account> functionAccounts = [
    SELECT Id, TOLABEL(Type), FORMAT(CreatedDate), convertCurrency(AnnualRevenue)
    FROM Account
];

List<Account> allFields = [SELECT FIELDS(ALL) FROM Account LIMIT 200];

List<Account> lockedAccounts = [SELECT Id, Name FROM Account WHERE Id = :accountId FOR UPDATE];

List<Account> userModeAccounts = [SELECT Id, Name FROM Account WITH USER_MODE];

Integer accountCount = [SELECT COUNT() FROM Account WHERE CreatedDate = THIS_MONTH];


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
// Control flow
// ============================================================

if (count == 0) {
    System.debug('zero');
} else if (count > 0) {
    System.debug('positive');
} else {
    System.debug('negative');
}

for (Integer i = 0; i < 10; i++) {
    if (Math.mod(i, 2) == 0) {
        continue;
    }
    if (i == 7) {
        break;
    }
    System.debug(i);
}

for (Account item : accountList) {
    System.debug(item.Name);
}

for (Account item : [SELECT Id FROM Account LIMIT 5]) {
    System.debug(item.Id);
}

Integer index = 0;

while (index < 5) {
    index++;
}

Integer retry = 0;

do {
    retry += 1;
} while (retry < 3);

String status = 'NEW';

switch on status {
    when 'NEW' {
        System.debug('new');
    }
    when 'PROCESSING', 'PENDING' {
        System.debug('processing');
    }
    when else {
        System.debug('unknown');
    }
}

String result = enabled ? 'enabled' : 'disabled';


// ============================================================
// Try / Catch / Finally / throw
// ============================================================

try {
    Account a = [SELECT Id, Name FROM Account WHERE Id = :accountId LIMIT 1];
    System.debug(a);
    if (a == null) {
        throw new QueryException('not found');
    }
} catch (QueryException e) {
    System.debug(e.getMessage());
} catch (Exception e) {
    System.debug(e.getMessage());
} finally {
    System.debug('finished');
}


// ============================================================
// Expressions
// ============================================================

String upper = 'hello'.toUpperCase();

Integer stringLength = 'hello'.length();

String converted = String.valueOf(123);

Integer arithmetic = (count + total) * 2 - total / 2;

Integer bits = (count & total) | (count ^ total) << 1;

Boolean complexCondition =
    enabled
    && count >= 0
    && (name == 'Test' || name.startsWith('A'))
    && !(count != 0);

SObject objectValue = new Account(Name = 'Cast Test');

Account castedAccount = (Account) objectValue;

if (objectValue instanceof Account) {
    Account accountValue = (Account) objectValue;
    System.debug(accountValue.Name);
}

System.Type accountType = Account.class;


// ============================================================
// System.runAs / assertions
// ============================================================

System.runAs(new User(Id = UserInfo.getUserId())) {
    System.debug('run as');
}

System.assertEquals(3, dmlAccounts.size());

System.assert(enabled);

Assert.isTrue(enabled, 'should be enabled');
