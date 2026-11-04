import { isInferredPredicate, type InferredPredicate } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class InferredPredicateTypeClass extends LwcCommonTypeClass<'inferredPredicate'> {
    private constructor(originalSource: string) {
        super('inferredPredicate', originalSource);
    }

    static create(target: InferredPredicate, originalSource: string): InferredPredicateTypeClass {
        throw new Error('InferredPredicateTypeClass.create is not implemented: ' + target.type);
    }
}

export const inferredPredicateTypePair: EvaluatePair<
    InferredPredicate,
    InferredPredicateTypeClass
> = makeEvaluatePair(isInferredPredicate, (target, originalSource) =>
    InferredPredicateTypeClass.create(target, originalSource),
);

export const isInferredPredicateType = (
    target: LwcCommonTypeClass<string>,
): target is InferredPredicateTypeClass => target instanceof InferredPredicateTypeClass;
