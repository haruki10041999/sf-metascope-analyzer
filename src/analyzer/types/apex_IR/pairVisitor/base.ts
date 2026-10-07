import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class PairTypeClass<Tleft, Tright> extends CommonTypeClass {
    private left: Tleft | ErrorTypeClass;
    private right: Tright | ErrorTypeClass;

    constructor(type: string, left: Tleft | ErrorTypeClass, right: Tright | ErrorTypeClass) {
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

export class PairListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];

    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type PairAllTypeClass = PairTypeClass<unknown, unknown> | PairListTypeClass<unknown>;

export const isPairTypeAll = (target: CommonTypeClass): target is PairAllTypeClass => {
    return target instanceof PairTypeClass || target instanceof PairListTypeClass;
};
