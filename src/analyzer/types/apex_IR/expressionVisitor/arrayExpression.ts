import { ArrayExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

/** `value[index]` */
export type ArrayExpressionType = TypeField<'arrayExpression'> & {
    value: BasedExpressionTypeClass;
    index: BasedExpressionTypeClass;
};

export class ArrayExpressionTypeClass extends ApexCommonTypeClass<
    'arrayExpression',
    ArrayExpressionType
> {
    private constructor(fields: FieldsOf<ArrayExpressionType>, sourceSpan: SourceSpan) {
        super('arrayExpression', fields, sourceSpan);
    }

    static create(ctx: ArrayExpressionContext): ArrayExpressionTypeClass {
        return new ArrayExpressionTypeClass(
            {
                value: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(0),
                    isBasedExpressionType,
                    'expression',
                ),
                index: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(1),
                    isBasedExpressionType,
                    'expression',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): ArrayExpressionType['value'] {
        return this.getFields().value;
    }

    getIndex(): ArrayExpressionType['index'] {
        return this.getFields().index;
    }
}

export const isArrayExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ArrayExpressionTypeClass => isSpicifyApexCommonTypeClass('arrayExpression', target);
