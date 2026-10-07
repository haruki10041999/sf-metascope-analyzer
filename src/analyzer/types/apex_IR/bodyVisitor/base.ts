import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class BodyTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];
    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export const isBodyTypeAll = (target: CommonTypeClass): target is BodyTypeClass<unknown> => {
    return target instanceof BodyTypeClass;
};
