import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class ControlTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export const isControlTypeAll = (target: CommonTypeClass): target is ControlTypeClass<unknown> => {
    return target instanceof ControlTypeClass;
};
