import { isTSUndefinedKeyword, type TSUndefinedKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSUndefinedKeywordTypeClass extends LwcCommonTypeClass<'tSUndefinedKeyword'> {
    private constructor() {
        super('tSUndefinedKeyword');
    }

    static create(
        _target: TSUndefinedKeyword,
        _originalSource: string,
    ): TSUndefinedKeywordTypeClass {
        return new TSUndefinedKeywordTypeClass();
    }
}

export const tSUndefinedKeywordTypePair: EvaluatePair<
    TSUndefinedKeyword,
    TSUndefinedKeywordTypeClass
> = makeEvaluatePair(isTSUndefinedKeyword, (target, originalSource) =>
    TSUndefinedKeywordTypeClass.create(target, originalSource),
);

export const isTSUndefinedKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSUndefinedKeywordTypeClass => target instanceof TSUndefinedKeywordTypeClass;
