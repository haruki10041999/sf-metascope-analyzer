import { ArrayCreatorRestContext } from '@apexdevtools/apex-parser';

import { RestTypeClass } from '.';

import {
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '../expressionVisitor';
import {
    ArrayInitializerTypeClass,
    VariableVisitor,
    isArrayInitializerType,
} from '../variableVisitor';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class ArrayCreatorRestTypeClass extends RestTypeClass<ArrayInitializerTypeClass | null> {
    private size: ExpressionAllTypeClass | ErrorTypeClass | null = null;
    private constructor(
        value: ArrayInitializerTypeClass | ErrorTypeClass | null,
        size: ExpressionAllTypeClass | ErrorTypeClass | null,
    ) {
        super('arrayCreatorRest', value);
        this.size = size;
    }

    static create(ctx: ArrayCreatorRestContext): ArrayCreatorRestTypeClass {
        if (!ctx) {
            throw new Error('値が異常です。ArrayCreatorRestContext: ' + ctx);
        }

        const value = ctx.expression()
            ? isValidClass(
                  new ExpressionVisitor().visit(ctx.expression()),
                  isExpressionTypeAll,
                  'expression',
              )
            : null;

        const size = ctx.arrayInitializer()
            ? isValidClass(
                  new VariableVisitor().visit(ctx.arrayInitializer()),
                  isArrayInitializerType,
                  'arrayInitializer',
              )
            : null;

        return new ArrayCreatorRestTypeClass(value, size);
    }

    getSize(): ExpressionAllTypeClass | ErrorTypeClass | null {
        return this.size;
    }
}

export const isArrayCreatorRestType = (
    target: CommonTypeClass,
): target is ArrayCreatorRestTypeClass => {
    return target instanceof ArrayCreatorRestTypeClass;
};

