import { ArgumentsContext, TypeArgumentsContext } from '@apexdevtools/apex-parser';

import { NormalArgumentsTypeClass } from './normal';
import { TypeArgumentsTypeClass } from './typeArguments';

import { CommonTypeClass, ContextTypeClass, CommonVisitor, ErrorTypeClass } from '../commonVisitor';

export { isNormalArgumentsType, NormalArgumentsTypeClass } from './normal';
export { isTypeArgumentsType, TypeArgumentsTypeClass } from './typeArguments';

export class ArgumentsTypeClass<T> extends ContextTypeClass<T> {
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type, value);
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
