import { isTSUnknownKeyword, type TSUnknownKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSUnknownKeywordTypeClass extends LwcCommonTypeClass<'tSUnknownKeyword'> {
    private constructor() {
        super('tSUnknownKeyword');
    }

    static create(_target: TSUnknownKeyword, _originalSource: string): TSUnknownKeywordTypeClass {
        return new TSUnknownKeywordTypeClass();
    }
}

export const tSUnknownKeywordTypePair: EvaluatePair<TSUnknownKeyword, TSUnknownKeywordTypeClass> =
    makeEvaluatePair(isTSUnknownKeyword, (target, originalSource) =>
        TSUnknownKeywordTypeClass.create(target, originalSource),
    );

export const isTSUnknownKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSUnknownKeywordTypeClass => target instanceof TSUnknownKeywordTypeClass;
