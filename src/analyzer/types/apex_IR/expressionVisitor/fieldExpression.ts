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
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class FieldExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    FieldNameTypeClass | SoqlFunctionTypeClass,
    ComparisonOperatorTypeClass,
    NormalValueTypeClass
> {
    private constructor(
        left: FieldNameTypeClass | SoqlFunctionTypeClass | ErrorTypeClass,
        operator: ComparisonOperatorTypeClass | ErrorTypeClass,
        right: NormalValueTypeClass | ErrorTypeClass,
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
                ? isValidClass(
                      new NameVisitor().visit(ctx.fieldName()!),
                      isFieldNameType,
                      'fieldName',
                  )
                : isValidClass(
                      new QueryVisitor().visit(ctx.soqlFunction()!),
                      isSoqlFunctionType,
                      'soqlFunction',
                  ),
            isValidClass(
                new QueryVisitor().visit(ctx.comparisonOperator()),
                isComparisonOperatorType,
                'comparisonOperator',
            ),
            isValidClass(new ValueVisitor().visit(ctx.value()), isNormalValueType, 'value'),
        );
    }
}

export const isFieldExpressionType = (
    target: CommonTypeClass,
): target is FieldExpressionTypeClass => {
    return target instanceof FieldExpressionTypeClass;
};

