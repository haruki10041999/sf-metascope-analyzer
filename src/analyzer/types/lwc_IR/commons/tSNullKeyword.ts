import { isTSNullKeyword, type TSNullKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSNullKeywordTypeClass extends LwcCommonTypeClass<'tSNullKeyword'> {
    private constructor(originalSource: string) {
        super('tSNullKeyword', originalSource);
    }

    static create(target: TSNullKeyword, originalSource: string): TSNullKeywordTypeClass {
        throw new Error('TSNullKeywordTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSNullKeywordTypePair: EvaluatePair<TSNullKeyword, TSNullKeywordTypeClass> =
    makeEvaluatePair(isTSNullKeyword, (target, originalSource) =>
        TSNullKeywordTypeClass.create(target, originalSource),
    );

export const isTSNullKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSNullKeywordTypeClass => target instanceof TSNullKeywordTypeClass;
