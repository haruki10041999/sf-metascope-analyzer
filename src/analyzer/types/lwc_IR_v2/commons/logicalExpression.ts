import { isLogicalExpression, type LogicalExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type LogicalExpressionFields = {
    operator: LogicalExpression['operator'];
    left: ExpressionTypeClass | LwcErrorTypeClass;
    right: ExpressionTypeClass | LwcErrorTypeClass;
};

export class LogicalExpressionTypeClass extends LwcCommonTypeClass<'logicalExpression'> {
    private readonly value: LogicalExpressionFields;

    private constructor(value: LogicalExpressionFields) {
        super('logicalExpression');
        this.value = value;
    }

    static create(target: LogicalExpression, originalSource: string): LogicalExpressionTypeClass {
        return new LogicalExpressionTypeClass({
            operator: target.operator,
            left: visitNode(
                target.left,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            right: visitNode(
                target.right,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): LogicalExpressionFields {
        return this.value;
    }

    getOperator(): LogicalExpressionFields['operator'] {
        return this.value.operator;
    }

    getLeft(): LogicalExpressionFields['left'] {
        return this.value.left;
    }

    getRight(): LogicalExpressionFields['right'] {
        return this.value.right;
    }
}

export const logicalExpressionTypePair: EvaluatePair<
    LogicalExpression,
    LogicalExpressionTypeClass
> = makeEvaluatePair(isLogicalExpression, (target, originalSource) =>
    LogicalExpressionTypeClass.create(target, originalSource),
);

export const isLogicalExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is LogicalExpressionTypeClass => target instanceof LogicalExpressionTypeClass;
