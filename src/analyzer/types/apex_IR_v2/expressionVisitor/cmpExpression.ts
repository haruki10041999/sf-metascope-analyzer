import { CmpExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type CmpExpressionType = TypeField<'cmpExpression'> & {
    left: BasedExpressionTypeClass;
    operator: '<' | '>' | '<=' | '>=';
    right: BasedExpressionTypeClass;
};

export class CmpExpressionTypeClass extends ApexCommonTypeClass<
    'cmpExpression',
    CmpExpressionType
> {
    private constructor(fields: FieldsOf<CmpExpressionType>, sourceSpan: SourceSpan) {
        super('cmpExpression', fields, sourceSpan);
    }

    static create(ctx: CmpExpressionContext): CmpExpressionTypeClass {
        if (!ctx.GT() && !ctx.LT()) {
            throw new Error('値が異常です。CmpExpressionContext: ' + ctx.getText());
        }

        // `<=` / `>=` は LT/GT と ASSIGN の 2 トークンで表現される
        let operator: CmpExpressionType['operator'];
        if (ctx.GT()) {
            operator = ctx.ASSIGN() ? '>=' : '>';
        } else {
            operator = ctx.ASSIGN() ? '<=' : '<';
        }

        return new CmpExpressionTypeClass(
            {
                left: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(0),
                    isBasedExpressionType,
                    'expression',
                ),
                operator: operator,
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

    getLeft(): CmpExpressionType['left'] {
        return this.getFields().left;
    }

    getOperator(): CmpExpressionType['operator'] {
        return this.getFields().operator;
    }

    getRight(): CmpExpressionType['right'] {
        return this.getFields().right;
    }
}

export const isCmpExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is CmpExpressionTypeClass => isSpicifyApexCommonTypeClass('cmpExpression', target);
