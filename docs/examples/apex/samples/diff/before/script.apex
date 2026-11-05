Integer limitSize = 10;

void helper(Integer n) {
    System.debug(n);
}

for (Integer k = 0; k < 3; k++) {
    if (k == 1) {
        continue;
    }
    if (k == 2) {
        break;
    }
}
helper(limitSize);
System.debug('end');
