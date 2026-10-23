import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class DeclarationTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;
    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class DeclarationListTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: (T | ErrorTypeClass)[];
    constructor(type: TName, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type DeclarationAllTypeClass =
    DeclarationTypeClass<string, unknown> | DeclarationListTypeClass<string, unknown>;

export const isDeclarationTypeAll = (
    target: CommonTypeClass<string>,
): target is DeclarationAllTypeClass => {
    return target instanceof DeclarationTypeClass || target instanceof DeclarationListTypeClass;
};
