import { ApexErrorTypeClass, ApexCommonTypeClass } from '../commonVisitor';

export class BodyTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: (T | ApexErrorTypeClass)[];
    constructor(type: TName, value: (T | ApexErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ApexErrorTypeClass)[] {
        return this.value;
    }
}

export const isBodyTypeAll = (
    target: ApexCommonTypeClass<string>,
): target is BodyTypeClass<string, unknown> => {
    return target instanceof BodyTypeClass;
};
