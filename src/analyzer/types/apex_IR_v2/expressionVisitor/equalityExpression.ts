import { EqualityExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleStringOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

type EqualityOperatorType = '===' | '!==' | '==' | '!=' | '<>';

export class EqualityExpressionTypeClass extends DoubleStringOperatorExpressionTypeClass<
    'equalityExpression',
    BasedExpressionTypeClass,
    EqualityOperatorType,
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ApexErrorTypeClass,
        right: BasedExpressionTypeClass | ApexErrorTypeClass,
        operator: EqualityOperatorType,
    ) {
        super('equalityExpression', left, right, operator);
    }

    static create(ctx: EqualityExpressionContext): EqualityExpressionTypeClass {
        if (
            !ctx.expression_list() ||
            ctx.expression_list().length !== 2 ||
            !(
                ctx.TRIPLEEQUAL() ||
                ctx.TRIPLENOTEQUAL() ||
                ctx.EQUAL() ||
                ctx.NOTEQUAL() ||
                ctx.LESSANDGREATER()
            )
        ) {
            throw new Error('値が異常です。EqualityExpressionContext: ' + ctx.getText());
        }

        let operator: EqualityOperatorType;

        if (ctx.TRIPLEEQUAL()) {
            operator = '===';
        } else if (ctx.TRIPLENOTEQUAL()) {
            operator = '!==';
        } else if (ctx.EQUAL()) {
            operator = '==';
        } else if (ctx.NOTEQUAL()) {
            operator = '!=';
        } else {
            operator = '<>';
        }

        return new EqualityExpressionTypeClass(
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(0),
                isBasedExpressionType,
                'expression',
            ),
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(1),
                isBasedExpressionType,
                'expression',
            ),
            operator,
        );
    }
}

export const isEqualityExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is EqualityExpressionTypeClass => {
    return target instanceof EqualityExpressionTypeClass;
};
