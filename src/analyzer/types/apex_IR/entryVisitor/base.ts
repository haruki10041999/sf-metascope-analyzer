import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class EntryTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;
    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export const isEntryTypeAll = (
    target: CommonTypeClass<string>,
): target is EntryTypeClass<string, unknown> => {
    return target instanceof EntryTypeClass;
};
