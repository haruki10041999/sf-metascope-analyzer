import { isTSBigIntKeyword, type TSBigIntKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSBigIntKeywordTypeClass extends LwcCommonTypeClass<'tSBigIntKeyword'> {
    private constructor() {
        super('tSBigIntKeyword');
    }

    static create(_target: TSBigIntKeyword, _originalSource: string): TSBigIntKeywordTypeClass {
        return new TSBigIntKeywordTypeClass();
    }
}

export const tSBigIntKeywordTypePair: EvaluatePair<TSBigIntKeyword, TSBigIntKeywordTypeClass> =
    makeEvaluatePair(isTSBigIntKeyword, (target, originalSource) =>
        TSBigIntKeywordTypeClass.create(target, originalSource),
    );

export const isTSBigIntKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSBigIntKeywordTypeClass => target instanceof TSBigIntKeywordTypeClass;
