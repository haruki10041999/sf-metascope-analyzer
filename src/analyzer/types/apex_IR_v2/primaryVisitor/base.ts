import { ApexErrorTypeClass, ApexCommonTypeClass } from '../commonVisitor';

export class PrimaryValueTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T;
    constructor(type: TName, value: T) {
        super(type);
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

export class PrimaryTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass;
    constructor(type: TName, value: T | ApexErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }
}

export type PrimaryAllTypeClass =
    PrimaryValueTypeClass<string, unknown> | PrimaryTypeClass<string, unknown>;

export const isPrimaryTypeAll = (
    target: ApexCommonTypeClass<string>,
): target is PrimaryAllTypeClass => {
    return target instanceof PrimaryValueTypeClass || target instanceof PrimaryTypeClass;
};
