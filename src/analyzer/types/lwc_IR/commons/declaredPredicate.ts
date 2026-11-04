import { isDeclaredPredicate, type DeclaredPredicate } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class DeclaredPredicateTypeClass extends LwcCommonTypeClass<'declaredPredicate'> {
    private constructor(originalSource: string) {
        super('declaredPredicate', originalSource);
    }

    static create(target: DeclaredPredicate, originalSource: string): DeclaredPredicateTypeClass {
        throw new Error('DeclaredPredicateTypeClass.create is not implemented: ' + target.type);
    }
}

export const declaredPredicateTypePair: EvaluatePair<
    DeclaredPredicate,
    DeclaredPredicateTypeClass
> = makeEvaluatePair(isDeclaredPredicate, (target, originalSource) =>
    DeclaredPredicateTypeClass.create(target, originalSource),
);

export const isDeclaredPredicateType = (
    target: LwcCommonTypeClass<string>,
): target is DeclaredPredicateTypeClass => target instanceof DeclaredPredicateTypeClass;
