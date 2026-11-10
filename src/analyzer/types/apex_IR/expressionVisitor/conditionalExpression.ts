import { ConditionalExpressionContext } from '@apexdevtools/apex-parser';

import { LogicalExpressionTypeClass, FieldExpressionTypeClass } from '.';

import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

/** SOQL の条件 `( logicalExpression )` か `fieldExpression` */
export type ConditionalExpressionType = TypeField<'conditionalExpression'> & {
    value: LogicalExpressionTypeClass | FieldExpressionTypeClass;
};

export class ConditionalExpressionTypeClass extends ApexCommonTypeClass<
    'conditionalExpression',
    ConditionalExpressionType
> {
    private constructor(fields: FieldsOf<ConditionalExpressionType>, sourceSpan: SourceSpan) {
        super('conditionalExpression', fields, sourceSpan);
    }

    static create(ctx: ConditionalExpressionContext): ConditionalExpressionTypeClass {
        return new ConditionalExpressionTypeClass(
            {
                value: ctx.logicalExpression()
                    ? createNode(
                          ctx.logicalExpression(),
                          (c) => LogicalExpressionTypeClass.create(c),
                          'logicalExpression',
                      )
                    : createNode(
                          ctx.fieldExpression(),
                          (c) => FieldExpressionTypeClass.create(c),
                          'fieldExpression',
                      ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): ConditionalExpressionType['value'] {
        return this.getFields().value;
    }
}

export const isConditionalExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ConditionalExpressionTypeClass =>
    isSpicifyApexCommonTypeClass('conditionalExpression', target);
