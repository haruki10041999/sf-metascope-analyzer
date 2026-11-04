import { isParenthesizedExpression, type ParenthesizedExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ParenthesizedExpressionTypeClass extends LwcCommonTypeClass<'parenthesizedExpression'> {
    private constructor(originalSource: string) {
        super('parenthesizedExpression', originalSource);
    }

    static create(
        target: ParenthesizedExpression,
        originalSource: string,
    ): ParenthesizedExpressionTypeClass {
        throw new Error(
            'ParenthesizedExpressionTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const parenthesizedExpressionTypePair: EvaluatePair<
    ParenthesizedExpression,
    ParenthesizedExpressionTypeClass
> = makeEvaluatePair(isParenthesizedExpression, (target, originalSource) =>
    ParenthesizedExpressionTypeClass.create(target, originalSource),
);

export const isParenthesizedExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is ParenthesizedExpressionTypeClass => target instanceof ParenthesizedExpressionTypeClass;
