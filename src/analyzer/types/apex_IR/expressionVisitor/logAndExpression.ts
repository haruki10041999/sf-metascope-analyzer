import { LogAndExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type LogAndExpressionType = TypeField<'logAndExpression'> & {
    left: BasedExpressionTypeClass;
    operator: '&&';
    right: BasedExpressionTypeClass;
};

export class LogAndExpressionTypeClass extends ApexCommonTypeClass<
    'logAndExpression',
    LogAndExpressionType
> {
    private constructor(fields: FieldsOf<LogAndExpressionType>, sourceSpan: SourceSpan) {
        super('logAndExpression', fields, sourceSpan);
    }

    static create(ctx: LogAndExpressionContext): LogAndExpressionTypeClass {
        if (!ctx.AND()) {
            throw new Error('値が異常です。LogAndExpressionContext: ' + ctx.getText());
        }

        return new LogAndExpressionTypeClass(
            {
                left: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(0),
                    isBasedExpressionType,
                    'expression',
                ),
                operator: '&&',
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

    getLeft(): LogAndExpressionType['left'] {
        return this.getFields().left;
    }

    getOperator(): LogAndExpressionType['operator'] {
        return this.getFields().operator;
    }

    getRight(): LogAndExpressionType['right'] {
        return this.getFields().right;
    }
}

export const isLogAndExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is LogAndExpressionTypeClass => isSpicifyApexCommonTypeClass('logAndExpression', target);
