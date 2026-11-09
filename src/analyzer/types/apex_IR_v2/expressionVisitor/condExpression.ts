import { CondExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

/** `condition ? trueValue : falseValue` */
export type CondExpressionType = TypeField<'condExpression'> & {
    condition: BasedExpressionTypeClass;
    trueValue: BasedExpressionTypeClass;
    falseValue: BasedExpressionTypeClass;
};

export class CondExpressionTypeClass extends ApexCommonTypeClass<
    'condExpression',
    CondExpressionType
> {
    private constructor(fields: FieldsOf<CondExpressionType>, sourceSpan: SourceSpan) {
        super('condExpression', fields, sourceSpan);
    }

    static create(ctx: CondExpressionContext): CondExpressionTypeClass {
        return new CondExpressionTypeClass(
            {
                condition: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(0),
                    isBasedExpressionType,
                    'expression',
                ),
                trueValue: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(1),
                    isBasedExpressionType,
                    'expression',
                ),
                falseValue: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(2),
                    isBasedExpressionType,
                    'expression',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getCondition(): CondExpressionType['condition'] {
        return this.getFields().condition;
    }

    getTrueValue(): CondExpressionType['trueValue'] {
        return this.getFields().trueValue;
    }

    getFalseValue(): CondExpressionType['falseValue'] {
        return this.getFields().falseValue;
    }
}

export const isCondExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is CondExpressionTypeClass => isSpicifyApexCommonTypeClass('condExpression', target);
