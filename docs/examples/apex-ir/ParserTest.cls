global with sharing class ParserTest extends BaseParser implements ParserInterface {

    // ============================================================
    // Fields
    // ============================================================

    public static final Integer MAX_SIZE = 100;

    private String name;

    protected Id accountId;

    public List<String> names = new List<String>();

    private Set<Id> accountIds = new Set<Id>();

    private Map<Id, Account> accountMap = new Map<Id, Account>();

    private List<List<String>> nestedList;

    private String[] stringArray;

    private Integer[][] integerMatrix;


    // ============================================================
    // Constructor
    // ============================================================

    public ParserTest() {
        this.name = 'default';
    }

    public ParserTest(String name) {
        this.name = name;
    }


    // ============================================================
    // Simple method
    // ============================================================

    public String getName() {
        return this.name;
    }


    // ============================================================
    // Primitive types
    // ============================================================

    private void primitiveTypes(
        Id idValue,
        String stringValue,
        Integer integerValue,
        Long longValue,
        Double doubleValue,
        Decimal decimalValue,
        Boolean booleanValue,
        Date dateValue,
        Datetime datetimeValue,
        Time timeValue
    ) {
        Blob blobValue;
        Object objectValue;

        System.debug(idValue);
        System.debug(stringValue);
        System.debug(integerValue);
        System.debug(longValue);
        System.debug(doubleValue);
        System.debug(decimalValue);
        System.debug(booleanValue);
        System.debug(dateValue);
        System.debug(datetimeValue);
        System.debug(timeValue);
        System.debug(blobValue);
        System.debug(objectValue);
    }


    // ============================================================
    // Generic types
    // ============================================================

    private void genericTypes() {

        List<String> stringList = new List<String>();

        Set<Id> idSet = new Set<Id>();

        Map<Id, Account> accountMapLocal =
            new Map<Id, Account>();

        List<Map<Id, Account>> nestedGeneric =
            new List<Map<Id, Account>>();

        Map<String, List<Account>> complexMap =
            new Map<String, List<Account>>();
    }


    // ============================================================
    // Array
    // ============================================================

    private void arrays() {

        String[] values = new String[10];

        Integer[] numbers = new Integer[] {
            1,
            2,
            3
        };

        Integer[][] matrix = new Integer[3][3];

        values[0] = 'test';

        Integer value = numbers[0];

        System.debug(matrix);
    }


    // ============================================================
    // Literals
    // ============================================================

    private void literals() {

        String stringValue = 'Hello World';

        String escapedValue = 'Hello\\nWorld';

        Integer integerValue = 123;

        Long longValue = 123456789L;

        Decimal decimalValue = 123.45;

        Double doubleValue = 12.34;

        Boolean trueValue = true;

        Boolean falseValue = false;

        String nullValue = null;

        Date dateValue = Date.newInstance(2026, 9, 28);

        Datetime datetimeValue =
            Datetime.newInstance(2026, 9, 28, 12, 30, 0);

        Time timeValue =
            Time.newInstance(12, 30, 0, 0);

        String multiline = '''
            This is
            a multiline
            string.
        ''';
    }


    // ============================================================
    // If
    // ============================================================

    private void ifStatements(Integer value) {

        if (value > 100) {
            System.debug('large');
        } else if (value > 50) {
            System.debug('medium');
        } else {
            System.debug('small');
        }
    }


    // ============================================================
    // Loops
    // ============================================================

    private void loops(List<Account> accounts) {

        for (Integer i = 0; i < 10; i++) {
            System.debug(i);
        }

        for (Account account : accounts) {
            System.debug(account.Name);
        }

        while (true) {
            break;
        }

        do {
            System.debug('do while');
        } while (false);
    }


    // ============================================================
    // Switch
    // ============================================================

    private String switchExample(String value) {

        switch on value {
            when 'A' {
                return 'Alpha';
            }
            when 'B' {
                return 'Beta';
            }
            when else {
                return 'Unknown';
            }
        }
    }


    // ============================================================
    // Try / Catch / Finally
    // ============================================================

    private void exceptionHandling() {

        try {

            Account account = [
                SELECT Id, Name
                FROM Account
                LIMIT 1
            ];

            System.debug(account);

        } catch (QueryException e) {

            System.debug(e.getMessage());

        } catch (Exception e) {

            System.debug(e.getMessage());

        } finally {

            System.debug('finally');
        }
    }


    // ============================================================
    // SOQL - basic
    // ============================================================

    private List<Account> basicSoql() {

        List<Account> accounts = [
            SELECT
                Id,
                Name,
                AccountNumber,
                Industry,
                Type,
                AnnualRevenue,
                CreatedDate
            FROM Account
            WHERE Industry = 'Technology'
            ORDER BY Name ASC
            LIMIT 100
        ];

        return accounts;
    }


    // ============================================================
    // SOQL - bind variable
    // ============================================================

    private List<Account> bindSoql(String industry) {

        return [
            SELECT Id, Name
            FROM Account
            WHERE Industry = :industry
        ];
    }


    // ============================================================
    // SOQL - multiple conditions
    // ============================================================

    private List<Account> logicalSoql(
        String industry,
        Decimal revenue
    ) {

        return [
            SELECT Id, Name
            FROM Account
            WHERE
                Industry = :industry
                AND (
                    AnnualRevenue > :revenue
                    OR Name LIKE 'Test%'
                )
                AND NOT Name = 'Excluded'
        ];
    }


    // ============================================================
    // SOQL - IN / NOT IN
    // ============================================================

    private List<Account> collectionSoql(Set<Id> ids) {

        return [
            SELECT Id, Name
            FROM Account
            WHERE Id IN :ids
            AND Id NOT IN :new Set<Id>()
        ];
    }


    // ============================================================
    // SOQL - NULL
    // ============================================================

    private List<Account> nullSoql() {

        return [
            SELECT Id, Name
            FROM Account
            WHERE Phone != NULL
            AND Fax = NULL
        ];
    }


    // ============================================================
    // SOQL - relationship
    // ============================================================

    private List<Contact> relationshipSoql() {

        return [
            SELECT
                Id,
                FirstName,
                LastName,
                Account.Id,
                Account.Name,
                Account.Owner.Name
            FROM Contact
            WHERE Account.Industry = 'Technology'
        ];
    }


    // ============================================================
    // SOQL - child relationship subquery
    // ============================================================

    private List<Account> childRelationshipSoql() {

        return [
            SELECT
                Id,
                Name,
                (
                    SELECT
                        Id,
                        FirstName,
                        LastName,
                        Email
                    FROM Contacts
                    WHERE Email != NULL
                    ORDER BY LastName
                    LIMIT 10
                )
            FROM Account
            WHERE Id != NULL
        ];
    }


    // ============================================================
    // SOQL - nested relationship
    // ============================================================

    private List<Account> nestedRelationshipSoql() {

        return [
            SELECT
                Id,
                Name,
                (
                    SELECT
                        Id,
                        FirstName,
                        Account.Name
                    FROM Contacts
                )
            FROM Account
        ];
    }


    // ============================================================
    // SOQL - aggregate
    // ============================================================

    private List<AggregateResult> aggregateSoql() {

        return [
            SELECT
                Industry,
                COUNT(Id),
                COUNT_DISTINCT(OwnerId),
                MIN(AnnualRevenue),
                MAX(AnnualRevenue),
                SUM(AnnualRevenue),
                AVG(AnnualRevenue)
            FROM Account
            GROUP BY Industry
        ];
    }


    // ============================================================
    // SOQL - GROUP BY ROLLUP
    // ============================================================

    private List<AggregateResult> rollupSoql() {

        return [
            SELECT
                Industry,
                Type,
                COUNT(Id)
            FROM Account
            GROUP BY ROLLUP(Industry, Type)
        ];
    }


    // ============================================================
    // SOQL - GROUP BY CUBE
    // ============================================================

    private List<AggregateResult> cubeSoql() {

        return [
            SELECT
                Industry,
                Type,
                COUNT(Id)
            FROM Account
            GROUP BY CUBE(Industry, Type)
        ];
    }


    // ============================================================
    // SOQL - HAVING
    // ============================================================

    private List<AggregateResult> havingSoql() {

        return [
            SELECT
                Industry,
                COUNT(Id) total
            FROM Account
            GROUP BY Industry
            HAVING COUNT(Id) > 10
        ];
    }


    // ============================================================
    // SOQL - date functions
    // ============================================================

    private List<AggregateResult> dateFunctionSoql() {

        return [
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
            GROUP BY
                CALENDAR_MONTH(CreatedDate),
                CALENDAR_YEAR(CreatedDate)
        ];
    }


    // ============================================================
    // SOQL - FORMAT
    // ============================================================

    private List<Account> formatSoql() {

        return [
            SELECT
                Id,
                FORMAT(CreatedDate)
            FROM Account
        ];
    }


    // ============================================================
    // SOQL - TOLABEL
    // ============================================================

    private List<Account> toLabelSoql() {

        return [
            SELECT
                Id,
                TOLABEL(Type),
                TOLABEL(Industry)
            FROM Account
        ];
    }


    // ============================================================
    // SOQL - CONVERT_CURRENCY
    // ============================================================

    //private List<Account> currencySoql() {
    //
    //    return [
    //        SELECT
    //            Id,
    //           CONVERT_CURRENCY(AnnualRevenue)
    //        FROM Account
    //    ];
    //}


    // ============================================================
    // SOQL - GROUPING
    // ============================================================

    private List<AggregateResult> groupingSoql() {

        return [
            SELECT
                Industry,
                GROUPING(Industry),
                COUNT(Id)
            FROM Account
            GROUP BY ROLLUP(Industry)
        ];
    }


    // ============================================================
    // SOQL - FIELDS
    // ============================================================

    private List<Account> fieldsSoql() {

        return [
            SELECT FIELDS(ALL)
            FROM Account
            LIMIT 200
        ];
    }


    // ============================================================
    // SOQL - FOR
    // ============================================================

    private List<Account> forSoql() {

        return [
            SELECT Id, Name
            FROM Account
            FOR UPDATE
        ];
    }


    // ============================================================
    // SOQL - WITH USER_MODE
    // ============================================================

    private List<Account> userModeSoql() {

        return [
            SELECT Id, Name
            FROM Account
            WITH USER_MODE
        ];
    }


    // ============================================================
    // SOQL - WITH SYSTEM_MODE
    // ============================================================

    private List<Account> systemModeSoql() {

        return [
            SELECT Id, Name
            FROM Account
            WITH SYSTEM_MODE
        ];
    }


    // ============================================================
    // SOQL - OFFSET
    // ============================================================

    private List<Account> offsetSoql() {

        return [
            SELECT Id, Name
            FROM Account
            ORDER BY Name
            LIMIT 50
            OFFSET 10
        ];
    }


    // ============================================================
    // SOSL
    // ============================================================

    private List<List<SObject>> soslExample(String keyword) {

        return [
            FIND :keyword
            IN ALL FIELDS
            RETURNING
                Account(Id, Name),
                Contact(Id, FirstName, LastName),
                Lead(Id, FirstName, LastName)
        ];
    }


    // ============================================================
    // Method call
    // ============================================================

    private void methodCalls() {

        this.getName();

        super.someMethod();

        System.debug('hello');

        String value = String.valueOf(123);

        Integer size = names.size();
    }


    // ============================================================
    // Static method
    // ============================================================

    public static String staticMethod(String value) {

        return value != null
            ? value.toUpperCase()
            : 'NULL';
    }


    // ============================================================
    // Inner class
    // ============================================================

    public class InnerClass {

        private String value;

        public InnerClass(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }
    }


    // ============================================================
    // Inner enum
    // ============================================================

    public enum Status {NEW,PROCESSING,COMPLETED,FAILED}


    // ============================================================
    // Inner interface
    // ============================================================

    public interface Handler {
        void execute();
    }


    // ============================================================
    // Inner exception
    // ============================================================

    public class CustomException extends Exception {
    }


    // ============================================================
    // Anonymous implementation
    // ============================================================

    private void anonymousImplementation() {

        Handler handler = new Handler() {
            public void execute() {
                System.debug('executed');
            }
        };

        handler.execute();
    }


    // ============================================================
    // DML
    // ============================================================

    private void dmlExample(Account account) {

        insert account;

        update account;

        delete account;

        undelete account;

        upsert account;
    }


    // ============================================================
    // Database methods
    // ============================================================

    private void databaseExample(List<Account> accounts) {

        Database.SaveResult[] results =
            Database.insert(accounts, false);

        Database.update(accounts, false);

        Database.delete(accounts, false);

        Database.upsert(accounts, false);
    }


    // ============================================================
    // Ternary
    // ============================================================

    private String ternary(Boolean condition) {

        return condition
            ? 'true'
            : 'false';
    }


    // ============================================================
    // Operators
    // ============================================================

    private Integer operators(
        Integer a,
        Integer b
    ) {

        Integer result = a + b;

        result = a - b;

        result = a * b;

        result = a / b;

        result++;

        result--;

        result += 10;

        result -= 10;

        result *= 2;

        result /= 2;

        return result;
    }


    // ============================================================
    // Cast
    // ============================================================

    private void casting(SObject objectValue) {

        Account account = (Account)objectValue;

        System.debug(account.Name);
    }


    // ============================================================
    // instanceof
    // ============================================================

    private Boolean instanceofExample(SObject value) {

        return value instanceof Account;
    }


    // ============================================================
    // throw
    // ============================================================

    private void throwExample() {

        throw new CustomException('Something went wrong');
    }
}