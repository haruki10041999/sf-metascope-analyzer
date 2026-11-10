import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSSymbolKeyword, type TSSymbolKeyword } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type TSSymbolKeywordFields = TypeField<'tSSymbolKeyword'>;

export class TSSymbolKeywordTypeClass extends LwcCommonTypeClass<
    'tSSymbolKeyword',
    TSSymbolKeywordFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('tSSymbolKeyword', {}, sourceSpan);
    }

    static create(target: TSSymbolKeyword, originalSource: string): TSSymbolKeywordTypeClass {
        return new TSSymbolKeywordTypeClass(getSourceSpan(target, originalSource));
    }
}

export const tSSymbolKeywordTypePair: EvaluatePair<TSSymbolKeyword, TSSymbolKeywordTypeClass> =
    makeEvaluatePair(isTSSymbolKeyword, (target, originalSource) =>
        TSSymbolKeywordTypeClass.create(target, originalSource),
    );

export const isTSSymbolKeywordType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSSymbolKeywordTypeClass => target instanceof TSSymbolKeywordTypeClass;
