import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class IdValueTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T;

    constructor(type: TName, value: T) {
        super(type);
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

export class IdTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;

    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class IdListTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: (T | ErrorTypeClass)[];

    constructor(type: TName, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type IdAllTypeClass =
    | IdValueTypeClass<string, unknown>
    | IdTypeClass<string, unknown>
    | IdListTypeClass<string, unknown>;

export const isIdTypeAll = (target: CommonTypeClass<string>): target is IdAllTypeClass => {
    return (
        target instanceof IdValueTypeClass ||
        target instanceof IdTypeClass ||
        target instanceof IdListTypeClass
    );
};
