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

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class ArrayCreatorRestTypeClass extends RestTypeClass<ArrayInitializerTypeClass | null> {
    private size: BasedExpressionTypeClass | ErrorTypeClass | null = null;
    private constructor(
        value: ArrayInitializerTypeClass | ErrorTypeClass | null,
        size: BasedExpressionTypeClass | ErrorTypeClass | null,
    ) {
        super('arrayCreatorRest', value);
        this.size = size;
    }

    static create(ctx: ArrayCreatorRestContext): ArrayCreatorRestTypeClass {
        if (!ctx.expression() && !ctx.arrayInitializer()) {
            throw new Error('値が異常です。ArrayCreatorRestContext: ' + ctx.getText());
        }

        const value = ctx.arrayInitializer()
            ? isValidClass(
                  new VariableVisitor().visit(ctx.arrayInitializer()),
                  isArrayInitializerType,
                  'arrayInitializer',
              )
            : null;

        const size = ctx.expression()
            ? isValidClass(
                  new ExpressionVisitor().visit(ctx.expression()),
                  isBasedExpressionType,
                  'expression',
              )
            : null;

        return new ArrayCreatorRestTypeClass(value, size);
    }

    getSize(): BasedExpressionTypeClass | ErrorTypeClass | null {
        return this.size;
    }
}

export const isArrayCreatorRestType = (
    target: CommonTypeClass,
): target is ArrayCreatorRestTypeClass => {
    return target instanceof ArrayCreatorRestTypeClass;
};
