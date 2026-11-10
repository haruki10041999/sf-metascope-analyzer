import { ParExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

/** `(expression)` (if / while などの条件) */
export type ParExpressionType = TypeField<'parExpression'> & {
    value: BasedExpressionTypeClass;
};

export class ParExpressionTypeClass extends ApexCommonTypeClass<
    'parExpression',
    ParExpressionType
> {
    private constructor(fields: FieldsOf<ParExpressionType>, sourceSpan: SourceSpan) {
        super('parExpression', fields, sourceSpan);
    }

    static create(ctx: ParExpressionContext): ParExpressionTypeClass {
        return new ParExpressionTypeClass(
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

    getValue(): ParExpressionType['value'] {
        return this.getFields().value;
    }
}

export const isParExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ParExpressionTypeClass => isSpicifyApexCommonTypeClass('parExpression', target);
