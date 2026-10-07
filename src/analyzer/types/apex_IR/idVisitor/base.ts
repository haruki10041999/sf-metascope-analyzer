import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class IdValueTypeClass<T> extends CommonTypeClass {
    private value: T;

    constructor(type: string, value: T) {
        super(type);
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

export class IdTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;

    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class IdListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];

    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type IdAllTypeClass =
    IdValueTypeClass<unknown> | IdTypeClass<unknown> | IdListTypeClass<unknown>;

export const isIdTypeAll = (target: CommonTypeClass): target is IdAllTypeClass => {
    return (
        target instanceof IdValueTypeClass ||
        target instanceof IdTypeClass ||
        target instanceof IdListTypeClass
    );
};
