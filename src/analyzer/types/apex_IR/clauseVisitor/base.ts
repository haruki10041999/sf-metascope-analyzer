import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class ClauseTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class ClauseListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];
    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type ClauseAllTypeClass = ClauseTypeClass<unknown> | ClauseListTypeClass<unknown>;

export const isClauseTypeAll = (target: CommonTypeClass): target is ClauseAllTypeClass => {
    return target instanceof ClauseTypeClass || target instanceof ClauseListTypeClass;
};
