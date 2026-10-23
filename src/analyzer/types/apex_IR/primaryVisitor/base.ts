import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class PrimaryTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;
    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export const isPrimaryTypeAll = (
    target: CommonTypeClass<string>,
): target is PrimaryTypeClass<string, unknown> => {
    return target instanceof PrimaryTypeClass;
};
