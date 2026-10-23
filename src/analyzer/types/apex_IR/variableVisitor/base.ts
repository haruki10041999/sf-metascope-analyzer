import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export class VariableTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;
    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class VariableListTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: (T | ErrorTypeClass)[];
    constructor(type: TName, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type VariableAllTypeClass =
    VariableTypeClass<string, unknown> | VariableListTypeClass<string, unknown>;

export const isVariableTypeAll = (
    target: CommonTypeClass<string>,
): target is VariableAllTypeClass => {
    return target instanceof VariableTypeClass || target instanceof VariableListTypeClass;
};
