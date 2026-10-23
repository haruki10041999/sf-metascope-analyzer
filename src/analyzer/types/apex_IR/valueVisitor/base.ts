import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class ValueTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;
    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export const isValueTypeAll = (
    target: CommonTypeClass<string>,
): target is ValueTypeClass<string, unknown> => {
    return target instanceof ValueTypeClass;
};
