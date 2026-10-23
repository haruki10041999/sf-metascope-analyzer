import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class ModifierTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;
    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export const isModifierTypeAll = (
    target: CommonTypeClass<string>,
): target is ModifierTypeClass<string, unknown> => {
    return target instanceof ModifierTypeClass;
};
