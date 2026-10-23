import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class ParameterTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;
    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export const isParameterTypeAll = (
    target: CommonTypeClass<string>,
): target is ParameterTypeClass<string, unknown> => {
    return target instanceof ParameterTypeClass;
};
