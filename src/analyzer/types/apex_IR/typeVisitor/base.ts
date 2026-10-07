import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export class TypeTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;

    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class TypeListBaseTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];

    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type TypeAllTypeClass = TypeTypeClass<unknown> | TypeListBaseTypeClass<unknown>;

export const isTypeTypeAll = (target: CommonTypeClass): target is TypeAllTypeClass => {
    return target instanceof TypeTypeClass || target instanceof TypeListBaseTypeClass;
};
