import { isCallExpression, type CallExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class CallExpressionTypeClass extends LwcCommonTypeClass<'callExpression'> {
    private constructor(originalSource: string) {
        super('callExpression', originalSource);
    }

    static create(target: CallExpression, originalSource: string): CallExpressionTypeClass {
        throw new Error('CallExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const callExpressionTypePair: EvaluatePair<CallExpression, CallExpressionTypeClass> =
    makeEvaluatePair(isCallExpression, (target, originalSource) =>
        CallExpressionTypeClass.create(target, originalSource),
    );

export const isCallExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is CallExpressionTypeClass => target instanceof CallExpressionTypeClass;
