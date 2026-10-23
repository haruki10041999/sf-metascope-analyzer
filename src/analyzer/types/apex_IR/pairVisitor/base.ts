import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class PairTypeClass<TName extends string, Tleft, Tright> extends CommonTypeClass<TName> {
    private left: Tleft | ErrorTypeClass;
    private right: Tright | ErrorTypeClass;

    constructor(type: TName, left: Tleft | ErrorTypeClass, right: Tright | ErrorTypeClass) {
        super(type);
        this.left = left;
        this.right = right;
    }

    getLeft(): Tleft | ErrorTypeClass {
        return this.left;
    }

    getRight(): Tright | ErrorTypeClass {
        return this.right;
    }
}

export class PairListTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: (T | ErrorTypeClass)[];

    constructor(type: TName, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type PairAllTypeClass =
    PairTypeClass<string, unknown, unknown> | PairListTypeClass<string, unknown>;

export const isPairTypeAll = (target: CommonTypeClass<string>): target is PairAllTypeClass => {
    return target instanceof PairTypeClass || target instanceof PairListTypeClass;
};
