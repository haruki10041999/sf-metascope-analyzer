import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export class ArgumentsTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass | null = null;
    constructor(type: string, value: T | ErrorTypeClass | null) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass | null {
        return this.value;
    }
}

export const isArugumentsTypeAll = (
    target: CommonTypeClass,
): target is ArgumentsTypeClass<unknown> => {
    return target instanceof ArgumentsTypeClass;
};
