import { isTSSymbolKeyword, type TSSymbolKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSSymbolKeywordTypeClass extends LwcCommonTypeClass<'tSSymbolKeyword'> {
    private constructor() {
        super('tSSymbolKeyword');
    }

    static create(_target: TSSymbolKeyword, _originalSource: string): TSSymbolKeywordTypeClass {
        return new TSSymbolKeywordTypeClass();
    }
}

export const tSSymbolKeywordTypePair: EvaluatePair<TSSymbolKeyword, TSSymbolKeywordTypeClass> =
    makeEvaluatePair(isTSSymbolKeyword, (target, originalSource) =>
        TSSymbolKeywordTypeClass.create(target, originalSource),
    );

export const isTSSymbolKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSSymbolKeywordTypeClass => target instanceof TSSymbolKeywordTypeClass;
