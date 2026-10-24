import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class PrimaryValueTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T;
    constructor(type: TName, value: T) {
        super(type);
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

export class PrimaryTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;
    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export type PrimaryAllTypeClass =
    PrimaryValueTypeClass<string, unknown> | PrimaryTypeClass<string, unknown>;

export const isPrimaryTypeAll = (
    target: CommonTypeClass<string>,
): target is PrimaryAllTypeClass => {
    return target instanceof PrimaryValueTypeClass || target instanceof PrimaryTypeClass;
};
