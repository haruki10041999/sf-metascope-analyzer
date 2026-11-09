import { NegExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type NegExpressionType = TypeField<'negExpression'> & {
    operator: '~' | '!';
    value: BasedExpressionTypeClass;
};

export class NegExpressionTypeClass extends ApexCommonTypeClass<
    'negExpression',
    NegExpressionType
> {
    private constructor(fields: FieldsOf<NegExpressionType>, sourceSpan: SourceSpan) {
        super('negExpression', fields, sourceSpan);
    }

    static create(ctx: NegExpressionContext): NegExpressionTypeClass {
        if (!ctx.TILDE() && !ctx.BANG()) {
            throw new Error('値が異常です。NegExpressionContext: ' + ctx.getText());
        }

        return new NegExpressionTypeClass(
            {
                operator: ctx.TILDE() ? '~' : '!',
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

    getValue(): NegExpressionType['value'] {
        return this.getFields().value;
    }

    getOperator(): NegExpressionType['operator'] {
        return this.getFields().operator;
    }
}

export const isNegExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is NegExpressionTypeClass => isSpicifyApexCommonTypeClass('negExpression', target);
