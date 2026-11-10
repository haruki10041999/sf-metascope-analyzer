import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSObjectKeyword, type TSObjectKeyword } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type TSObjectKeywordFields = TypeField<'tSObjectKeyword'>;

export class TSObjectKeywordTypeClass extends LwcCommonTypeClass<
    'tSObjectKeyword',
    TSObjectKeywordFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('tSObjectKeyword', {}, sourceSpan);
    }

    static create(target: TSObjectKeyword, originalSource: string): TSObjectKeywordTypeClass {
        return new TSObjectKeywordTypeClass(getSourceSpan(target, originalSource));
    }
}

export const tSObjectKeywordTypePair: EvaluatePair<TSObjectKeyword, TSObjectKeywordTypeClass> =
    makeEvaluatePair(isTSObjectKeyword, (target, originalSource) =>
        TSObjectKeywordTypeClass.create(target, originalSource),
    );

export const isTSObjectKeywordType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSObjectKeywordTypeClass => target instanceof TSObjectKeywordTypeClass;
