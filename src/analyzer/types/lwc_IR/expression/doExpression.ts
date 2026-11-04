import { isDoExpression, type DoExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class DoExpressionTypeClass extends LwcCommonTypeClass<'doExpression'> {
    private constructor(originalSource: string) {
        super('doExpression', originalSource);
    }

    static create(target: DoExpression, originalSource: string): DoExpressionTypeClass {
        throw new Error('DoExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const doExpressionTypePair: EvaluatePair<DoExpression, DoExpressionTypeClass> =
    makeEvaluatePair(isDoExpression, (target, originalSource) =>
        DoExpressionTypeClass.create(target, originalSource),
    );

export const isDoExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is DoExpressionTypeClass => target instanceof DoExpressionTypeClass;
