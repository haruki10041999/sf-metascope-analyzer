import { ApexErrorTypeClass, ApexCommonTypeClass } from '../commonVisitor';

export class NameTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass;
    constructor(type: TName, value: T | ApexErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }
}

export class NameListTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: (T | ApexErrorTypeClass)[];
    constructor(type: TName, value: (T | ApexErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ApexErrorTypeClass)[] {
        return this.value;
    }
}

export type NameAllTypeClass = NameTypeClass<string, unknown> | NameListTypeClass<string, unknown>;

export const isNameTypeAll = (target: ApexCommonTypeClass<string>): target is NameAllTypeClass => {
    return target instanceof NameTypeClass || target instanceof NameListTypeClass;
};
