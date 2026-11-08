import { SoslLiteralContext } from '@apexdevtools/apex-parser';

import { LiteralTypeClass } from '.';

import {
    BoundExpressionTypeClass,
    ExpressionVisitor,
    isBoundExpressionType,
} from '../expressionVisitor';
import { SoslClausesTypeClass, ClauseVisitor, isSoslClausesType } from '../clauseVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class SoslLiteralTypeClass extends LiteralTypeClass<
    'soslLiteral',
    string | BoundExpressionTypeClass
> {
    private soslClauses: SoslClausesTypeClass | ApexErrorTypeClass;

    private constructor(
        value: string | BoundExpressionTypeClass | ApexErrorTypeClass,
        soslClauses: SoslClausesTypeClass | ApexErrorTypeClass,
    ) {
        super('soslLiteral', value);
        this.soslClauses = soslClauses;
    }

    static create(ctx: SoslLiteralContext): SoslLiteralTypeClass {
        if ((!ctx.FindLiteral() && !ctx.boundExpression()) || !ctx.soslClauses()) {
            throw new Error('値が異常です。SoslLiteralContext: ' + ctx.getText());
        }

        return new SoslLiteralTypeClass(
            ctx.FindLiteral()
                ? ctx.FindLiteral().getText()
                : visitNode(
                      new ExpressionVisitor(),
                      ctx.boundExpression(),
                      isBoundExpressionType,
                      'boundExpression',
                  ),
            visitNode(new ClauseVisitor(), ctx.soslClauses(), isSoslClausesType, 'soslClauses'),
        );
    }

    getSoslClauses(): SoslClausesTypeClass | ApexErrorTypeClass {
        return this.soslClauses;
    }
}

export const isSoslLiteralType = (
    target: ApexCommonTypeClass<string>,
): target is SoslLiteralTypeClass => {
    return target instanceof SoslLiteralTypeClass;
};
