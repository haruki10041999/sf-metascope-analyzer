import { isTSAnyKeyword, type TSAnyKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSAnyKeywordTypeClass extends LwcCommonTypeClass<'tSAnyKeyword'> {
    private constructor(originalSource: string) {
        super('tSAnyKeyword', originalSource);
    }

    static create(target: TSAnyKeyword, originalSource: string): TSAnyKeywordTypeClass {
        throw new Error('TSAnyKeywordTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSAnyKeywordTypePair: EvaluatePair<TSAnyKeyword, TSAnyKeywordTypeClass> =
    makeEvaluatePair(isTSAnyKeyword, (target, originalSource) =>
        TSAnyKeywordTypeClass.create(target, originalSource),
    );

export const isTSAnyKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSAnyKeywordTypeClass => target instanceof TSAnyKeywordTypeClass;
