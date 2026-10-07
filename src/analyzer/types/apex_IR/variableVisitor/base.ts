import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export class VariableTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class VariableListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];
    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type VariableAllTypeClass = VariableTypeClass<unknown> | VariableListTypeClass<unknown>;

export const isVariableTypeAll = (target: CommonTypeClass): target is VariableAllTypeClass => {
    return target instanceof VariableTypeClass || target instanceof VariableListTypeClass;
};
