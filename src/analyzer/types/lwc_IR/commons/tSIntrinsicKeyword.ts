import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSIntrinsicKeyword, type TSIntrinsicKeyword } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type TSIntrinsicKeywordFields = TypeField<'tSIntrinsicKeyword'>;

export class TSIntrinsicKeywordTypeClass extends LwcCommonTypeClass<
    'tSIntrinsicKeyword',
    TSIntrinsicKeywordFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('tSIntrinsicKeyword', {}, sourceSpan);
    }

    static create(target: TSIntrinsicKeyword, originalSource: string): TSIntrinsicKeywordTypeClass {
        return new TSIntrinsicKeywordTypeClass(getSourceSpan(target, originalSource));
    }
}

export const tSIntrinsicKeywordTypePair: EvaluatePair<
    TSIntrinsicKeyword,
    TSIntrinsicKeywordTypeClass
> = makeEvaluatePair(isTSIntrinsicKeyword, (target, originalSource) =>
    TSIntrinsicKeywordTypeClass.create(target, originalSource),
);

export const isTSIntrinsicKeywordType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSIntrinsicKeywordTypeClass => target instanceof TSIntrinsicKeywordTypeClass;
