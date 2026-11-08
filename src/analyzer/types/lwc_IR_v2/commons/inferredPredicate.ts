import { isInferredPredicate, type InferredPredicate } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class InferredPredicateTypeClass extends LwcCommonTypeClass<'inferredPredicate'> {
    private constructor() {
        super('inferredPredicate');
    }

    static create(_target: InferredPredicate, _originalSource: string): InferredPredicateTypeClass {
        return new InferredPredicateTypeClass();
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
