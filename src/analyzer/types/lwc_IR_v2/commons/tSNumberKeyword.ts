import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSNumberKeyword, type TSNumberKeyword } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type TSNumberKeywordFields = TypeField<'tSNumberKeyword'>;

export class TSNumberKeywordTypeClass extends LwcCommonTypeClass<
    'tSNumberKeyword',
    TSNumberKeywordFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('tSNumberKeyword', {}, sourceSpan);
    }

    static create(target: TSNumberKeyword, originalSource: string): TSNumberKeywordTypeClass {
        return new TSNumberKeywordTypeClass(getSourceSpan(target, originalSource));
    }
}

export const tSNumberKeywordTypePair: EvaluatePair<TSNumberKeyword, TSNumberKeywordTypeClass> =
    makeEvaluatePair(isTSNumberKeyword, (target, originalSource) =>
        TSNumberKeywordTypeClass.create(target, originalSource),
    );

export const isTSNumberKeywordType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSNumberKeywordTypeClass => target instanceof TSNumberKeywordTypeClass;
