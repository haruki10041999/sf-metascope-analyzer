import { isLogicalExpression, type LogicalExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class LogicalExpressionTypeClass extends LwcCommonTypeClass<'logicalExpression'> {
    private constructor(originalSource: string) {
        super('logicalExpression', originalSource);
    }

    static create(target: LogicalExpression, originalSource: string): LogicalExpressionTypeClass {
        throw new Error('LogicalExpressionTypeClass.create is not implemented: ' + target.type);
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
