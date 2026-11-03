/**
 * Diff 動作検証用サンプル（変更後）。before/AccountService.cls と比べる。
 * 期待する差分は docs/examples/apex-diff/README.md を参照。
 */
@RestResource(urlMapping='/v2/accounts/*')
public without sharing class AccountService extends BaseService implements Schedulable, Queueable {

    public static final Integer MAX_SIZE = 200;

    protected String name = 'default';

    private Integer first = 1, second = 3, third;

    ;

    static {
        counter = 1;
    }

    {
        name = 'init';
    }

    public String label { get; private set; }

    public Integer total {
        get { return total == null ? 0 : total; }
        private set { total = value; }
    }

    public enum Status { ACTIVE, PENDING, INACTIVE, DELETED }

    public interface Handler {
        void handle(Account acc);
        Long count();
        void reset();
    }

    public class Wrapper {
        public Account record;
        public Boolean selected = false;

        public Wrapper(Account record) {
            this.record = record;
        }
    }

    public AccountService() {
        this('anonymous');
    }

    public AccountService(String name) {
        this.name = name;
    }

    @Future(callout=false)
    public static void sync(Set<Id> ids) {
        List<Account> accounts = [SELECT Name, Id FROM Account WHERE Id IN :ids ORDER BY Name ASC LIMIT 200];
        for (Account acc : accounts) {
            acc.Name = acc.Name.trim();
        }
        update accounts;
    }

    public Integer calc(Integer a, Integer b) {
        Integer result = a + b;
        if (result >= MAX_SIZE) {
            result = MAX_SIZE;
        } else if (result < 0) {
            result = 0;
        }
        return result;
    }

    public Decimal calc(Decimal a, Decimal b) {
        return a + b;
    }

    public void process(List<Account> accounts) {
        Integer i = 0;
        while (i <= accounts.size()) {
            i++;
        }
        do {
            i--;
        } while (i >= 0);
        for (Integer j = 0; j < 10; j += 2) {
            if (j == 0) {
                continue;
            }
            if (j == 3) {
                break;
            }
            log(j);
        }
        try {
            insert as user accounts;
        } catch (DmlException e) {
            log('done');
            log(e.getMessage());
        }
    }

    public String describe(Status s) {
        switch on s {
            when ACTIVE, PENDING {
                return 'active';
            }
            when INACTIVE, DELETED {
                return 'inactive';
            }
            when else {
                return 'other';
            }
        }
    }

    public void search(String key) {
        List<List<SObject>> found = [FIND :key IN ALL FIELDS RETURNING Account(Id, Name, Phone), Contact, Lead];
        System.runAs(new User(Id = UserInfo.getUserId())) {
            delete [SELECT Id FROM Contact WHERE LastName = 'y'];
        }
        upsert new Account(Name = key) Account.External__c;
        merge masterAccount duplicateAccount;
        undelete new Account();
        throw new ServiceException('unsupported operation');
    }

    public List<AggregateResult> stats() {
        return [
            SELECT COUNT(Id) cnt, Name, (SELECT Id FROM Contacts WHERE LastName != null)
            FROM Account acc
            USING SCOPE team
            WHERE (Industry = 'IT' AND Name LIKE 'a%') OR (NOT Rating = 'Warm')
            WITH DATA CATEGORY Geography__c BELOW (usa__c)
            GROUP BY CUBE(Name)
            HAVING COUNT(Id) > 2
            ORDER BY Name ASC NULLS FIRST
            LIMIT 20
            OFFSET 10
            FOR REFERENCE
        ];
    }

    public Object expressions(Object value, List<Integer> numbers) {
        Integer x = (Long) value;
        Boolean isText = value instanceof Id;
        Integer y = +numbers[1] - (x * 3);
        Integer z = isText ? y : x;
        Map<String, Integer> counts = new Map<String, Integer>{ 'a' => 2 };
        Set<String> keys = new Set<String>{ 'b', 'a' };
        Integer[] matrix = new Integer[4];
        List<Account> rows = [SELECT Name FROM Account ALL ROWS];
        List<Account> locked = [SELECT Id FROM Account LIMIT :y FOR UPDATE];
        List<Account> tracked = [SELECT Id FROM Account UPDATE VIEWSTAT];
        return x;
    }

    public void report() {
        System.debug(LoggingLevel.INFO, 'report');
    }

    public void execute(SchedulableContext sc) {
        sync(new Set<Id>());
    }
}
