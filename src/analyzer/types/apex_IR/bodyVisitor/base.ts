import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class BodyTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: (T | ErrorTypeClass)[];
    constructor(type: TName, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export const isBodyTypeAll = (
    target: CommonTypeClass<string>,
): target is BodyTypeClass<string, unknown> => {
    return target instanceof BodyTypeClass;
};
