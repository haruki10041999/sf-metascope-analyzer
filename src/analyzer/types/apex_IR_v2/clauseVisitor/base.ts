import { ApexErrorTypeClass, ApexCommonTypeClass } from '../commonVisitor';

export class ClauseValueTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T;

    constructor(type: TName, value: T) {
        super(type);
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

export class ClauseTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass;
    constructor(type: TName, value: T | ApexErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }
}

export class ClauseValueListTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T[];
    constructor(type: TName, value: T[]) {
        super(type);
        this.value = value;
    }

    getValue(): T[] {
        return this.value;
    }
}

export class ClauseListTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: (T | ApexErrorTypeClass)[];
    constructor(type: TName, value: (T | ApexErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ApexErrorTypeClass)[] {
        return this.value;
    }
}

export type ClauseAllTypeClass =
    | ClauseValueTypeClass<string, unknown>
    | ClauseTypeClass<string, unknown>
    | ClauseValueListTypeClass<string, unknown>
    | ClauseListTypeClass<string, unknown>;

export const isClauseTypeAll = (
    target: ApexCommonTypeClass<string>,
): target is ClauseAllTypeClass => {
    return (
        target instanceof ClauseValueTypeClass ||
        target instanceof ClauseTypeClass ||
        target instanceof ClauseValueListTypeClass ||
        target instanceof ClauseListTypeClass
    );
};
