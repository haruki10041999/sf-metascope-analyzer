import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class ClauseTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;
    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class ClauseListTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: (T | ErrorTypeClass)[];
    constructor(type: TName, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type ClauseAllTypeClass =
    ClauseTypeClass<string, unknown> | ClauseListTypeClass<string, unknown>;

export const isClauseTypeAll = (target: CommonTypeClass<string>): target is ClauseAllTypeClass => {
    return target instanceof ClauseTypeClass || target instanceof ClauseListTypeClass;
};
