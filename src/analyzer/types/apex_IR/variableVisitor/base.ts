import { ApexCommonTypeClass, ApexErrorTypeClass } from '../commonVisitor';

export class VariableTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass;
    constructor(type: TName, value: T | ApexErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }
}

export class VariableListTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: (T | ApexErrorTypeClass)[];
    constructor(type: TName, value: (T | ApexErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ApexErrorTypeClass)[] {
        return this.value;
    }
}

export type VariableAllTypeClass =
    VariableTypeClass<string, unknown> | VariableListTypeClass<string, unknown>;

export const isVariableTypeAll = (
    target: ApexCommonTypeClass<string>,
): target is VariableAllTypeClass => {
    return target instanceof VariableTypeClass || target instanceof VariableListTypeClass;
};
