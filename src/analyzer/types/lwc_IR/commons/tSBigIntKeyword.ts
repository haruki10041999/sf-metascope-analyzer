import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSBigIntKeyword, type TSBigIntKeyword } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type TSBigIntKeywordFields = TypeField<'tSBigIntKeyword'>;

export class TSBigIntKeywordTypeClass extends LwcCommonTypeClass<
    'tSBigIntKeyword',
    TSBigIntKeywordFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('tSBigIntKeyword', {}, sourceSpan);
    }

    static create(target: TSBigIntKeyword, originalSource: string): TSBigIntKeywordTypeClass {
        return new TSBigIntKeywordTypeClass(getSourceSpan(target, originalSource));
    }
}

export const tSBigIntKeywordTypePair: EvaluatePair<TSBigIntKeyword, TSBigIntKeywordTypeClass> =
    makeEvaluatePair(isTSBigIntKeyword, (target, originalSource) =>
        TSBigIntKeywordTypeClass.create(target, originalSource),
    );

export const isTSBigIntKeywordType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSBigIntKeywordTypeClass => target instanceof TSBigIntKeywordTypeClass;
