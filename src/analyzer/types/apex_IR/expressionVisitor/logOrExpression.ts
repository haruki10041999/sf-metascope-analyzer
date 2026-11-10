import { LogOrExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type LogOrExpressionType = TypeField<'logOrExpression'> & {
    left: BasedExpressionTypeClass;
    operator: '||';
    right: BasedExpressionTypeClass;
};

export class LogOrExpressionTypeClass extends ApexCommonTypeClass<
    'logOrExpression',
    LogOrExpressionType
> {
    private constructor(fields: FieldsOf<LogOrExpressionType>, sourceSpan: SourceSpan) {
        super('logOrExpression', fields, sourceSpan);
    }

    static create(ctx: LogOrExpressionContext): LogOrExpressionTypeClass {
        if (!ctx.OR()) {
            throw new Error('値が異常です。LogOrExpressionContext: ' + ctx.getText());
        }

        return new LogOrExpressionTypeClass(
            {
                left: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(0),
                    isBasedExpressionType,
                    'expression',
                ),
                operator: '||',
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

    getLeft(): LogOrExpressionType['left'] {
        return this.getFields().left;
    }

    getOperator(): LogOrExpressionType['operator'] {
        return this.getFields().operator;
    }

    getRight(): LogOrExpressionType['right'] {
        return this.getFields().right;
    }
}

export const isLogOrExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is LogOrExpressionTypeClass => isSpicifyApexCommonTypeClass('logOrExpression', target);
