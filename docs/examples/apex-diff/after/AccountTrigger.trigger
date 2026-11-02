trigger AccountTrigger on Account (after update, before delete) {
    System.debug('start');
    if (Trigger.isBefore && Trigger.isInsert) {
        AccountService.validate(Trigger.new);
    }
    System.debug('done');
}
