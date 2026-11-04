import { isConditionalExpression, type ConditionalExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ConditionalExpressionTypeClass extends LwcCommonTypeClass<'conditionalExpression'> {
    private constructor(originalSource: string) {
        super('conditionalExpression', originalSource);
    }

    static create(
        target: ConditionalExpression,
        originalSource: string,
    ): ConditionalExpressionTypeClass {
        throw new Error('ConditionalExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const conditionalExpressionTypePair: EvaluatePair<
    ConditionalExpression,
    ConditionalExpressionTypeClass
> = makeEvaluatePair(isConditionalExpression, (target, originalSource) =>
    ConditionalExpressionTypeClass.create(target, originalSource),
);

export const isConditionalExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is ConditionalExpressionTypeClass => target instanceof ConditionalExpressionTypeClass;
