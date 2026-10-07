import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class ParameterTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export const isParameterTypeAll = (
    target: CommonTypeClass,
): target is ParameterTypeClass<unknown> => {
    return target instanceof ParameterTypeClass;
};
