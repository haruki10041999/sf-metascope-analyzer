import { isTSNullKeyword, type TSNullKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSNullKeywordTypeClass extends LwcCommonTypeClass<'tSNullKeyword'> {
    private constructor() {
        super('tSNullKeyword');
    }

    static create(_target: TSNullKeyword, _originalSource: string): TSNullKeywordTypeClass {
        return new TSNullKeywordTypeClass();
    }
}

export const tSNullKeywordTypePair: EvaluatePair<TSNullKeyword, TSNullKeywordTypeClass> =
    makeEvaluatePair(isTSNullKeyword, (target, originalSource) =>
        TSNullKeywordTypeClass.create(target, originalSource),
    );

export const isTSNullKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSNullKeywordTypeClass => target instanceof TSNullKeywordTypeClass;
