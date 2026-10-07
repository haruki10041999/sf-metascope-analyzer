import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class ValueTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export const isValueTypeAll = (target: CommonTypeClass): target is ValueTypeClass<unknown> => {
    return target instanceof ValueTypeClass;
};
