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
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

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
                ? isApexValidClass(
                      new NameVisitor().visit(ctx.fieldName()!),
                      isFieldNameType,
                      'fieldName',
                  )
                : isApexValidClass(
                      new QueryVisitor().visit(ctx.soqlFunction()!),
                      isSoqlFunctionType,
                      'soqlFunction',
                  ),
            isApexValidClass(
                new QueryVisitor().visit(ctx.comparisonOperator()),
                isComparisonOperatorType,
                'comparisonOperator',
            ),
            isApexValidClass(new ValueVisitor().visit(ctx.value()), isNormalValueType, 'value'),
        );
    }
}

export const isFieldExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is FieldExpressionTypeClass => {
    return target instanceof FieldExpressionTypeClass;
};

