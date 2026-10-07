import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class LiteralTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class PrimitiveLiteralTypeClass<T> extends CommonTypeClass {
    private valueType: string;
    private value: T | ErrorTypeClass;

    constructor(type: string, value: T | ErrorTypeClass, valueType: string) {
        super(type);
        this.value = value;
        this.valueType = valueType;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }

    getValueType(): string | null {
        return this.valueType;
    }
}

export type LiteralAllTypeClass = LiteralTypeClass<unknown> | PrimitiveLiteralTypeClass<unknown>;

export const isLiteralTypeAll = (target: CommonTypeClass): target is LiteralAllTypeClass => {
    return target instanceof LiteralTypeClass || target instanceof PrimitiveLiteralTypeClass;
};
