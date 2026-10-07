import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class DeclarationTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class DeclarationListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];
    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type DeclarationAllTypeClass =
    DeclarationTypeClass<unknown> | DeclarationListTypeClass<unknown>;

export const isDeclarationTypeAll = (
    target: CommonTypeClass,
): target is DeclarationAllTypeClass => {
    return target instanceof DeclarationTypeClass || target instanceof DeclarationListTypeClass;
};
