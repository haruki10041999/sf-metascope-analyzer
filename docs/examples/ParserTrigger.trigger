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


    // ============================================================
    // Before Insert
    // ============================================================

    if (Trigger.isBefore && Trigger.isInsert) {

        for (Account account : Trigger.new) {

            if (String.isBlank(account.Name)) {
                account.Name = 'Default Account';
            }

            account.Description =
                'Created by trigger';
        }
    }


    // ============================================================
    // Before Update
    // ============================================================

    if (Trigger.isBefore && Trigger.isUpdate) {

        for (Account account : Trigger.new) {

            Account oldAccount =
                Trigger.oldMap.get(account.Id);

            if (
                account.Name != oldAccount.Name
            ) {
                account.Description =
                    'Name changed';
            }
        }
    }


    // ============================================================
    // Before Delete
    // ============================================================

    if (Trigger.isBefore && Trigger.isDelete) {

        for (Account account : Trigger.old) {

            System.debug(
                'Deleting: ' + account.Name
            );
        }
    }


    // ============================================================
    // After Insert
    // ============================================================

    if (Trigger.isAfter && Trigger.isInsert) {

        List<Contact> contacts =
            new List<Contact>();

        for (Account account : Trigger.new) {

            contacts.add(
                new Contact(
                    LastName = account.Name,
                    AccountId = account.Id
                )
            );
        }

        if (!contacts.isEmpty()) {
            insert contacts;
        }
    }


    // ============================================================
    // After Update
    // ============================================================

    if (Trigger.isAfter && Trigger.isUpdate) {

        Set<Id> accountIds =
            new Set<Id>();

        accountIds.addAll(
            Trigger.newMap.keySet()
        );

        List<Account> accounts = [
            SELECT
                Id,
                Name,
                Industry,
                (
                    SELECT
                        Id,
                        FirstName,
                        LastName
                    FROM Contacts
                )
            FROM Account
            WHERE Id IN :accountIds
        ];

        for (Account account : accounts) {

            for (Contact contact : account.Contacts) {

                System.debug(contact.Name);
            }
        }
    }


    // ============================================================
    // After Delete
    // ============================================================

    if (Trigger.isAfter && Trigger.isDelete) {

        for (Account account : Trigger.old) {

            System.debug(
                'Deleted: ' + account.Id
            );
        }
    }


    // ============================================================
    // After Undelete
    // ============================================================

    if (Trigger.isAfter && Trigger.isUndelete) {

        for (Account account : Trigger.new) {

            System.debug(
                'Restored: ' + account.Id
            );
        }
    }
}