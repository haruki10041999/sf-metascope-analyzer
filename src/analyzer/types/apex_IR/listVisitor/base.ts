import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export class ListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];

    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export const isListTypeAll = (target: CommonTypeClass): target is ListTypeClass<unknown> => {
    return target instanceof ListTypeClass;
};
