import { ApexErrorTypeClass, ApexCommonTypeClass } from '../commonVisitor';

export class IdValueTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T;

    constructor(type: TName, value: T) {
        super(type);
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

export class IdTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass;

    constructor(type: TName, value: T | ApexErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }
}

export class IdListTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: (T | ApexErrorTypeClass)[];

    constructor(type: TName, value: (T | ApexErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ApexErrorTypeClass)[] {
        return this.value;
    }
}

export type IdAllTypeClass =
    | IdValueTypeClass<string, unknown>
    | IdTypeClass<string, unknown>
    | IdListTypeClass<string, unknown>;

export const isIdTypeAll = (target: ApexCommonTypeClass<string>): target is IdAllTypeClass => {
    return (
        target instanceof IdValueTypeClass ||
        target instanceof IdTypeClass ||
        target instanceof IdListTypeClass
    );
};
