import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class ModifierTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export const isModifierTypeAll = (
    target: CommonTypeClass,
): target is ModifierTypeClass<unknown> => {
    return target instanceof ModifierTypeClass;
};
