// apex_IR 網羅用サンプルトリガー（全 7 種の triggerCase と、トリガー本体内のメンバー宣言を含む）
trigger ParserTrigger on Account (
    before insert,
    before update,
    before delete,
    after insert,
    after update,
    after delete,
    after undelete
) {

    // ============================================================
    // Trigger context variables
    // ============================================================

    System.debug(Trigger.isExecuting);
    System.debug(Trigger.isBefore);
    System.debug(Trigger.isAfter);
    System.debug(Trigger.isInsert);
    System.debug(Trigger.isUpdate);
    System.debug(Trigger.isDelete);
    System.debug(Trigger.isUndelete);
    System.debug(Trigger.new);
    System.debug(Trigger.old);
    System.debug(Trigger.newMap);
    System.debug(Trigger.oldMap);
    System.debug(Trigger.operationType);
    System.debug(Trigger.size);


    // ============================================================
    // Trigger 内のメンバー宣言（クラス / インターフェース / enum / メソッド / フィールド / プロパティ）
    // ============================================================

    private static final String PREFIX = 'Trigger: ';

    static Integer invocationCount = 0;

    public String label { get; set; }

    private void log(String message) {
        System.debug(PREFIX + message);
    }

    public class TriggerHelper {
        public void run() {
            System.debug('helper');
        }
    }

    public interface TriggerHandler {
        void handle();
    }

    public enum Phase {
        BEFORE_PHASE,
        AFTER_PHASE
    }


    // ============================================================
    // operationType による分岐（switch on enum）
    // ============================================================

    switch on Trigger.operationType {
        when BEFORE_INSERT, BEFORE_UPDATE {
            invocationCount++;
        }
        when AFTER_DELETE {
            invocationCount--;
        }
        when else {
            invocationCount += 0;
        }
    }


    // ============================================================
    // Before Insert
    // ============================================================

    if (Trigger.isBefore && Trigger.isInsert) {

        for (Account account : Trigger.new) {

            if (String.isBlank(account.Name)) {
                account.Name = 'Default Account';
            }

            account.Description = 'Created by trigger';
        }
    }


    // ============================================================
    // Before Update
    // ============================================================

    if (Trigger.isBefore && Trigger.isUpdate) {

        for (Account account : Trigger.new) {

            Account oldAccount = Trigger.oldMap.get(account.Id);

            if (account.Name != oldAccount.Name) {
                account.Description = 'Name changed';
            }

            if (account.AnnualRevenue < 0) {
                account.addError('AnnualRevenue must be positive');
            }
        }
    }


    // ============================================================
    // Before Delete
    // ============================================================

    if (Trigger.isBefore && Trigger.isDelete) {

        for (Account account : Trigger.old) {
            System.debug('Deleting: ' + account.Name);
        }
    }


    // ============================================================
    // After Insert
    // ============================================================

    if (Trigger.isAfter && Trigger.isInsert) {

        List<Contact> contacts = new List<Contact>();

        for (Account account : Trigger.new) {
            contacts.add(
                new Contact(
                    LastName = account.Name,
                    AccountId = account.Id
                )
            );
        }

        if (!contacts.isEmpty()) {
            insert as user contacts;
        }
    }


    // ============================================================
    // After Update
    // ============================================================

    if (Trigger.isAfter && Trigger.isUpdate) {

        Set<Id> accountIds = new Set<Id>();

        accountIds.addAll(Trigger.newMap.keySet());

        List<Account> accounts = [
            SELECT
                Id,
                Name,
                Industry,
                (
                    SELECT Id, FirstName, LastName
                    FROM Contacts
                )
            FROM Account
            WHERE Id IN :accountIds
        ];

        List<Contact> toUpdate = new List<Contact>();

        for (Account account : accounts) {
            for (Contact contact : account.Contacts) {
                contact.Description = account.Name;
                toUpdate.add(contact);
            }
        }

        update toUpdate;
    }


    // ============================================================
    // After Delete
    // ============================================================

    if (Trigger.isAfter && Trigger.isDelete) {

        List<Task> tasks = [SELECT Id FROM Task WHERE WhatId IN :Trigger.oldMap.keySet() ALL ROWS];

        delete tasks;

        for (Account account : Trigger.old) {
            System.debug('Deleted: ' + account.Id);
        }
    }


    // ============================================================
    // After Undelete
    // ============================================================

    if (Trigger.isAfter && Trigger.isUndelete) {

        try {
            for (Account account : Trigger.new) {
                log('Restored: ' + account.Id);
            }
        } catch (Exception e) {
            System.debug(e.getMessage());
        }
    }
}
