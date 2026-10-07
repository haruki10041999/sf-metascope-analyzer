import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class PrimaryTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export const isPrimaryTypeAll = (target: CommonTypeClass): target is PrimaryTypeClass<unknown> => {
    return target instanceof PrimaryTypeClass;
};
