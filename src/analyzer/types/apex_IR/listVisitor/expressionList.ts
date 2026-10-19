import { ExpressionListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '.';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';

import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class ExpressionListTypeClass extends ListTypeClass<BasedExpressionTypeClass> {
    private constructor(value: (BasedExpressionTypeClass | ErrorTypeClass)[]) {
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
                isBasedExpressionType,
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
