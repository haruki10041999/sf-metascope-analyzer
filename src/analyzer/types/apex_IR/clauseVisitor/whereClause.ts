import { WhereClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import {
    WhereLogicalExpressionTypeClass,
    ExpressionVisitor,
    isWhereLogicalExpressionType,
} from '../expressionVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class WhereClauseTypeClass extends ClauseTypeClass<
    'whereClause',
    WhereLogicalExpressionTypeClass
> {
    private constructor(value: WhereLogicalExpressionTypeClass | ApexErrorTypeClass) {
        super('whereClause', value);
    }

    static create(ctx: WhereClauseContext): WhereClauseTypeClass {
        if (!ctx.whereLogicalExpression()) {
            throw new Error('値が異常です。WhereClauseContext: ' + ctx.getText());
        }

        return new WhereClauseTypeClass(
            visitNode(
                new ExpressionVisitor(),
                ctx.whereLogicalExpression(),
                isWhereLogicalExpressionType,
                'whereLogicalExpression',
            ),
        );
    }
}

export const isWhereClauseType = (
    target: ApexCommonTypeClass<string>,
): target is WhereClauseTypeClass => {
    return target instanceof WhereClauseTypeClass;
};
