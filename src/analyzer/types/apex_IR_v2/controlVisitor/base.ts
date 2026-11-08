import { ApexErrorTypeClass, ApexCommonTypeClass } from '../commonVisitor';

export class ControlTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass;
    constructor(type: TName, value: T | ApexErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }
}

export const isControlTypeAll = (
    target: ApexCommonTypeClass<string>,
): target is ControlTypeClass<string, unknown> => {
    return target instanceof ControlTypeClass;
};
