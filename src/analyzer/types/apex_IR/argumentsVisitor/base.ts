import { ApexCommonTypeClass, ApexErrorTypeClass } from '../commonVisitor';

export class ArgumentsTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass | null = null;
    constructor(type: TName, value: T | ApexErrorTypeClass | null) {
        super(type);
        this.value = value;
    }

    getValue(): T | ApexErrorTypeClass | null {
        return this.value;
    }
}

export const isArugumentsTypeAll = (
    target: ApexCommonTypeClass<string>,
): target is ArgumentsTypeClass<string, unknown> => {
    return target instanceof ArgumentsTypeClass;
};
