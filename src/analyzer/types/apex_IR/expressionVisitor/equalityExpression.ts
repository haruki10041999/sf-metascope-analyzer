import { EqualityExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleStringOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

type EqualityOperatorType = '===' | '!==' | '==' | '!=' | '<>';

export class EqualityExpressionTypeClass extends DoubleStringOperatorExpressionTypeClass<
    'equalityExpression',
    BasedExpressionTypeClass,
    EqualityOperatorType,
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ErrorTypeClass,
        right: BasedExpressionTypeClass | ErrorTypeClass,
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
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(0)),
                isBasedExpressionType,
                'expression',
            ),
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(1)),
                isBasedExpressionType,
                'expression',
            ),
            operator,
        );
    }
}

export const isEqualityExpressionType = (
    target: CommonTypeClass<string>,
): target is EqualityExpressionTypeClass => {
    return target instanceof EqualityExpressionTypeClass;
};
