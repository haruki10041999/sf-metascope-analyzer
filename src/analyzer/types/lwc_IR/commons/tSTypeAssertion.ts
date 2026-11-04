import { isTSTypeAssertion, type TSTypeAssertion } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSTypeAssertionTypeClass extends LwcCommonTypeClass<'tSTypeAssertion'> {
    private constructor(originalSource: string) {
        super('tSTypeAssertion', originalSource);
    }

    static create(target: TSTypeAssertion, originalSource: string): TSTypeAssertionTypeClass {
        throw new Error('TSTypeAssertionTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSTypeAssertionTypePair: EvaluatePair<TSTypeAssertion, TSTypeAssertionTypeClass> =
    makeEvaluatePair(isTSTypeAssertion, (target, originalSource) =>
        TSTypeAssertionTypeClass.create(target, originalSource),
    );

export const isTSTypeAssertionType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeAssertionTypeClass => target instanceof TSTypeAssertionTypeClass;
