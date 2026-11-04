import { isTypeCastExpression, type TypeCastExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TypeCastExpressionTypeClass extends LwcCommonTypeClass<'typeCastExpression'> {
    private constructor(originalSource: string) {
        super('typeCastExpression', originalSource);
    }

    static create(target: TypeCastExpression, originalSource: string): TypeCastExpressionTypeClass {
        throw new Error('TypeCastExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const typeCastExpressionTypePair: EvaluatePair<
    TypeCastExpression,
    TypeCastExpressionTypeClass
> = makeEvaluatePair(isTypeCastExpression, (target, originalSource) =>
    TypeCastExpressionTypeClass.create(target, originalSource),
);

export const isTypeCastExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is TypeCastExpressionTypeClass => target instanceof TypeCastExpressionTypeClass;
