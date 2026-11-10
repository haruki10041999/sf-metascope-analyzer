import { AssignExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

type AssignOperatorType =
    '=' | '+=' | '-=' | '*=' | '/=' | '&=' | '|=' | '^=' | '>>=' | '>>>=' | '<<=';

export type AssignExpressionType = TypeField<'assignExpression'> & {
    left: BasedExpressionTypeClass;
    operator: AssignOperatorType;
    right: BasedExpressionTypeClass;
};

export class AssignExpressionTypeClass extends ApexCommonTypeClass<
    'assignExpression',
    AssignExpressionType
> {
    private constructor(fields: FieldsOf<AssignExpressionType>, sourceSpan: SourceSpan) {
        super('assignExpression', fields, sourceSpan);
    }

    static create(ctx: AssignExpressionContext): AssignExpressionTypeClass {
        let operator: AssignOperatorType;
        if (ctx.ASSIGN()) {
            operator = '=';
        } else if (ctx.ADD_ASSIGN()) {
            operator = '+=';
        } else if (ctx.SUB_ASSIGN()) {
            operator = '-=';
        } else if (ctx.MUL_ASSIGN()) {
            operator = '*=';
        } else if (ctx.DIV_ASSIGN()) {
            operator = '/=';
        } else if (ctx.AND_ASSIGN()) {
            operator = '&=';
        } else if (ctx.OR_ASSIGN()) {
            operator = '|=';
        } else if (ctx.XOR_ASSIGN()) {
            operator = '^=';
        } else if (ctx.RSHIFT_ASSIGN()) {
            operator = '>>=';
        } else if (ctx.URSHIFT_ASSIGN()) {
            operator = '>>>=';
        } else if (ctx.LSHIFT_ASSIGN()) {
            operator = '<<=';
        } else {
            throw new Error('値が異常です。AssignExpressionContext: ' + ctx.getText());
        }

        return new AssignExpressionTypeClass(
            {
                left: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(0),
                    isBasedExpressionType,
                    'expression',
                ),
                operator: operator,
                right: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(1),
                    isBasedExpressionType,
                    'expression',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getLeft(): AssignExpressionType['left'] {
        return this.getFields().left;
    }

    getOperator(): AssignExpressionType['operator'] {
        return this.getFields().operator;
    }

    getRight(): AssignExpressionType['right'] {
        return this.getFields().right;
    }
}

export const isAssignExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is AssignExpressionTypeClass => isSpicifyApexCommonTypeClass('assignExpression', target);
