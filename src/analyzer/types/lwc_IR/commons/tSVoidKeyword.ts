import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSVoidKeyword, type TSVoidKeyword } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type TSVoidKeywordFields = TypeField<'tSVoidKeyword'>;

export class TSVoidKeywordTypeClass extends LwcCommonTypeClass<
    'tSVoidKeyword',
    TSVoidKeywordFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('tSVoidKeyword', {}, sourceSpan);
    }

    static create(target: TSVoidKeyword, originalSource: string): TSVoidKeywordTypeClass {
        return new TSVoidKeywordTypeClass(getSourceSpan(target, originalSource));
    }
}

export const tSVoidKeywordTypePair: EvaluatePair<TSVoidKeyword, TSVoidKeywordTypeClass> =
    makeEvaluatePair(isTSVoidKeyword, (target, originalSource) =>
        TSVoidKeywordTypeClass.create(target, originalSource),
    );

export const isTSVoidKeywordType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSVoidKeywordTypeClass => target instanceof TSVoidKeywordTypeClass;
