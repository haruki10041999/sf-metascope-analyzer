import { isTSAnyKeyword, type TSAnyKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSAnyKeywordTypeClass extends LwcCommonTypeClass<'tSAnyKeyword'> {
    private constructor() {
        super('tSAnyKeyword');
    }

    static create(_target: TSAnyKeyword, _originalSource: string): TSAnyKeywordTypeClass {
        return new TSAnyKeywordTypeClass();
    }
}

export const tSAnyKeywordTypePair: EvaluatePair<TSAnyKeyword, TSAnyKeywordTypeClass> =
    makeEvaluatePair(isTSAnyKeyword, (target, originalSource) =>
        TSAnyKeywordTypeClass.create(target, originalSource),
    );

export const isTSAnyKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSAnyKeywordTypeClass => target instanceof TSAnyKeywordTypeClass;
