import { ApexErrorTypeClass, ApexCommonTypeClass } from '../commonVisitor';

export class ModifierTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass;
    constructor(type: TName, value: T | ApexErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }
}

export const isModifierTypeAll = (
    target: ApexCommonTypeClass<string>,
): target is ModifierTypeClass<string, unknown> => {
    return target instanceof ModifierTypeClass;
};
