import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSBooleanKeyword, type TSBooleanKeyword } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type TSBooleanKeywordFields = TypeField<'tSBooleanKeyword'>;

export class TSBooleanKeywordTypeClass extends LwcCommonTypeClass<
    'tSBooleanKeyword',
    TSBooleanKeywordFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('tSBooleanKeyword', {}, sourceSpan);
    }

    static create(target: TSBooleanKeyword, originalSource: string): TSBooleanKeywordTypeClass {
        return new TSBooleanKeywordTypeClass(getSourceSpan(target, originalSource));
    }
}

export const tSBooleanKeywordTypePair: EvaluatePair<TSBooleanKeyword, TSBooleanKeywordTypeClass> =
    makeEvaluatePair(isTSBooleanKeyword, (target, originalSource) =>
        TSBooleanKeywordTypeClass.create(target, originalSource),
    );

export const isTSBooleanKeywordType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSBooleanKeywordTypeClass => target instanceof TSBooleanKeywordTypeClass;
