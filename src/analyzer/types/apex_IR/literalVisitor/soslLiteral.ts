import { SoslLiteralContext } from '@apexdevtools/apex-parser';

import { LiteralTypeClass } from '.';

import {
    BoundExpressionTypeClass,
    ExpressionVisitor,
    isBoundExpressionType,
} from '../expressionVisitor';
import { SoslClausesTypeClass, ClauseVisitor, isSoslClausesType } from '../clauseVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class SoslLiteralTypeClass extends LiteralTypeClass<string | BoundExpressionTypeClass> {
    private soslClauses: SoslClausesTypeClass | ErrorTypeClass;

    private constructor(
        value: string | BoundExpressionTypeClass | ErrorTypeClass,
        soslClauses: SoslClausesTypeClass | ErrorTypeClass,
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
                : isValidClass(
                      new ExpressionVisitor().visit(ctx.boundExpression()),
                      isBoundExpressionType,
                      'boundExpression',
                  ),
            isValidClass(
                new ClauseVisitor().visit(ctx.soslClauses()),
                isSoslClausesType,
                'soslClauses',
            ),
        );
    }

    getSoslClauses(): SoslClausesTypeClass | ErrorTypeClass {
        return this.soslClauses;
    }
}

export const isSoslLiteralType = (target: CommonTypeClass): target is SoslLiteralTypeClass => {
    return target instanceof SoslLiteralTypeClass;
};

