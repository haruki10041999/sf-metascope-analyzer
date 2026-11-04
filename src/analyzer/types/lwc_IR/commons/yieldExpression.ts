import { isYieldExpression, type YieldExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class YieldExpressionTypeClass extends LwcCommonTypeClass<'yieldExpression'> {
    private constructor(originalSource: string) {
        super('yieldExpression', originalSource);
    }

    static create(target: YieldExpression, originalSource: string): YieldExpressionTypeClass {
        throw new Error('YieldExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const yieldExpressionTypePair: EvaluatePair<YieldExpression, YieldExpressionTypeClass> =
    makeEvaluatePair(isYieldExpression, (target, originalSource) =>
        YieldExpressionTypeClass.create(target, originalSource),
    );

export const isYieldExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is YieldExpressionTypeClass => target instanceof YieldExpressionTypeClass;
