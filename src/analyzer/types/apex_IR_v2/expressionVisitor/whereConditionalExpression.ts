import { WhereConditionalExpressionContext } from '@apexdevtools/apex-parser';

import { WhereLogicalExpressionTypeClass, WhereFieldExpressionTypeClass } from '.';

import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

/** WHERE の条件 `( whereLogicalExpression )` か `whereFieldExpression` */
export type WhereConditionalExpressionType = TypeField<'whereConditionalExpression'> & {
    value: WhereLogicalExpressionTypeClass | WhereFieldExpressionTypeClass;
};

export class WhereConditionalExpressionTypeClass extends ApexCommonTypeClass<
    'whereConditionalExpression',
    WhereConditionalExpressionType
> {
    private constructor(fields: FieldsOf<WhereConditionalExpressionType>, sourceSpan: SourceSpan) {
        super('whereConditionalExpression', fields, sourceSpan);
    }

    static create(ctx: WhereConditionalExpressionContext): WhereConditionalExpressionTypeClass {
        return new WhereConditionalExpressionTypeClass(
            {
                value: ctx.whereLogicalExpression()
                    ? createNode(
                          ctx.whereLogicalExpression(),
                          (c) => WhereLogicalExpressionTypeClass.create(c),
                          'whereLogicalExpression',
                      )
                    : createNode(
                          ctx.whereFieldExpression(),
                          (c) => WhereFieldExpressionTypeClass.create(c),
                          'whereFieldExpression',
                      ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): WhereConditionalExpressionType['value'] {
        return this.getFields().value;
    }
}

export const isWhereConditionalExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is WhereConditionalExpressionTypeClass =>
    isSpicifyApexCommonTypeClass('whereConditionalExpression', target);
