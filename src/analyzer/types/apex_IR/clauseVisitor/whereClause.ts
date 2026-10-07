import { WhereClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import {
    WhereLogicalExpressionTypeClass,
    ExpressionVisitor,
    isWhereLogicalExpressionType,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class WhereClauseTypeClass extends ClauseTypeClass<WhereLogicalExpressionTypeClass> {
    private constructor(value: WhereLogicalExpressionTypeClass | ErrorTypeClass) {
        super('whereClause', value);
    }

    static create(ctx: WhereClauseContext): WhereClauseTypeClass {
        if (!ctx.whereLogicalExpression()) {
            throw new Error('値が異常です。WhereClauseContext: ' + ctx.getText());
        }

        return new WhereClauseTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.whereLogicalExpression()),
                isWhereLogicalExpressionType,
                'whereLogicalExpression',
            ),
        );
    }
}

export const isWhereClauseType = (target: CommonTypeClass): target is WhereClauseTypeClass => {
    return target instanceof WhereClauseTypeClass;
};

