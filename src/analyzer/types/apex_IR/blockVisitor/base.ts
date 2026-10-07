import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class BlockTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class BlockListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];
    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type BlockAllTypeClass = BlockTypeClass<unknown> | BlockListTypeClass<unknown>;

export const isBlockTypeAll = (target: CommonTypeClass): target is BlockAllTypeClass => {
    return target instanceof BlockTypeClass || target instanceof BlockListTypeClass;
};
