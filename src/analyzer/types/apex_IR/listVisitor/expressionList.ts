import { ExpressionListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '.';

import { ExpressionTypeClass, ExpressionVisitor, isExpressionTypeAll } from '../expressionVisitor';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class ExpressionListTypeClass extends ListTypeClass<ExpressionTypeClass<unknown>[]> {
    private constructor(
        value: ExpressionTypeClass<unknown>[],
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('expressionList', value, errorClasses);
    }

    static create(ctx: ExpressionListContext): ExpressionListTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length === 0) {
            throw new Error('値が異常です。ExpressionListContext: ' + ctx.getText());
        }

        const value: ExpressionTypeClass<unknown>[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        ctx.expression_list().forEach((expressionCtx, index) => {
            const expressionTypeClass = new ExpressionVisitor().visit(expressionCtx);

            if (isExpressionTypeAll(expressionTypeClass)) {
                value.push(expressionTypeClass);
            } else {
                errorClasses[`value_${index}`] = expressionTypeClass;
            }
        });

        return new ExpressionListTypeClass(value, errorClasses);
    }
}

export const isExpressionListType = (
    target: CommonTypeClass,
): target is ExpressionListTypeClass => {
    return target instanceof ExpressionListTypeClass;
};
