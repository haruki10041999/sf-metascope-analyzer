import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isInferredPredicate, type InferredPredicate } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type InferredPredicateFields = TypeField<'inferredPredicate'>;

export class InferredPredicateTypeClass extends LwcCommonTypeClass<
    'inferredPredicate',
    InferredPredicateFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('inferredPredicate', {}, sourceSpan);
    }

    static create(target: InferredPredicate, originalSource: string): InferredPredicateTypeClass {
        return new InferredPredicateTypeClass(getSourceSpan(target, originalSource));
    }
}

export const inferredPredicateTypePair: EvaluatePair<
    InferredPredicate,
    InferredPredicateTypeClass
> = makeEvaluatePair(isInferredPredicate, (target, originalSource) =>
    InferredPredicateTypeClass.create(target, originalSource),
);

export const isInferredPredicateType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is InferredPredicateTypeClass => target instanceof InferredPredicateTypeClass;
