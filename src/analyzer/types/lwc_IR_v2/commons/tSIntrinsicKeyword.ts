import { isTSIntrinsicKeyword, type TSIntrinsicKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSIntrinsicKeywordTypeClass extends LwcCommonTypeClass<'tSIntrinsicKeyword'> {
    private constructor() {
        super('tSIntrinsicKeyword');
    }

    static create(
        _target: TSIntrinsicKeyword,
        _originalSource: string,
    ): TSIntrinsicKeywordTypeClass {
        return new TSIntrinsicKeywordTypeClass();
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
