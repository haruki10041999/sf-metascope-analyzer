import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class RestTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class RestListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];
    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type RestAllTypeClass = RestTypeClass<unknown> | RestListTypeClass<unknown>;

export const isRestTypeAll = (target: CommonTypeClass): target is RestAllTypeClass => {
    return target instanceof RestTypeClass || target instanceof RestListTypeClass;
};
