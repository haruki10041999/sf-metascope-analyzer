import { isFunctionExpression, type FunctionExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class FunctionExpressionTypeClass extends LwcCommonTypeClass<'functionExpression'> {
    private constructor(originalSource: string) {
        super('functionExpression', originalSource);
    }

    static create(target: FunctionExpression, originalSource: string): FunctionExpressionTypeClass {
        throw new Error('FunctionExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const functionExpressionTypePair: EvaluatePair<
    FunctionExpression,
    FunctionExpressionTypeClass
> = makeEvaluatePair(isFunctionExpression, (target, originalSource) =>
    FunctionExpressionTypeClass.create(target, originalSource),
);

export const isFunctionExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is FunctionExpressionTypeClass => target instanceof FunctionExpressionTypeClass;
