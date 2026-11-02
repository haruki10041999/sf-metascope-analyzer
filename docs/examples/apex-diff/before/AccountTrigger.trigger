trigger AccountTrigger on Account (before insert, after update) {
    if (Trigger.isBefore) {
        AccountService.validate(Trigger.new);
    }
    System.debug('done');
}
