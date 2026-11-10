import { DotExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import { AnyIdTypeClass } from '../idVisitor';
import { DotMethodCallTypeClass } from '../callVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

/** `left.right` / `left?.right` (right はフィールド名かメソッド呼び出し) */
export type DotExpressionType = TypeField<'dotExpression'> & {
    left: BasedExpressionTypeClass;
    operator: '.' | '?.';
    right: AnyIdTypeClass | DotMethodCallTypeClass;
};

export class DotExpressionTypeClass extends ApexCommonTypeClass<
    'dotExpression',
    DotExpressionType
> {
    private constructor(fields: FieldsOf<DotExpressionType>, sourceSpan: SourceSpan) {
        super('dotExpression', fields, sourceSpan);
    }

    static create(ctx: DotExpressionContext): DotExpressionTypeClass {
        if (!ctx.DOT() && !ctx.QUESTIONDOT()) {
            throw new Error('値が異常です。DotExpressionContext: ' + ctx.getText());
        }

        return new DotExpressionTypeClass(
            {
                left: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(),
                    isBasedExpressionType,
                    'expression',
                ),
                operator: ctx.DOT() ? '.' : '?.',
                right: ctx.dotMethodCall()
                    ? createNode(
                          ctx.dotMethodCall(),
                          (c) => DotMethodCallTypeClass.create(c),
                          'dotMethodCall',
                      )
                    : createNode(ctx.anyId(), (c) => AnyIdTypeClass.create(c), 'anyId'),
            },
            getSourceSpan(ctx),
        );
    }

    getLeft(): DotExpressionType['left'] {
        return this.getFields().left;
    }

    getOperator(): DotExpressionType['operator'] {
        return this.getFields().operator;
    }

    getRight(): DotExpressionType['right'] {
        return this.getFields().right;
    }
}

export const isDotExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is DotExpressionTypeClass => isSpicifyApexCommonTypeClass('dotExpression', target);
