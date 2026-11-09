import { CoalExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type CoalExpressionType = TypeField<'coalExpression'> & {
    left: BasedExpressionTypeClass;
    operator: '??';
    right: BasedExpressionTypeClass;
};

export class CoalExpressionTypeClass extends ApexCommonTypeClass<
    'coalExpression',
    CoalExpressionType
> {
    private constructor(fields: FieldsOf<CoalExpressionType>, sourceSpan: SourceSpan) {
        super('coalExpression', fields, sourceSpan);
    }

    static create(ctx: CoalExpressionContext): CoalExpressionTypeClass {
        if (!ctx.COAL()) {
            throw new Error('値が異常です。CoalExpressionContext: ' + ctx.getText());
        }

        return new CoalExpressionTypeClass(
            {
                left: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(0),
                    isBasedExpressionType,
                    'expression',
                ),
                operator: '??',
                right: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(1),
                    isBasedExpressionType,
                    'expression',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getLeft(): CoalExpressionType['left'] {
        return this.getFields().left;
    }

    getOperator(): CoalExpressionType['operator'] {
        return this.getFields().operator;
    }

    getRight(): CoalExpressionType['right'] {
        return this.getFields().right;
    }
}

export const isCoalExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is CoalExpressionTypeClass => isSpicifyApexCommonTypeClass('coalExpression', target);
