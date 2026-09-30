import {
    ApexParserBaseVisitor,
    ArgumentsContext,
    TypeArgumentsContext,
} from '@apexdevtools/apex-parser';

import { NormalArgumentsTypeClass } from './normal';
import { TypeArgumentsTypeClass } from './typeArguments';

import { CommonTypeClass, ContextTypeClass, CommonVisitor, ErrorTypeClass } from '../commonVisitor';

export { isNormalArgumentsType, NormalArgumentsTypeClass } from './normal';
export { isTypeArgumentsType, TypeArgumentsTypeClass } from './typeArguments';

export class ArgumentsTypeClass extends ContextTypeClass {
    constructor(type: string, value: any | null, errorClasses: Record<string, ErrorTypeClass>) {
        super(type, value, errorClasses);
    }
}

export const isArugumentsTypeAll = (target: CommonTypeClass): target is ArgumentsTypeClass => {
    return target instanceof ArgumentsTypeClass;
};

export class ArgumentsVisitor extends CommonVisitor<ArgumentsTypeClass> {
    visitArguments(ctx: ArgumentsContext) {
        return NormalArgumentsTypeClass.create(ctx);
    }

    visitTypeArguments(ctx: TypeArgumentsContext) {
        return TypeArgumentsTypeClass.create(ctx);
    }
}
