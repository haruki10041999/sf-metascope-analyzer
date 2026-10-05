import { ArrayInitializerContext } from '@apexdevtools/apex-parser';

import { VariableListTypeClass } from '.';

import {
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class ArrayInitializerTypeClass extends VariableListTypeClass<ExpressionAllTypeClass> {
    private constructor(value: (ExpressionAllTypeClass | ErrorTypeClass)[]) {
        super('arrayInitializer', value);
    }

    public static create(ctx: ArrayInitializerContext) {
        if (!ctx.expression_list() || ctx.expression_list().length === 0) {
            throw new Error('値が異常です。ArrayInitializerContext: ' + ctx.getText());
        }

        return new ArrayInitializerTypeClass(
            isValidClassList(
                ctx.expression_list(),
                (ctx) => new ExpressionVisitor().visit(ctx),
                isExpressionTypeAll,
                'expression',
            ),
        );
    }
}

export const isArrayInitializerType = (
    target: CommonTypeClass,
): target is ArrayInitializerTypeClass => {
    return target instanceof ArrayInitializerTypeClass;
};
