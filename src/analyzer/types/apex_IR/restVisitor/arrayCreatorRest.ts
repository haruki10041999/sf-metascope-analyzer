import { ArrayCreatorRestContext } from '@apexdevtools/apex-parser';

import { RestTypeClass } from '.';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ArrayInitializerTypeClass,
    VariableVisitor,
    isArrayInitializerType,
} from '../variableVisitor';

import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class ArrayCreatorRestTypeClass extends RestTypeClass<
    'arrayCreatorRest',
    ArrayInitializerTypeClass | null
> {
    private size: BasedExpressionTypeClass | ApexErrorTypeClass | null = null;
    private constructor(
        value: ArrayInitializerTypeClass | ApexErrorTypeClass | null,
        size: BasedExpressionTypeClass | ApexErrorTypeClass | null,
    ) {
        super('arrayCreatorRest', value);
        this.size = size;
    }

    static create(ctx: ArrayCreatorRestContext): ArrayCreatorRestTypeClass {
        if (!ctx.expression() && !ctx.arrayInitializer()) {
            throw new Error('値が異常です。ArrayCreatorRestContext: ' + ctx.getText());
        }

        const value = ctx.arrayInitializer()
            ? isApexValidClass(
                  new VariableVisitor().visit(ctx.arrayInitializer()),
                  isArrayInitializerType,
                  'arrayInitializer',
              )
            : null;

        const size = ctx.expression()
            ? isApexValidClass(
                  new ExpressionVisitor().visit(ctx.expression()),
                  isBasedExpressionType,
                  'expression',
              )
            : null;

        return new ArrayCreatorRestTypeClass(value, size);
    }

    getSize(): BasedExpressionTypeClass | ApexErrorTypeClass | null {
        return this.size;
    }
}

export const isArrayCreatorRestType = (
    target: ApexCommonTypeClass<string>,
): target is ArrayCreatorRestTypeClass => {
    return target instanceof ArrayCreatorRestTypeClass;
};

