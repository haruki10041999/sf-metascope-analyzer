import { FieldExpressionContext } from '@apexdevtools/apex-parser';

import { DoubleOperatorExpressionTypeClass } from '.';

import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import { NormalValueTypeClass, ValueVisitor, isNormalValueType } from '../valueVisitor';
import {
    SoqlFunctionTypeClass,
    ComparisonOperatorTypeClass,
    QueryVisitor,
    isSoqlFunctionType,
    isComparisonOperatorType,
} from '../queryVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class FieldExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    'fieldExpression',
    FieldNameTypeClass | SoqlFunctionTypeClass,
    ComparisonOperatorTypeClass,
    NormalValueTypeClass
> {
    private constructor(
        left: FieldNameTypeClass | SoqlFunctionTypeClass | ApexErrorTypeClass,
        operator: ComparisonOperatorTypeClass | ApexErrorTypeClass,
        right: NormalValueTypeClass | ApexErrorTypeClass,
    ) {
        super('fieldExpression', left, right, operator);
    }

    static create(ctx: FieldExpressionContext): FieldExpressionTypeClass {
        if (
            !ctx.comparisonOperator() ||
            !ctx.value() ||
            (!ctx.fieldName() && !ctx.soqlFunction())
        ) {
            throw new Error('値が異常です。FieldExpressionContext: ' + ctx.getText());
        }

        return new FieldExpressionTypeClass(
            ctx.fieldName()
                ? visitNode(new NameVisitor(), ctx.fieldName()!, isFieldNameType, 'fieldName')
                : visitNode(
                      new QueryVisitor(),
                      ctx.soqlFunction()!,
                      isSoqlFunctionType,
                      'soqlFunction',
                  ),
            visitNode(
                new QueryVisitor(),
                ctx.comparisonOperator(),
                isComparisonOperatorType,
                'comparisonOperator',
            ),
            visitNode(new ValueVisitor(), ctx.value(), isNormalValueType, 'value'),
        );
    }
}

export const isFieldExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is FieldExpressionTypeClass => {
    return target instanceof FieldExpressionTypeClass;
};
