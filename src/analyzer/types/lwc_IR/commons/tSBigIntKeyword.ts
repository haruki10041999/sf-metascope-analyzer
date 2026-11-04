import { isTSBigIntKeyword, type TSBigIntKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSBigIntKeywordTypeClass extends LwcCommonTypeClass<'tSBigIntKeyword'> {
    private constructor(originalSource: string) {
        super('tSBigIntKeyword', originalSource);
    }

    static create(target: TSBigIntKeyword, originalSource: string): TSBigIntKeywordTypeClass {
        throw new Error('TSBigIntKeywordTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSBigIntKeywordTypePair: EvaluatePair<TSBigIntKeyword, TSBigIntKeywordTypeClass> =
    makeEvaluatePair(isTSBigIntKeyword, (target, originalSource) =>
        TSBigIntKeywordTypeClass.create(target, originalSource),
    );

export const isTSBigIntKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSBigIntKeywordTypeClass => target instanceof TSBigIntKeywordTypeClass;
