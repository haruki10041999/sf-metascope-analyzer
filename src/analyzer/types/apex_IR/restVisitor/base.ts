import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class RestValueTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T;
    constructor(type: TName, value: T) {
        super(type);
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

export class RestTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;
    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class RestListTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: (T | ErrorTypeClass)[];
    constructor(type: TName, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type RestAllTypeClass =
    | RestValueTypeClass<string, unknown>
    | RestTypeClass<string, unknown>
    | RestListTypeClass<string, unknown>;

export const isRestTypeAll = (target: CommonTypeClass<string>): target is RestAllTypeClass => {
    return (
        target instanceof RestValueTypeClass ||
        target instanceof RestTypeClass ||
        target instanceof RestListTypeClass
    );
};
