import { BitAndExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type BitAndExpressionType = TypeField<'bitAndExpression'> & {
    left: BasedExpressionTypeClass;
    operator: '&';
    right: BasedExpressionTypeClass;
};

export class BitAndExpressionTypeClass extends ApexCommonTypeClass<
    'bitAndExpression',
    BitAndExpressionType
> {
    private constructor(fields: FieldsOf<BitAndExpressionType>, sourceSpan: SourceSpan) {
        super('bitAndExpression', fields, sourceSpan);
    }

    static create(ctx: BitAndExpressionContext): BitAndExpressionTypeClass {
        if (!ctx.BITAND()) {
            throw new Error('値が異常です。BitAndExpressionContext: ' + ctx.getText());
        }

        return new BitAndExpressionTypeClass(
            {
                left: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(0),
                    isBasedExpressionType,
                    'expression',
                ),
                operator: '&',
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

    getLeft(): BitAndExpressionType['left'] {
        return this.getFields().left;
    }

    getOperator(): BitAndExpressionType['operator'] {
        return this.getFields().operator;
    }

    getRight(): BitAndExpressionType['right'] {
        return this.getFields().right;
    }
}

export const isBitAndExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is BitAndExpressionTypeClass => isSpicifyApexCommonTypeClass('bitAndExpression', target);
