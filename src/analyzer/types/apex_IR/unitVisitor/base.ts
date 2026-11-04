import { ApexErrorTypeClass, ApexCommonTypeClass } from '../commonVisitor';

export class UnitValueTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T;
    constructor(type: TName, value: T) {
        super(type);
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

export class UnitTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass;
    constructor(type: TName, value: T | ApexErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }
}

export class UnitListTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: (T | ApexErrorTypeClass)[];
    constructor(type: TName, value: (T | ApexErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ApexErrorTypeClass)[] {
        return this.value;
    }
}

export type UnitAllTypeClass =
    | UnitValueTypeClass<string, unknown>
    | UnitTypeClass<string, unknown>
    | UnitListTypeClass<string, unknown>;

export const isUnitTypeAll = (target: ApexCommonTypeClass<string>): target is UnitAllTypeClass => {
    return (
        target instanceof UnitValueTypeClass ||
        target instanceof UnitTypeClass ||
        target instanceof UnitListTypeClass
    );
};
