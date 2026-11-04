import { isTSSymbolKeyword, type TSSymbolKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSSymbolKeywordTypeClass extends LwcCommonTypeClass<'tSSymbolKeyword'> {
    private constructor(originalSource: string) {
        super('tSSymbolKeyword', originalSource);
    }

    static create(target: TSSymbolKeyword, originalSource: string): TSSymbolKeywordTypeClass {
        throw new Error('TSSymbolKeywordTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSSymbolKeywordTypePair: EvaluatePair<TSSymbolKeyword, TSSymbolKeywordTypeClass> =
    makeEvaluatePair(isTSSymbolKeyword, (target, originalSource) =>
        TSSymbolKeywordTypeClass.create(target, originalSource),
    );

export const isTSSymbolKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSSymbolKeywordTypeClass => target instanceof TSSymbolKeywordTypeClass;
