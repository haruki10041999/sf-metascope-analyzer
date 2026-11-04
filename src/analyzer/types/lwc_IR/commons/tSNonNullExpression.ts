import { isTSNonNullExpression, type TSNonNullExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSNonNullExpressionTypeClass extends LwcCommonTypeClass<'tSNonNullExpression'> {
    private constructor(originalSource: string) {
        super('tSNonNullExpression', originalSource);
    }

    static create(
        target: TSNonNullExpression,
        originalSource: string,
    ): TSNonNullExpressionTypeClass {
        throw new Error('TSNonNullExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSNonNullExpressionTypePair: EvaluatePair<
    TSNonNullExpression,
    TSNonNullExpressionTypeClass
> = makeEvaluatePair(isTSNonNullExpression, (target, originalSource) =>
    TSNonNullExpressionTypeClass.create(target, originalSource),
);

export const isTSNonNullExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is TSNonNullExpressionTypeClass => target instanceof TSNonNullExpressionTypeClass;
