import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class ClauseValueTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T;

    constructor(type: TName, value: T) {
        super(type);
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

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

export class ClauseValueListTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T[];
    constructor(type: TName, value: T[]) {
        super(type);
        this.value = value;
    }

    getValue(): T[] {
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
    | ClauseValueTypeClass<string, unknown>
    | ClauseTypeClass<string, unknown>
    | ClauseValueListTypeClass<string, unknown>
    | ClauseListTypeClass<string, unknown>;

export const isClauseTypeAll = (target: CommonTypeClass<string>): target is ClauseAllTypeClass => {
    return (
        target instanceof ClauseValueTypeClass ||
        target instanceof ClauseTypeClass ||
        target instanceof ClauseValueListTypeClass ||
        target instanceof ClauseListTypeClass
    );
};
