import { ApexErrorTypeClass, ApexCommonTypeClass } from '../commonVisitor';

export class RestValueTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T;
    constructor(type: TName, value: T) {
        super(type);
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

export class RestTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass;
    constructor(type: TName, value: T | ApexErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }
}

export class RestListTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: (T | ApexErrorTypeClass)[];
    constructor(type: TName, value: (T | ApexErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ApexErrorTypeClass)[] {
        return this.value;
    }
}

export type RestAllTypeClass =
    | RestValueTypeClass<string, unknown>
    | RestTypeClass<string, unknown>
    | RestListTypeClass<string, unknown>;

export const isRestTypeAll = (target: ApexCommonTypeClass<string>): target is RestAllTypeClass => {
    return (
        target instanceof RestValueTypeClass ||
        target instanceof RestTypeClass ||
        target instanceof RestListTypeClass
    );
};
