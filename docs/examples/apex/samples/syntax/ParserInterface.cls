// parser 出力確認用サンプル interface（トップレベル interface ユニット）
public interface ParserInterface extends Comparable, Schedulable {
    void execute(SchedulableContext context);

    Integer count();

    List<Account> findAccounts(String name, Set<Id> ownerIds);

    Map<Id, List<Contact>> groupContacts(List<Account> accounts);

    Database.SaveResult save(SObject record);
}
