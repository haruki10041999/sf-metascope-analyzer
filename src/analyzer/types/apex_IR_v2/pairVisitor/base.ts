import { ApexErrorTypeClass, ApexCommonTypeClass } from '../commonVisitor';

export class PairTypeClass<TName extends string, Tleft, Tright> extends ApexCommonTypeClass<TName> {
    private left: Tleft | ApexErrorTypeClass;
    private right: Tright | ApexErrorTypeClass;

    constructor(type: TName, left: Tleft | ApexErrorTypeClass, right: Tright | ApexErrorTypeClass) {
        super(type);
        this.left = left;
        this.right = right;
    }

    getLeft(): Tleft | ApexErrorTypeClass {
        return this.left;
    }

    getRight(): Tright | ApexErrorTypeClass {
        return this.right;
    }
}

export class PairListTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: (T | ApexErrorTypeClass)[];

    constructor(type: TName, value: (T | ApexErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ApexErrorTypeClass)[] {
        return this.value;
    }
}

export type PairAllTypeClass =
    PairTypeClass<string, unknown, unknown> | PairListTypeClass<string, unknown>;

export const isPairTypeAll = (target: ApexCommonTypeClass<string>): target is PairAllTypeClass => {
    return target instanceof PairTypeClass || target instanceof PairListTypeClass;
};
