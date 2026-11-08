import { ExpressionListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '.';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';

import { ApexErrorTypeClass, ApexCommonTypeClass, visitNodeList } from '../commonVisitor';

export class ExpressionListTypeClass extends ListTypeClass<
    'expressionList',
    BasedExpressionTypeClass
> {
    private constructor(value: (BasedExpressionTypeClass | ApexErrorTypeClass)[]) {
        super('expressionList', value);
    }

    static create(ctx: ExpressionListContext): ExpressionListTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length === 0) {
            throw new Error('値が異常です。ExpressionListContext: ' + ctx.getText());
        }

        return new ExpressionListTypeClass(
            visitNodeList(
                new ExpressionVisitor(),
                ctx.expression_list(),
                isBasedExpressionType,
                'expression',
            ),
        );
    }
}

export const isExpressionListType = (
    target: ApexCommonTypeClass<string>,
): target is ExpressionListTypeClass => {
    return target instanceof ExpressionListTypeClass;
};
