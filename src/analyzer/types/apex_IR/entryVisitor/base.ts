import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class EntryTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export const isEntryTypeAll = (target: CommonTypeClass): target is EntryTypeClass<unknown> => {
    return target instanceof EntryTypeClass;
};
