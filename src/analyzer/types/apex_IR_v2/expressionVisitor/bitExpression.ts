import { BitExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type BitExpressionType = TypeField<'bitExpression'> & {
    left: BasedExpressionTypeClass;
    /** シフト演算子 (LT / GT のトークンを並べたもの) */
    operator: '<<' | '>>' | '>>>';
    right: BasedExpressionTypeClass;
};

export class BitExpressionTypeClass extends ApexCommonTypeClass<
    'bitExpression',
    BitExpressionType
> {
    private constructor(fields: FieldsOf<BitExpressionType>, sourceSpan: SourceSpan) {
        super('bitExpression', fields, sourceSpan);
    }

    static create(ctx: BitExpressionContext): BitExpressionTypeClass {
        const lt = ctx.LT_list() ?? [];
        const gt = ctx.GT_list() ?? [];
        let operator: BitExpressionType['operator'];
        if (lt.length === 2 && gt.length === 0) {
            operator = '<<';
        } else if (gt.length === 2 && lt.length === 0) {
            operator = '>>';
        } else if (gt.length === 3 && lt.length === 0) {
            operator = '>>>';
        } else {
            throw new Error('値が異常です。BitExpressionContext: ' + ctx.getText());
        }

        return new BitExpressionTypeClass(
            {
                left: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(0),
                    isBasedExpressionType,
                    'expression',
                ),
                operator,
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

    getLeft(): BitExpressionType['left'] {
        return this.getFields().left;
    }

    getOperator(): BitExpressionType['operator'] {
        return this.getFields().operator;
    }

    getRight(): BitExpressionType['right'] {
        return this.getFields().right;
    }
}

export const isBitExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is BitExpressionTypeClass => isSpicifyApexCommonTypeClass('bitExpression', target);
