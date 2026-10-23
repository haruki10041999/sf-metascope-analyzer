import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export class ArgumentsTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass | null = null;
    constructor(type: TName, value: T | ErrorTypeClass | null) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass | null {
        return this.value;
    }
}

export const isArugumentsTypeAll = (
    target: CommonTypeClass<string>,
): target is ArgumentsTypeClass<string, unknown> => {
    return target instanceof ArgumentsTypeClass;
};
