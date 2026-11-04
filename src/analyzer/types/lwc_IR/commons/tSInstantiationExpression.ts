import { isTSInstantiationExpression, type TSInstantiationExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSInstantiationExpressionTypeClass extends LwcCommonTypeClass<'tSInstantiationExpression'> {
    private constructor(originalSource: string) {
        super('tSInstantiationExpression', originalSource);
    }

    static create(
        target: TSInstantiationExpression,
        originalSource: string,
    ): TSInstantiationExpressionTypeClass {
        throw new Error(
            'TSInstantiationExpressionTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const tSInstantiationExpressionTypePair: EvaluatePair<
    TSInstantiationExpression,
    TSInstantiationExpressionTypeClass
> = makeEvaluatePair(isTSInstantiationExpression, (target, originalSource) =>
    TSInstantiationExpressionTypeClass.create(target, originalSource),
);

export const isTSInstantiationExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is TSInstantiationExpressionTypeClass =>
    target instanceof TSInstantiationExpressionTypeClass;
