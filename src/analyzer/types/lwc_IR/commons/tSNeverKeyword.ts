import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSNeverKeyword, type TSNeverKeyword } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type TSNeverKeywordFields = TypeField<'tSNeverKeyword'>;

export class TSNeverKeywordTypeClass extends LwcCommonTypeClass<
    'tSNeverKeyword',
    TSNeverKeywordFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('tSNeverKeyword', {}, sourceSpan);
    }

    static create(target: TSNeverKeyword, originalSource: string): TSNeverKeywordTypeClass {
        return new TSNeverKeywordTypeClass(getSourceSpan(target, originalSource));
    }
}

export const tSNeverKeywordTypePair: EvaluatePair<TSNeverKeyword, TSNeverKeywordTypeClass> =
    makeEvaluatePair(isTSNeverKeyword, (target, originalSource) =>
        TSNeverKeywordTypeClass.create(target, originalSource),
    );

export const isTSNeverKeywordType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSNeverKeywordTypeClass => target instanceof TSNeverKeywordTypeClass;
