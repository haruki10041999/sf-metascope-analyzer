import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isLogicalExpression, type LogicalExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type LogicalExpressionFields = TypeField<'logicalExpression'> & {
    operator: LogicalExpression['operator'];
    left: ExpressionTypeClass;
    right: ExpressionTypeClass;
};

export class LogicalExpressionTypeClass extends LwcCommonTypeClass<
    'logicalExpression',
    LogicalExpressionFields
> {
    private constructor(value: FieldsOf<LogicalExpressionFields>, sourceSpan: SourceSpan) {
        super('logicalExpression', value, sourceSpan);
    }

    static create(target: LogicalExpression, originalSource: string): LogicalExpressionTypeClass {
        return new LogicalExpressionTypeClass(
            {
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
            },
            getSourceSpan(target, originalSource),
        );
    }

    getOperator(): LogicalExpressionFields['operator'] {
        return this.getFields().operator;
    }

    getLeft(): LogicalExpressionFields['left'] {
        return this.getFields().left;
    }

    getRight(): LogicalExpressionFields['right'] {
        return this.getFields().right;
    }
}

export const logicalExpressionTypePair: EvaluatePair<
    LogicalExpression,
    LogicalExpressionTypeClass
> = makeEvaluatePair(isLogicalExpression, (target, originalSource) =>
    LogicalExpressionTypeClass.create(target, originalSource),
);

export const isLogicalExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is LogicalExpressionTypeClass => target instanceof LogicalExpressionTypeClass;
