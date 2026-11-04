import { isTSTypePredicate, type TSTypePredicate } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSTypePredicateTypeClass extends LwcCommonTypeClass<'tSTypePredicate'> {
    private constructor(originalSource: string) {
        super('tSTypePredicate', originalSource);
    }

    static create(target: TSTypePredicate, originalSource: string): TSTypePredicateTypeClass {
        throw new Error('TSTypePredicateTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSTypePredicateTypePair: EvaluatePair<TSTypePredicate, TSTypePredicateTypeClass> =
    makeEvaluatePair(isTSTypePredicate, (target, originalSource) =>
        TSTypePredicateTypeClass.create(target, originalSource),
    );

export const isTSTypePredicateType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypePredicateTypeClass => target instanceof TSTypePredicateTypeClass;
