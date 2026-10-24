import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class UnitValueTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T;
    constructor(type: TName, value: T) {
        super(type);
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

export class UnitTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;
    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class UnitListTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: (T | ErrorTypeClass)[];
    constructor(type: TName, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type UnitAllTypeClass =
    | UnitValueTypeClass<string, unknown>
    | UnitTypeClass<string, unknown>
    | UnitListTypeClass<string, unknown>;

export const isUnitTypeAll = (target: CommonTypeClass<string>): target is UnitAllTypeClass => {
    return (
        target instanceof UnitValueTypeClass ||
        target instanceof UnitTypeClass ||
        target instanceof UnitListTypeClass
    );
};
