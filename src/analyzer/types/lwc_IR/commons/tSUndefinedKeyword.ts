import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSUndefinedKeyword, type TSUndefinedKeyword } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type TSUndefinedKeywordFields = TypeField<'tSUndefinedKeyword'>;

export class TSUndefinedKeywordTypeClass extends LwcCommonTypeClass<
    'tSUndefinedKeyword',
    TSUndefinedKeywordFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('tSUndefinedKeyword', {}, sourceSpan);
    }

    static create(target: TSUndefinedKeyword, originalSource: string): TSUndefinedKeywordTypeClass {
        return new TSUndefinedKeywordTypeClass(getSourceSpan(target, originalSource));
    }
}

export const tSUndefinedKeywordTypePair: EvaluatePair<
    TSUndefinedKeyword,
    TSUndefinedKeywordTypeClass
> = makeEvaluatePair(isTSUndefinedKeyword, (target, originalSource) =>
    TSUndefinedKeywordTypeClass.create(target, originalSource),
);

export const isTSUndefinedKeywordType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSUndefinedKeywordTypeClass => target instanceof TSUndefinedKeywordTypeClass;
