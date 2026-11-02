Integer limitSize = 20;

void helper(Integer n) {
    System.debug(LoggingLevel.WARN, n);
}

System.debug('end');
for (Integer k = 0; k < 5; k++) {
    if (k == 1) {
        System.debug('skip');
        continue;
    }
    if (k >= 2) {
        System.debug('stop');
        break;
    }
}
helper(limitSize);
