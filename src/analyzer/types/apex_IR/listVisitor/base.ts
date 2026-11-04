import { ApexCommonTypeClass, ApexErrorTypeClass } from '../commonVisitor';

export class ListTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: (T | ApexErrorTypeClass)[];

    constructor(type: TName, value: (T | ApexErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ApexErrorTypeClass)[] {
        return this.value;
    }
}

export const isListTypeAll = (
    target: ApexCommonTypeClass<string>,
): target is ListTypeClass<string, unknown> => {
    return target instanceof ListTypeClass;
};
