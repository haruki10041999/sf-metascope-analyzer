import { ApexErrorTypeClass, ApexCommonTypeClass } from '../commonVisitor';

export class BlockTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass;
    constructor(type: TName, value: T | ApexErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }
}

export class BlockListTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: (T | ApexErrorTypeClass)[];
    constructor(type: TName, value: (T | ApexErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ApexErrorTypeClass)[] {
        return this.value;
    }
}

export type BlockAllTypeClass =
    BlockTypeClass<string, unknown> | BlockListTypeClass<string, unknown>;

export const isBlockTypeAll = (target: ApexCommonTypeClass<string>): target is BlockAllTypeClass => {
    return target instanceof BlockTypeClass || target instanceof BlockListTypeClass;
};
