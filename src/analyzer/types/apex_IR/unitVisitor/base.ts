import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class UnitTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class UnitListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];
    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type UnitAllTypeClass = UnitTypeClass<unknown> | UnitListTypeClass<unknown>;

export const isUnitTypeAll = (target: CommonTypeClass): target is UnitAllTypeClass => {
    return target instanceof UnitTypeClass || target instanceof UnitListTypeClass;
};
