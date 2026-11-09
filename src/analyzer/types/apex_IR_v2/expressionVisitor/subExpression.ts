import { SubExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

/** 括弧でくくった式 `(expression)` */
export type SubExpressionType = TypeField<'subExpression'> & {
    value: BasedExpressionTypeClass;
};

export class SubExpressionTypeClass extends ApexCommonTypeClass<
    'subExpression',
    SubExpressionType
> {
    private constructor(fields: FieldsOf<SubExpressionType>, sourceSpan: SourceSpan) {
        super('subExpression', fields, sourceSpan);
    }

    static create(ctx: SubExpressionContext): SubExpressionTypeClass {
        return new SubExpressionTypeClass(
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

    getValue(): SubExpressionType['value'] {
        return this.getFields().value;
    }
}

export const isSubExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SubExpressionTypeClass => isSpicifyApexCommonTypeClass('subExpression', target);
