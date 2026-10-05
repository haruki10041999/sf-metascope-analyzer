import { ArgumentsContext, TypeArgumentsContext } from '@apexdevtools/apex-parser';

import { NormalArgumentsTypeClass } from './normal';
import { TypeArgumentsTypeClass } from './typeArguments';

import { CommonTypeClass, CommonVisitor, ErrorTypeClass } from '../commonVisitor';

export { isNormalArgumentsType, NormalArgumentsTypeClass } from './normal';
export { isTypeArgumentsType, TypeArgumentsTypeClass } from './typeArguments';

export class ArgumentsTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass | null = null;
    constructor(type: string, value: T | ErrorTypeClass | null) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass | null {
        return this.value;
    }
}

export const isArugumentsTypeAll = (
    target: CommonTypeClass,
): target is ArgumentsTypeClass<unknown> => {
    return target instanceof ArgumentsTypeClass;
};

export class ArgumentsVisitor extends CommonVisitor<ArgumentsTypeClass<unknown>> {
    visitArguments(ctx: ArgumentsContext) {
        return NormalArgumentsTypeClass.create(ctx);
    }

    visitTypeArguments(ctx: TypeArgumentsContext) {
        return TypeArgumentsTypeClass.create(ctx);
    }
}
