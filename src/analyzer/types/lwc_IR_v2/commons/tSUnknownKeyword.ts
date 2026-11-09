import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSUnknownKeyword, type TSUnknownKeyword } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type TSUnknownKeywordFields = TypeField<'tSUnknownKeyword'>;

export class TSUnknownKeywordTypeClass extends LwcCommonTypeClass<
    'tSUnknownKeyword',
    TSUnknownKeywordFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('tSUnknownKeyword', {}, sourceSpan);
    }

    static create(target: TSUnknownKeyword, originalSource: string): TSUnknownKeywordTypeClass {
        return new TSUnknownKeywordTypeClass(getSourceSpan(target, originalSource));
    }
}

export const tSUnknownKeywordTypePair: EvaluatePair<TSUnknownKeyword, TSUnknownKeywordTypeClass> =
    makeEvaluatePair(isTSUnknownKeyword, (target, originalSource) =>
        TSUnknownKeywordTypeClass.create(target, originalSource),
    );

export const isTSUnknownKeywordType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSUnknownKeywordTypeClass => target instanceof TSUnknownKeywordTypeClass;
