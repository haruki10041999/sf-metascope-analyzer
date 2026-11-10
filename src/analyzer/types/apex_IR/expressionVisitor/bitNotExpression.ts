import { BitNotExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

/**
 * ビットごとの排他的論理和 (XOR、`a ^ b`)。
 * 名前は BitNot だが、apex-parser の文法がこの選択肢を `#bitNotExpression` (BitNotExpressionContext) と
 * 名付けているので、それに合わせている (ビットの否定 `~` ではない)
 */
export type BitNotExpressionType = TypeField<'bitNotExpression'> & {
    left: BasedExpressionTypeClass;
    operator: '^';
    right: BasedExpressionTypeClass;
};

export class BitNotExpressionTypeClass extends ApexCommonTypeClass<
    'bitNotExpression',
    BitNotExpressionType
> {
    private constructor(fields: FieldsOf<BitNotExpressionType>, sourceSpan: SourceSpan) {
        super('bitNotExpression', fields, sourceSpan);
    }

    static create(ctx: BitNotExpressionContext): BitNotExpressionTypeClass {
        if (!ctx.CARET()) {
            throw new Error('値が異常です。BitNotExpressionContext: ' + ctx.getText());
        }

        return new BitNotExpressionTypeClass(
            {
                left: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(0),
                    isBasedExpressionType,
                    'expression',
                ),
                operator: '^',
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

    getLeft(): BitNotExpressionType['left'] {
        return this.getFields().left;
    }

    getOperator(): BitNotExpressionType['operator'] {
        return this.getFields().operator;
    }

    getRight(): BitNotExpressionType['right'] {
        return this.getFields().right;
    }
}

export const isBitNotExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is BitNotExpressionTypeClass => isSpicifyApexCommonTypeClass('bitNotExpression', target);
