import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export class TypeTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;

    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class TypeListBaseTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: (T | ErrorTypeClass)[];

    constructor(type: TName, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type TypeAllTypeClass =
    TypeTypeClass<string, unknown> | TypeListBaseTypeClass<string, unknown>;

export const isTypeTypeAll = (target: CommonTypeClass<string>): target is TypeAllTypeClass => {
    return target instanceof TypeTypeClass || target instanceof TypeListBaseTypeClass;
};
