import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSAnyKeyword, type TSAnyKeyword } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type TSAnyKeywordFields = TypeField<'tSAnyKeyword'>;

export class TSAnyKeywordTypeClass extends LwcCommonTypeClass<'tSAnyKeyword', TSAnyKeywordFields> {
    private constructor(sourceSpan: SourceSpan) {
        super('tSAnyKeyword', {}, sourceSpan);
    }

    static create(target: TSAnyKeyword, originalSource: string): TSAnyKeywordTypeClass {
        return new TSAnyKeywordTypeClass(getSourceSpan(target, originalSource));
    }
}

export const tSAnyKeywordTypePair: EvaluatePair<TSAnyKeyword, TSAnyKeywordTypeClass> =
    makeEvaluatePair(isTSAnyKeyword, (target, originalSource) =>
        TSAnyKeywordTypeClass.create(target, originalSource),
    );

export const isTSAnyKeywordType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSAnyKeywordTypeClass => target instanceof TSAnyKeywordTypeClass;
