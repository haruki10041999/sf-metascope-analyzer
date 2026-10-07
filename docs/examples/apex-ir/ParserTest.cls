/**
 * apex_IR 網羅用サンプルクラス。
 * ParserTrigger.trigger / parser.apex と合わせて、IR の全ノード種別を 1 回以上出現させる。
 */
@IsTest(SeeAllData=false isParallel=true)
global inherited sharing virtual class ParserTest extends BaseParser implements ParserInterface, Comparable {

    // ============================================================
    // Fields（修飾子・初期化子あり/なし・複数宣言子・配列）
    // ============================================================

    public static final Integer MAX_SIZE = 100;

    private static Integer counter;

    private String name;

    protected Id accountId;

    global transient Blob cache;

    public List<String> names = new List<String>();

    private Set<Id> accountIds = new Set<Id>();

    private Map<Id, Account> accountMap = new Map<Id, Account>();

    private List<List<String>> nestedList;

    private String[] stringArray;

    private Integer[][] integerMatrix;

    private Integer first = 1, second, third = 3;

    // 空の宣言（`;` 単体）
    ;


    // ============================================================
    // Static / instance initializer
    // ============================================================

    static {
        counter = 0;
    }

    {
        names = new List<String>();
    }


    // ============================================================
    // Properties
    // ============================================================

    public String autoProperty { get; set; }

    public Integer readOnlyProperty { get; private set; }

    public Integer computedProperty {
        get {
            return counter == null ? 0 : counter;
        }
        set {
            counter = value;
        }
    }


    // ============================================================
    // Constructor
    // ============================================================

    public ParserTest() {
        this('default');
    }

    public ParserTest(String name) {
        super();
        this.name = name;
    }


    // ============================================================
    // Annotations / modifiers
    // ============================================================

    @AuraEnabled(cacheable=true)
    public static String getName(Id recordId) {
        return String.valueOf(recordId);
    }

    @InvocableMethod(label='Run' description='Run the parser')
    global static void invocable(List<String> values) {
        System.debug(values);
    }

    @Deprecated
    webservice static String legacy() {
        return 'legacy';
    }

    @TestVisible
    private static testmethod void legacyTest() {
        System.assert(true);
    }

    public override String toString() {
        return name;
    }

    public virtual Integer compareTo(Object other) {
        return 0;
    }

    protected virtual void hook() {
    }


    // ============================================================
    // Primitive types / literals
    // ============================================================

    private void literals() {

        String stringValue = 'Hello World';

        String escapedValue = 'Hello\nWorld';

        Integer integerValue = 123;

        Long longValue = 123456789L;

        Decimal decimalValue = 123.45;

        Double doubleValue = 12.34;

        Boolean trueValue = true;

        Boolean falseValue = false;

        String nullValue = null;

        Blob blobValue;

        Object objectValue;

        Date dateValue = Date.newInstance(2026, 9, 28);

        Datetime datetimeValue = Datetime.newInstance(2026, 9, 28, 12, 30, 0);

        Time timeValue = Time.newInstance(12, 30, 0, 0);
    }


    // ============================================================
    // Generic types / class literal
    // ============================================================

    private void genericTypes() {

        List<String> stringList = new List<String>();

        Set<Id> idSet = new Set<Id>();

        Map<Id, Account> accountMapLocal = new Map<Id, Account>();

        List<Map<Id, Account>> nestedGeneric = new List<Map<Id, Account>>();

        Map<String, List<Account>> complexMap = new Map<String, List<Account>>();

        List<String>[] arrayOfLists = new List<String>[2];

        System.Type stringType = String.class;

        System.Type listType = List<String>.class;

        System.Type voidType = void.class;

        Schema.SObjectType accountType = Account.SObjectType;
    }


    // ============================================================
    // Creators（noRest / classCreator / array / map / set）
    // ============================================================

    private void creators() {

        Set<String> emptySet = new Set<String>{};

        List<String> initializedList = new List<String>{ 'a', 'b' };

        Set<Integer> initializedSet = new Set<Integer>{ 1, 2, 3 };

        Map<String, Integer> initializedMap = new Map<String, Integer>{ 'a' => 1, 'b' => 2 };

        Account account = new Account(Name = 'Test', Industry = 'Technology');

        String[] sized = new String[10];

        Integer[] numbers = new Integer[] { 1, 2, 3 };

        Integer[] emptyNumbers = new Integer[] {};

        Schema.DescribeSObjectResult describe = new Schema.DescribeSObjectResult();

        sized[0] = 'test';

        Integer value = numbers[0];
    }


    // ============================================================
    // Expressions（全演算子）
    // ============================================================

    private Integer operators(Integer a, Integer b) {

        Integer result = a + b;
        result = a - b;
        result = a * b;
        result = a / b;
        result = -a;
        result = +a;
        result = ~a;

        result = a << 2;
        result = a >> 2;
        result = a >>> 2;
        result = a & b;
        result = a | b;
        result = a ^ b;

        result++;
        result--;
        ++result;
        --result;

        result += 10;
        result -= 10;
        result *= 2;
        result /= 2;
        result &= 1;
        result |= 1;
        result ^= 1;
        result <<= 1;
        result >>= 1;
        result >>>= 1;

        Boolean flag = a < b;
        flag = a > b;
        flag = a <= b;
        flag = a >= b;
        flag = a == b;
        flag = a != b;
        flag = a <> b;
        flag = a === b;
        flag = a !== b;
        flag = !flag;
        flag = flag && a > 0;
        flag = flag || a < 0;
        flag = (a > 0 && b > 0) || (a < 0 && b < 0);

        Integer coalesced = counter ?? 0;

        String safe = name?.toUpperCase();

        Integer ternary = flag ? a : b;

        return result;
    }

    private void castAndInstanceof(SObject objectValue) {

        Account account = (Account) objectValue;

        Boolean isAccount = objectValue instanceof Account;

        String accountName = ((Account) objectValue).Name;

        System.debug(account.Name + accountName + isAccount);
    }


    // ============================================================
    // Method calls（this / super / static / chained / dot）
    // ============================================================

    private void methodCalls() {

        this.hook();

        super.someMethod();

        hook();

        System.debug('hello');

        String value = String.valueOf(123).trim().toUpperCase();

        Integer size = this.names.size();

        Id ownerId = [SELECT OwnerId FROM Account LIMIT 1].OwnerId;
    }


    // ============================================================
    // If / loops / switch
    // ============================================================

    private void controlFlow(Integer value, List<Account> accounts) {

        if (value > 100) {
            System.debug('large');
        } else if (value > 50) {
            System.debug('medium');
        } else {
            System.debug('small');
        }

        if (value == 0) return;

        for (Integer i = 0, j = 10; i < j; i++, j--) {
            if (i == 5) {
                continue;
            }
            if (i == 8) {
                break;
            }
        }

        Integer k;
        for (k = 0; k < 3; k++) {
            System.debug(k);
        }

        for (;;) {
            break;
        }

        for (Account account : accounts) {
            System.debug(account.Name);
        }

        for (List<Account> chunk : [SELECT Id FROM Account]) {
            System.debug(chunk.size());
        }

        while (value > 0) {
            value--;
        }

        do {
            value++;
        } while (value < 10);
    }

    private String switchExamples(Object input, String text, Integer num, Status status) {

        switch on text {
            when 'A' {
                return 'Alpha';
            }
            when 'B', 'C' {
                return 'Beta or Gamma';
            }
            when null {
                return 'null';
            }
            when else {
                return 'Unknown';
            }
        }

        switch on num {
            when 1, -1 {
                return 'one';
            }
            when 2 {
                return 'two';
            }
        }

        switch on status {
            when AAA, BBB {
                return 'first';
            }
            when else {
                return 'other';
            }
        }

        switch on input {
            when Account a {
                return a.Name;
            }
            when Contact c {
                return c.LastName;
            }
            when else {
                return null;
            }
        }
    }


    // ============================================================
    // Try / Catch / Finally / throw
    // ============================================================

    private void exceptionHandling() {

        try {
            Account account = [SELECT Id, Name FROM Account LIMIT 1];
            System.debug(account);
        } catch (QueryException e) {
            System.debug(e.getMessage());
        } catch (final Exception e) {
            System.debug(e.getMessage());
        } finally {
            System.debug('finally');
        }

        try {
            throwExample();
        } finally {
            System.debug('only finally');
        }
    }

    private void throwExample() {
        throw new CustomException('Something went wrong');
    }


    // ============================================================
    // DML（access level / upsert external id / merge）
    // ============================================================

    private void dmlExample(Account account, Account duplicate, List<Account> accounts) {

        insert account;

        insert as user account;

        update as system accounts;

        upsert account;

        upsert accounts Account.ExternalId__c;

        upsert as user accounts Account.ExternalId__c;

        delete account;

        undelete account;

        merge account duplicate;

        merge as system account duplicate;
    }

    private void databaseExample(List<Account> accounts) {

        Database.SaveResult[] results = Database.insert(accounts, false);

        Database.update(accounts, false);

        Database.delete(accounts, false);

        Database.upsert(accounts, false);
    }


    // ============================================================
    // System.runAs
    // ============================================================

    private void runAsExample(User user) {

        System.runAs(user) {
            System.debug(UserInfo.getUserId());
        }

        System.runAs(new Version(1, 0)) {
            System.debug('versioned');
        }
    }


    // ============================================================
    // SOQL - basic / bind / ORDER BY / LIMIT / OFFSET
    // ============================================================

    private List<Account> basicSoql(Integer pageSize, Integer pageOffset) {

        List<Account> accounts = [
            SELECT Id, Name, Industry, AnnualRevenue, CreatedDate
            FROM Account
            WHERE Industry = 'Technology'
            ORDER BY Name ASC NULLS FIRST, CreatedDate DESC NULLS LAST, Industry
            LIMIT 100
            OFFSET 10
        ];

        return [
            SELECT Id
            FROM Account
            LIMIT :pageSize
            OFFSET :pageOffset
        ];
    }


    // ============================================================
    // SOQL - 比較演算子 / 論理演算子 / 値の種類
    // ============================================================

    private List<Account> whereSoql(String industry, Decimal revenue, Set<Id> ids) {

        return [
            SELECT Id, Name
            FROM Account
            WHERE
                Industry = :industry
                AND AnnualRevenue > :revenue
                AND AnnualRevenue >= 1000
                AND AnnualRevenue < 1000000
                AND AnnualRevenue <= -1.5
                AND NumberOfEmployees != 0
                AND Name LIKE 'Test%'
                AND (Phone = NULL OR Fax != NULL)
                AND (NOT Name = 'Excluded')
                AND Id IN :ids
                AND Id NOT IN :new Set<Id>()
                AND Industry IN ('Technology', 'Finance')
                AND Type NOT IN ('Other')
                AND Interests__c INCLUDES ('Golf', 'Tennis')
                AND Interests__c EXCLUDES ('Chess')
                AND IsDeleted = false
                AND AnnualRevenue > USD5000
                AND CreatedDate = TODAY
                AND CreatedDate = LAST_N_DAYS:30
                AND LastModifiedDate > 2026-01-01T00:00:00Z
                AND Birthdate__c = 2026-01-01
                AND OwnerId IN (SELECT Id FROM User WHERE IsActive = true)
        ];
    }


    // ============================================================
    // SOQL - relationship / subquery / alias
    // ============================================================

    private List<Account> relationshipSoql() {

        return [
            SELECT
                Id,
                Name,
                Owner.Name,
                Parent.Owner.Name,
                (
                    SELECT Id, FirstName, Account.Name
                    FROM Contacts
                    WHERE Email != NULL
                    ORDER BY LastName
                    LIMIT 10
                )
            FROM Account a
            WHERE a.Industry = 'Technology'
        ];
    }


    // ============================================================
    // SOQL - TYPEOF
    // ============================================================

    private List<Event> typeOfSoql() {

        return [
            SELECT
                Id,
                TYPEOF What
                    WHEN Account THEN Name, Phone
                    WHEN Opportunity THEN Amount, CloseDate
                    ELSE Name
                END
            FROM Event
        ];
    }


    // ============================================================
    // SOQL - aggregate / GROUP BY / ROLLUP / CUBE / HAVING / alias
    // ============================================================

    private void aggregateSoql() {

        List<AggregateResult> aggregates = [
            SELECT
                Industry,
                COUNT(Id) total,
                COUNT_DISTINCT(OwnerId),
                MIN(AnnualRevenue),
                MAX(AnnualRevenue),
                SUM(AnnualRevenue),
                AVG(AnnualRevenue)
            FROM Account
            GROUP BY Industry
            HAVING COUNT(Id) > 10
            ORDER BY COUNT(Id) DESC
        ];

        Integer total = [SELECT COUNT() FROM Account];

        List<AggregateResult> rollup = [
            SELECT Industry, Type, GROUPING(Industry), COUNT(Id)
            FROM Account
            GROUP BY ROLLUP(Industry, Type)
        ];

        List<AggregateResult> cube = [
            SELECT Industry, Type, COUNT(Id)
            FROM Account
            GROUP BY CUBE(Industry, Type)
        ];
    }


    // ============================================================
    // SOQL - date functions / FORMAT / TOLABEL / convertCurrency / FIELDS
    // ============================================================

    private void functionSoql() {

        List<AggregateResult> dates = [
            SELECT
                CALENDAR_MONTH(CreatedDate),
                CALENDAR_QUARTER(CreatedDate),
                CALENDAR_YEAR(CreatedDate),
                DAY_IN_MONTH(CreatedDate),
                DAY_IN_WEEK(CreatedDate),
                DAY_IN_YEAR(CreatedDate),
                DAY_ONLY(CreatedDate),
                FISCAL_MONTH(CreatedDate),
                FISCAL_QUARTER(CreatedDate),
                FISCAL_YEAR(CreatedDate),
                HOUR_IN_DAY(CreatedDate),
                WEEK_IN_MONTH(CreatedDate),
                WEEK_IN_YEAR(CreatedDate)
            FROM Account
            GROUP BY CALENDAR_MONTH(CreatedDate), CALENDAR_YEAR(CreatedDate)
        ];

        List<Account> formatted = [
            SELECT Id, FORMAT(CreatedDate), FORMAT(convertCurrency(AnnualRevenue)), TOLABEL(Type)
            FROM Account
        ];

        List<Account> allFields = [SELECT FIELDS(ALL) FROM Account LIMIT 200];

        List<Account> standardFields = [SELECT FIELDS(STANDARD) FROM Account];

        List<Account> customFields = [SELECT FIELDS(CUSTOM) FROM Account LIMIT 200];
    }


    // ============================================================
    // SOQL - DISTANCE / GEOLOCATION
    // ============================================================

    private List<Account> locationSoql(Location here) {

        return [
            SELECT Id
            FROM Account
            WHERE DISTANCE(BillingAddress, GEOLOCATION(37.775, -122.418), 'km') < 20
            ORDER BY DISTANCE(BillingAddress, :here, 'mi')
        ];
    }


    // ============================================================
    // SOQL - USING SCOPE / WITH / ALL ROWS / FOR / UPDATE
    // ============================================================

    private void soqlClauses() {

        List<Account> mine = [SELECT Id FROM Account USING SCOPE Mine];

        List<Account> userMode = [SELECT Id FROM Account WITH USER_MODE];

        List<Account> systemMode = [SELECT Id FROM Account WITH SYSTEM_MODE];

        List<Account> secured = [SELECT Id FROM Account WITH SECURITY_ENFORCED];

        List<Knowledge__kav> articles = [
            SELECT Title
            FROM Knowledge__kav
            WITH DATA CATEGORY Geography__c AT (Usa__c, Uk__c)
                AND Product__c ABOVE_OR_BELOW Mobile__c
                AND Topic__c ABOVE Root__c
                AND Region__c BELOW Asia__c
        ];

        List<Account> deleted = [SELECT Id FROM Account WHERE IsDeleted = true ALL ROWS];

        List<Account> locked = [SELECT Id FROM Account FOR UPDATE];

        List<Account> viewed = [SELECT Id FROM Account FOR VIEW];

        List<Account> referenced = [SELECT Id FROM Account FOR REFERENCE];

        List<FAQ__kav> tracked = [SELECT Id FROM FAQ__kav UPDATE TRACKING, VIEWSTAT];
    }


    // ============================================================
    // SOSL
    // ============================================================

    private void soslExamples(String keyword) {

        List<List<SObject>> simple = [FIND 'test' IN ALL FIELDS RETURNING Account, Contact];

        List<List<SObject>> bound = [
            FIND :keyword
            IN NAME FIELDS
            RETURNING
                Account(Id, Name WHERE Industry = 'Technology' ORDER BY Name LIMIT 10),
                Contact(Id, FirstName, LastName),
                Lead(Id, FirstName, LastName USING LISTVIEW = MyLeads OFFSET 5)
            WITH DIVISION = 'Global'
            WITH SNIPPET (target_length = 120)
            WITH NETWORK IN ('0DBxx0000000001', '0DBxx0000000002')
            WITH PRICEBOOKID = '01sxx0000000001'
            WITH METADATA = 'LABELS'
            LIMIT 100
            UPDATE TRACKING, VIEWSTAT
        ];

        List<List<SObject>> emails = [FIND 'a@example.com' IN EMAIL FIELDS RETURNING Contact(Email)];

        List<List<SObject>> phones = [FIND '555' IN PHONE FIELDS RETURNING Contact];

        List<List<SObject>> sidebar = [FIND 'x' IN SIDEBAR FIELDS RETURNING Account WITH NETWORK = '0DBxx0000000001'];

        List<List<SObject>> categorized = [
            FIND 'help'
            RETURNING KnowledgeArticleVersion(Id, Title)
            WITH DATA CATEGORY Geography__c AT Usa__c
        ];
    }


    // ============================================================
    // Inner class / interface / enum / exception
    // ============================================================

    public virtual class InnerClass implements Handler {

        private String value;

        public InnerClass(String value) {
            this.value = value;
        }

        public void execute() {
            System.debug(value);
        }

        public String getValue() {
            return value;
        }
    }

    public abstract class AbstractHandler {
        public abstract void execute();
    }

    public without sharing class WithoutSharingHandler extends AbstractHandler {
        public override void execute() {
            System.debug('without sharing');
        }
    }

    public enum Status {
        AAA,
        BBB,
        CCC,
        DDD
    }

    enum EmptyEnum {}

    public interface Handler {
        void execute();
    }

    public interface ExtendedHandler extends Handler, Comparable {
        String describe(Integer level, List<String> tags);
    }

    public class CustomException extends Exception {
    }
}
