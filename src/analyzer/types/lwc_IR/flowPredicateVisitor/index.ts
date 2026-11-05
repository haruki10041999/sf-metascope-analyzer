import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import {
    DeclaredPredicateTypeClass,
    declaredPredicateTypePair,
} from '../commons/declaredPredicate';
import {
    InferredPredicateTypeClass,
    inferredPredicateTypePair,
} from '../commons/inferredPredicate';

export {
    DeclaredPredicateTypeClass,
    declaredPredicateTypePair,
    isDeclaredPredicateType,
} from '../commons/declaredPredicate';
export {
    InferredPredicateTypeClass,
    inferredPredicateTypePair,
    isInferredPredicateType,
} from '../commons/inferredPredicate';

export const flowPredicateVisitorEvaluatePairs = lazyPairs(
    () => [declaredPredicateTypePair, inferredPredicateTypePair] as const,
);

export class FlowPredicateVisitor extends LwcCommonVisitor<
    ReturnType<typeof flowPredicateVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return flowPredicateVisitorEvaluatePairs();
    }
}

export type FlowPredicateTypeClass = DeclaredPredicateTypeClass | InferredPredicateTypeClass;

export const isFlowPredicateType = (
    target: LwcCommonTypeClass<string>,
): target is FlowPredicateTypeClass => {
    return (
        target instanceof DeclaredPredicateTypeClass || target instanceof InferredPredicateTypeClass
    );
};
