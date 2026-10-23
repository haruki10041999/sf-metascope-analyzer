import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class NameTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;
    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class NameListTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: (T | ErrorTypeClass)[];
    constructor(type: TName, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type NameAllTypeClass = NameTypeClass<string, unknown> | NameListTypeClass<string, unknown>;

export const isNameTypeAll = (target: CommonTypeClass<string>): target is NameAllTypeClass => {
    return target instanceof NameTypeClass || target instanceof NameListTypeClass;
};
