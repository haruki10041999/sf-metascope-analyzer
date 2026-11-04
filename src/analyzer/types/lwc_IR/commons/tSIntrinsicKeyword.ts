import { isTSIntrinsicKeyword, type TSIntrinsicKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSIntrinsicKeywordTypeClass extends LwcCommonTypeClass<'tSIntrinsicKeyword'> {
    private constructor(originalSource: string) {
        super('tSIntrinsicKeyword', originalSource);
    }

    static create(target: TSIntrinsicKeyword, originalSource: string): TSIntrinsicKeywordTypeClass {
        throw new Error('TSIntrinsicKeywordTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSIntrinsicKeywordTypePair: EvaluatePair<
    TSIntrinsicKeyword,
    TSIntrinsicKeywordTypeClass
> = makeEvaluatePair(isTSIntrinsicKeyword, (target, originalSource) =>
    TSIntrinsicKeywordTypeClass.create(target, originalSource),
);

export const isTSIntrinsicKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSIntrinsicKeywordTypeClass => target instanceof TSIntrinsicKeywordTypeClass;
