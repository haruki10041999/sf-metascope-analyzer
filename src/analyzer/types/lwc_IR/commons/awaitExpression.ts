import { isAwaitExpression, type AwaitExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class AwaitExpressionTypeClass extends LwcCommonTypeClass<'awaitExpression'> {
    private constructor(originalSource: string) {
        super('awaitExpression', originalSource);
    }

    static create(target: AwaitExpression, originalSource: string): AwaitExpressionTypeClass {
        throw new Error('AwaitExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const awaitExpressionTypePair: EvaluatePair<AwaitExpression, AwaitExpressionTypeClass> =
    makeEvaluatePair(isAwaitExpression, (target, originalSource) =>
        AwaitExpressionTypeClass.create(target, originalSource),
    );

export const isAwaitExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is AwaitExpressionTypeClass => target instanceof AwaitExpressionTypeClass;
