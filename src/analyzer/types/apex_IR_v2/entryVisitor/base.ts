import { ApexErrorTypeClass, ApexCommonTypeClass } from '../commonVisitor';

export class EntryTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass;
    constructor(type: TName, value: T | ApexErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }
}

export const isEntryTypeAll = (
    target: ApexCommonTypeClass<string>,
): target is EntryTypeClass<string, unknown> => {
    return target instanceof EntryTypeClass;
};
