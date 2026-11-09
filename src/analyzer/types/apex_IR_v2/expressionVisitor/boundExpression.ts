import { BoundExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

/** SOQL / SOSL のバインド変数 `:expression` */
export type BoundExpressionType = TypeField<'boundExpression'> & {
    value: BasedExpressionTypeClass;
};

export class BoundExpressionTypeClass extends ApexCommonTypeClass<
    'boundExpression',
    BoundExpressionType
> {
    private constructor(fields: FieldsOf<BoundExpressionType>, sourceSpan: SourceSpan) {
        super('boundExpression', fields, sourceSpan);
    }

    static create(ctx: BoundExpressionContext): BoundExpressionTypeClass {
        return new BoundExpressionTypeClass(
            {
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

    getValue(): BoundExpressionType['value'] {
        return this.getFields().value;
    }
}

export const isBoundExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is BoundExpressionTypeClass => isSpicifyApexCommonTypeClass('boundExpression', target);
