import { isThisExpression, type ThisExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ThisExpressionTypeClass extends LwcCommonTypeClass<'thisExpression'> {
    private constructor() {
        super('thisExpression');
    }

    static create(_target: ThisExpression, _originalSource: string): ThisExpressionTypeClass {
        return new ThisExpressionTypeClass();
    }
}

export const thisExpressionTypePair: EvaluatePair<ThisExpression, ThisExpressionTypeClass> =
    makeEvaluatePair(isThisExpression, (target, originalSource) =>
        ThisExpressionTypeClass.create(target, originalSource),
    );

export const isThisExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is ThisExpressionTypeClass => target instanceof ThisExpressionTypeClass;
