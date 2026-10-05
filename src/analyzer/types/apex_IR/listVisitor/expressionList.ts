import { ExpressionListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '.';

import {
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '../expressionVisitor';

import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class ExpressionListTypeClass extends ListTypeClass<ExpressionAllTypeClass> {
    private constructor(value: (ExpressionAllTypeClass | ErrorTypeClass)[]) {
        super('expressionList', value);
    }

    static create(ctx: ExpressionListContext): ExpressionListTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length === 0) {
            throw new Error('値が異常です。ExpressionListContext: ' + ctx.getText());
        }

        return new ExpressionListTypeClass(
            isValidClassList(
                ctx.expression_list(),
                (ctx) => new ExpressionVisitor().visit(ctx),
                isExpressionTypeAll,
                'expression',
            ),
        );
    }
}

export const isExpressionListType = (
    target: CommonTypeClass,
): target is ExpressionListTypeClass => {
    return target instanceof ExpressionListTypeClass;
};
