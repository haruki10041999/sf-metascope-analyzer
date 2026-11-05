/**
 * Diff 動作検証用サンプル（変更前）。after/AccountService.cls と比べる。
 * 期待する差分は docs/examples/apex/README.md を参照。
 */
@RestResource(urlMapping='/accounts/*')
public with sharing class AccountService extends BaseService implements Schedulable {

    public static final Integer MAX_SIZE = 100;

    private String name = 'default';

    private Integer first = 1, second = 2;

    ;

    static {
        counter = 0;
    }

    {
        name = 'init';
    }

    public String label { get; set; }

    public Integer total {
        get { return total; }
        private set { total = value; }
    }

    public enum Status { ACTIVE, INACTIVE, DELETED }

    public interface Handler {
        void handle(Account acc);
        Integer count();
    }

    public class Wrapper {
        public Account record;

        public Wrapper(Account record) {
            this.record = record;
        }
    }

    public AccountService() {
        this('default');
    }

    public AccountService(String name) {
        this.name = name;
    }

    @Future(callout=true)
    public static void sync(Set<Id> ids) {
        List<Account> accounts = [SELECT Id, Name FROM Account WHERE Id IN :ids ORDER BY Name ASC LIMIT 100];
        for (Account acc : accounts) {
            acc.Name = acc.Name.trim();
        }
        update accounts;
    }

    public Integer calc(Integer a, Integer b) {
        Integer result = a + b;
        if (result > MAX_SIZE) {
            result = MAX_SIZE;
        } else if (result < 0) {
            result = 0;
        }
        return result;
    }

    public void process(List<Account> accounts) {
        Integer i = 0;
        while (i < accounts.size()) {
            i++;
        }
        do {
            i--;
        } while (i > 0);
        for (Integer j = 0; j < 10; j++) {
            if (j == 1) {
                continue;
            }
            if (j == 2) {
                break;
            }
            log(j);
        }
        try {
            insert accounts;
        } catch (DmlException e) {
            log(e.getMessage());
        } finally {
            log('done');
        }
    }

    public String describe(Status s) {
        switch on s {
            when ACTIVE {
                return 'active';
            }
            when else {
                return 'other';
            }
        }
    }

    public void search(String key) {
        List<List<SObject>> found = [FIND :key IN ALL FIELDS RETURNING Account(Id, Name), Contact];
        System.runAs(new User(Id = UserInfo.getUserId())) {
            delete [SELECT Id FROM Contact WHERE LastName = 'x'];
        }
        upsert new Account(Name = key) Account.Id;
        merge masterAccount duplicateAccount;
        undelete new Account();
        throw new ServiceException('not supported');
    }

    public List<AggregateResult> stats() {
        return [
            SELECT Name, COUNT(Id) cnt, (SELECT Id FROM Contacts)
            FROM Account a
            USING SCOPE mine
            WHERE (Name LIKE 'a%' AND Industry = 'IT') OR (NOT Rating = 'Hot')
            WITH DATA CATEGORY Geography__c AT (usa__c)
            GROUP BY ROLLUP(Name)
            HAVING COUNT(Id) > 1
            ORDER BY Name DESC NULLS LAST
            LIMIT 10
            OFFSET 5
            FOR VIEW
        ];
    }

    public Object expressions(Object value, List<Integer> numbers) {
        Integer x = (Integer) value;
        Boolean isText = value instanceof String;
        Integer y = -numbers[0] + (x * 2);
        Integer z = isText ? x : y;
        Map<String, Integer> counts = new Map<String, Integer>{ 'a' => 1 };
        Set<String> keys = new Set<String>{ 'a', 'b' };
        Integer[] matrix = new Integer[3];
        List<Account> rows = [SELECT Id FROM Account ALL ROWS];
        List<Account> locked = [SELECT Id FROM Account LIMIT :x FOR UPDATE];
        List<Account> tracked = [SELECT Id FROM Account UPDATE TRACKING];
        return z;
    }

    public void loop() {
        for (Integer k = 0; k < 3; k++) {
            if (k == 1) {
                continue;
            }
            if (k == 2) {
                break;
            }
        }
    }

    public void execute(SchedulableContext sc) {
        sync(new Set<Id>());
    }
}
