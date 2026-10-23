import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

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

export type RestAllTypeClass = RestTypeClass<string, unknown> | RestListTypeClass<string, unknown>;

export const isRestTypeAll = (target: CommonTypeClass<string>): target is RestAllTypeClass => {
    return target instanceof RestTypeClass || target instanceof RestListTypeClass;
};
