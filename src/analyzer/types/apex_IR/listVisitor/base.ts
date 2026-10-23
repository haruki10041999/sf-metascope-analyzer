import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export class ListTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: (T | ErrorTypeClass)[];

    constructor(type: TName, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export const isListTypeAll = (
    target: CommonTypeClass<string>,
): target is ListTypeClass<string, unknown> => {
    return target instanceof ListTypeClass;
};
