import { isSequenceExpression, type SequenceExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class SequenceExpressionTypeClass extends LwcCommonTypeClass<'sequenceExpression'> {
    private constructor(originalSource: string) {
        super('sequenceExpression', originalSource);
    }

    static create(target: SequenceExpression, originalSource: string): SequenceExpressionTypeClass {
        throw new Error('SequenceExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const sequenceExpressionTypePair: EvaluatePair<
    SequenceExpression,
    SequenceExpressionTypeClass
> = makeEvaluatePair(isSequenceExpression, (target, originalSource) =>
    SequenceExpressionTypeClass.create(target, originalSource),
);

export const isSequenceExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is SequenceExpressionTypeClass => target instanceof SequenceExpressionTypeClass;
