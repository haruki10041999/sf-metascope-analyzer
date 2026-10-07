import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class NameTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class NameListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];
    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type NameAllTypeClass = NameTypeClass<unknown> | NameListTypeClass<unknown>;

export const isNameTypeAll = (target: CommonTypeClass): target is NameAllTypeClass => {
    return target instanceof NameTypeClass || target instanceof NameListTypeClass;
};
