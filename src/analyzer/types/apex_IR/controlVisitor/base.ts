import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class ControlTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;
    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export const isControlTypeAll = (
    target: CommonTypeClass<string>,
): target is ControlTypeClass<string, unknown> => {
    return target instanceof ControlTypeClass;
};
