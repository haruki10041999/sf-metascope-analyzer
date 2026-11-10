import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSStringKeyword, type TSStringKeyword } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type TSStringKeywordFields = TypeField<'tSStringKeyword'>;

export class TSStringKeywordTypeClass extends LwcCommonTypeClass<
    'tSStringKeyword',
    TSStringKeywordFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('tSStringKeyword', {}, sourceSpan);
    }

    static create(target: TSStringKeyword, originalSource: string): TSStringKeywordTypeClass {
        return new TSStringKeywordTypeClass(getSourceSpan(target, originalSource));
    }
}

export const tSStringKeywordTypePair: EvaluatePair<TSStringKeyword, TSStringKeywordTypeClass> =
    makeEvaluatePair(isTSStringKeyword, (target, originalSource) =>
        TSStringKeywordTypeClass.create(target, originalSource),
    );

export const isTSStringKeywordType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSStringKeywordTypeClass => target instanceof TSStringKeywordTypeClass;
