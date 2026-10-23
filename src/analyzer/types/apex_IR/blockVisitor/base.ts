import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class BlockTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;
    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class BlockListTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: (T | ErrorTypeClass)[];
    constructor(type: TName, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type BlockAllTypeClass =
    BlockTypeClass<string, unknown> | BlockListTypeClass<string, unknown>;

export const isBlockTypeAll = (target: CommonTypeClass<string>): target is BlockAllTypeClass => {
    return target instanceof BlockTypeClass || target instanceof BlockListTypeClass;
};
