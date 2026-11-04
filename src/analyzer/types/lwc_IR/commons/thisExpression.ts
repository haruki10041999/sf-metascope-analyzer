import { isThisExpression, type ThisExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ThisExpressionTypeClass extends LwcCommonTypeClass<'thisExpression'> {
    private constructor(originalSource: string) {
        super('thisExpression', originalSource);
    }

    static create(target: ThisExpression, originalSource: string): ThisExpressionTypeClass {
        throw new Error('ThisExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const thisExpressionTypePair: EvaluatePair<ThisExpression, ThisExpressionTypeClass> =
    makeEvaluatePair(isThisExpression, (target, originalSource) =>
        ThisExpressionTypeClass.create(target, originalSource),
    );

export const isThisExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is ThisExpressionTypeClass => target instanceof ThisExpressionTypeClass;
