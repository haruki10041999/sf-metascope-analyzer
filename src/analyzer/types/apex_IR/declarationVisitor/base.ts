import { ApexErrorTypeClass, ApexCommonTypeClass } from '../commonVisitor';

export class DeclarationTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass;
    constructor(type: TName, value: T | ApexErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }
}

export class DeclarationListTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: (T | ApexErrorTypeClass)[];
    constructor(type: TName, value: (T | ApexErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ApexErrorTypeClass)[] {
        return this.value;
    }
}

export type DeclarationAllTypeClass =
    DeclarationTypeClass<string, unknown> | DeclarationListTypeClass<string, unknown>;

export const isDeclarationTypeAll = (
    target: ApexCommonTypeClass<string>,
): target is DeclarationAllTypeClass => {
    return target instanceof DeclarationTypeClass || target instanceof DeclarationListTypeClass;
};
