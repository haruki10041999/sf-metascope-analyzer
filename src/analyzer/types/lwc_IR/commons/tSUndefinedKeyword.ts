import { isTSUndefinedKeyword, type TSUndefinedKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSUndefinedKeywordTypeClass extends LwcCommonTypeClass<'tSUndefinedKeyword'> {
    private constructor(originalSource: string) {
        super('tSUndefinedKeyword', originalSource);
    }

    static create(target: TSUndefinedKeyword, originalSource: string): TSUndefinedKeywordTypeClass {
        throw new Error('TSUndefinedKeywordTypeClass.create is not implemented: ' + target.type);
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
