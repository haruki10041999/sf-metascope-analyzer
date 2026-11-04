import { ApexCommonTypeClass, ApexErrorTypeClass } from '../commonVisitor';

export class TypeValueTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T;

    constructor(type: TName, value: T) {
        super(type);
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

export class TypeTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass;

    constructor(type: TName, value: T | ApexErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }
}

export class TypeListBaseTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: (T | ApexErrorTypeClass)[];

    constructor(type: TName, value: (T | ApexErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ApexErrorTypeClass)[] {
        return this.value;
    }
}

export type TypeAllTypeClass =
    | TypeValueTypeClass<string, unknown>
    | TypeTypeClass<string, unknown>
    | TypeListBaseTypeClass<string, unknown>;

export const isTypeTypeAll = (target: ApexCommonTypeClass<string>): target is TypeAllTypeClass => {
    return (
        target instanceof TypeValueTypeClass ||
        target instanceof TypeTypeClass ||
        target instanceof TypeListBaseTypeClass
    );
};
