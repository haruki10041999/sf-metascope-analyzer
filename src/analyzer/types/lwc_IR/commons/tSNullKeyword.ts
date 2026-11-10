import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSNullKeyword, type TSNullKeyword } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type TSNullKeywordFields = TypeField<'tSNullKeyword'>;

export class TSNullKeywordTypeClass extends LwcCommonTypeClass<
    'tSNullKeyword',
    TSNullKeywordFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('tSNullKeyword', {}, sourceSpan);
    }

    static create(target: TSNullKeyword, originalSource: string): TSNullKeywordTypeClass {
        return new TSNullKeywordTypeClass(getSourceSpan(target, originalSource));
    }
}

export const tSNullKeywordTypePair: EvaluatePair<TSNullKeyword, TSNullKeywordTypeClass> =
    makeEvaluatePair(isTSNullKeyword, (target, originalSource) =>
        TSNullKeywordTypeClass.create(target, originalSource),
    );

export const isTSNullKeywordType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSNullKeywordTypeClass => target instanceof TSNullKeywordTypeClass;
