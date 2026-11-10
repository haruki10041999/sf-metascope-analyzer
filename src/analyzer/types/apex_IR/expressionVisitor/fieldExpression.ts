import { FieldExpressionContext } from '@apexdevtools/apex-parser';

import { FieldNameTypeClass } from '../nameVisitor';
import { ValueTypeClass } from '../valueVisitor';
import { SoqlFunctionTypeClass, ComparisonOperatorTypeClass } from '../queryVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

/** SOQL の条件 `(fieldName | soqlFunction) comparisonOperator value` */
export type FieldExpressionType = TypeField<'fieldExpression'> & {
    left: FieldNameTypeClass | SoqlFunctionTypeClass;
    operator: ComparisonOperatorTypeClass;
    right: ValueTypeClass;
};

export class FieldExpressionTypeClass extends ApexCommonTypeClass<
    'fieldExpression',
    FieldExpressionType
> {
    private constructor(fields: FieldsOf<FieldExpressionType>, sourceSpan: SourceSpan) {
        super('fieldExpression', fields, sourceSpan);
    }

    static create(ctx: FieldExpressionContext): FieldExpressionTypeClass {
        return new FieldExpressionTypeClass(
            {
                left: ctx.soqlFunction()
                    ? createNode(
                          ctx.soqlFunction(),
                          (c) => SoqlFunctionTypeClass.create(c),
                          'soqlFunction',
                      )
                    : createNode(ctx.fieldName(), (c) => FieldNameTypeClass.create(c), 'fieldName'),
                operator: createNode(
                    ctx.comparisonOperator(),
                    (c) => ComparisonOperatorTypeClass.create(c),
                    'comparisonOperator',
                ),
                right: createNode(ctx.value(), (c) => ValueTypeClass.create(c), 'value'),
            },
            getSourceSpan(ctx),
        );
    }

    getLeft(): FieldExpressionType['left'] {
        return this.getFields().left;
    }

    getOperator(): FieldExpressionType['operator'] {
        return this.getFields().operator;
    }

    getRight(): FieldExpressionType['right'] {
        return this.getFields().right;
    }
}

export const isFieldExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FieldExpressionTypeClass => isSpicifyApexCommonTypeClass('fieldExpression', target);
