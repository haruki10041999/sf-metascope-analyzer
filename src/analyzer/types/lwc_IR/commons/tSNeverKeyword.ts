import { isTSNeverKeyword, type TSNeverKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSNeverKeywordTypeClass extends LwcCommonTypeClass<'tSNeverKeyword'> {
    private constructor(originalSource: string) {
        super('tSNeverKeyword', originalSource);
    }

    static create(target: TSNeverKeyword, originalSource: string): TSNeverKeywordTypeClass {
        throw new Error('TSNeverKeywordTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSNeverKeywordTypePair: EvaluatePair<TSNeverKeyword, TSNeverKeywordTypeClass> =
    makeEvaluatePair(isTSNeverKeyword, (target, originalSource) =>
        TSNeverKeywordTypeClass.create(target, originalSource),
    );

export const isTSNeverKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSNeverKeywordTypeClass => target instanceof TSNeverKeywordTypeClass;
