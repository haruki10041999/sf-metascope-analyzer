import { isUnaryExpression, type UnaryExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class UnaryExpressionTypeClass extends LwcCommonTypeClass<'unaryExpression'> {
    private constructor(originalSource: string) {
        super('unaryExpression', originalSource);
    }

    static create(target: UnaryExpression, originalSource: string): UnaryExpressionTypeClass {
        throw new Error('UnaryExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const unaryExpressionTypePair: EvaluatePair<UnaryExpression, UnaryExpressionTypeClass> =
    makeEvaluatePair(isUnaryExpression, (target, originalSource) =>
        UnaryExpressionTypeClass.create(target, originalSource),
    );

export const isUnaryExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is UnaryExpressionTypeClass => target instanceof UnaryExpressionTypeClass;
