import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class LiteralValueTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T;
    constructor(type: TName, value: T) {
        super(type);
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

export class LiteralTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;
    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class PrimitiveLiteralTypeClass<
    TName extends string,
    T,
    TValueType extends string,
> extends CommonTypeClass<TName> {
    private valueType: TValueType;
    private value: T;

    constructor(type: TName, value: T, valueType: TValueType) {
        super(type);
        this.value = value;
        this.valueType = valueType;
    }

    getValue(): T {
        return this.value;
    }

    getValueType(): TValueType {
        return this.valueType;
    }
}

export type LiteralAllTypeClass =
    | LiteralValueTypeClass<string, unknown>
    | LiteralTypeClass<string, unknown>
    | PrimitiveLiteralTypeClass<string, unknown, string>;

export const isLiteralTypeAll = (
    target: CommonTypeClass<string>,
): target is LiteralAllTypeClass => {
    return (
        target instanceof LiteralValueTypeClass ||
        target instanceof LiteralTypeClass ||
        target instanceof PrimitiveLiteralTypeClass
    );
};
