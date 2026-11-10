import { BitOrExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type BitOrExpressionType = TypeField<'bitOrExpression'> & {
    left: BasedExpressionTypeClass;
    operator: '|';
    right: BasedExpressionTypeClass;
};

export class BitOrExpressionTypeClass extends ApexCommonTypeClass<
    'bitOrExpression',
    BitOrExpressionType
> {
    private constructor(fields: FieldsOf<BitOrExpressionType>, sourceSpan: SourceSpan) {
        super('bitOrExpression', fields, sourceSpan);
    }

    static create(ctx: BitOrExpressionContext): BitOrExpressionTypeClass {
        if (!ctx.BITOR()) {
            throw new Error('値が異常です。BitOrExpressionContext: ' + ctx.getText());
        }

        return new BitOrExpressionTypeClass(
            {
                left: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(0),
                    isBasedExpressionType,
                    'expression',
                ),
                operator: '|',
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

    getLeft(): BitOrExpressionType['left'] {
        return this.getFields().left;
    }

    getOperator(): BitOrExpressionType['operator'] {
        return this.getFields().operator;
    }

    getRight(): BitOrExpressionType['right'] {
        return this.getFields().right;
    }
}

export const isBitOrExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is BitOrExpressionTypeClass => isSpicifyApexCommonTypeClass('bitOrExpression', target);
