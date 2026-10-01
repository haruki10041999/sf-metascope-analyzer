import { ArrayInitializerContext } from '@apexdevtools/apex-parser';

import { VariableTypeClass } from '.';

import { ExpressionTypeClass, ExpressionVisitor, isExpressionTypeAll } from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class ArrayInitializerTypeClass extends VariableTypeClass<ExpressionTypeClass<unknown>[]> {
    private constructor(
        value: ExpressionTypeClass<unknown>[],
        errorTypeClasses: Record<string, ErrorTypeClass>,
    ) {
        super('arrayInitializer', value, errorTypeClasses);
    }

    public static create(ctx: ArrayInitializerContext) {
        if (!ctx.expression_list() || ctx.expression_list().length === 0) {
            throw new Error('値が異常です。ArrayInitializerContext: ' + ctx.getText());
        }

        const value: ExpressionTypeClass<unknown>[] = [];
        const errorTypeClasses: Record<string, ErrorTypeClass> = {};
        ctx.expression_list().forEach((expressionCtx, index) => {
            const expressionTypeClass = new ExpressionVisitor().visit(expressionCtx);

            if (isExpressionTypeAll(expressionTypeClass)) {
                value.push(expressionTypeClass);
            } else {
                errorTypeClasses[`value_${index}`] = expressionTypeClass;
            }
        });

        return new ArrayInitializerTypeClass(value, errorTypeClasses);
    }
}

export const isArrayInitializerType = (
    target: CommonTypeClass,
): target is ArrayInitializerTypeClass => {
    return target instanceof ArrayInitializerTypeClass;
};

