import { PreOpExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type PreOpExpressionType = TypeField<'preOpExpression'> & {
    operator: '++' | '--' | '+' | '-';
    value: BasedExpressionTypeClass;
};

export class PreOpExpressionTypeClass extends ApexCommonTypeClass<
    'preOpExpression',
    PreOpExpressionType
> {
    private constructor(fields: FieldsOf<PreOpExpressionType>, sourceSpan: SourceSpan) {
        super('preOpExpression', fields, sourceSpan);
    }

    static create(ctx: PreOpExpressionContext): PreOpExpressionTypeClass {
        let operator: PreOpExpressionType['operator'];
        if (ctx.INC()) {
            operator = '++';
        } else if (ctx.DEC()) {
            operator = '--';
        } else if (ctx.ADD()) {
            operator = '+';
        } else if (ctx.SUB()) {
            operator = '-';
        } else {
            throw new Error('値が異常です。PreOpExpressionContext: ' + ctx.getText());
        }

        return new PreOpExpressionTypeClass(
            {
                operator: operator,
                value: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(),
                    isBasedExpressionType,
                    'expression',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): PreOpExpressionType['value'] {
        return this.getFields().value;
    }

    getOperator(): PreOpExpressionType['operator'] {
        return this.getFields().operator;
    }
}

export const isPreOpExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is PreOpExpressionTypeClass => isSpicifyApexCommonTypeClass('preOpExpression', target);
