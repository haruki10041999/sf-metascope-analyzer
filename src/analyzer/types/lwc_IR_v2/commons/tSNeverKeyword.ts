import { isTSNeverKeyword, type TSNeverKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSNeverKeywordTypeClass extends LwcCommonTypeClass<'tSNeverKeyword'> {
    private constructor() {
        super('tSNeverKeyword');
    }

    static create(_target: TSNeverKeyword, _originalSource: string): TSNeverKeywordTypeClass {
        return new TSNeverKeywordTypeClass();
    }
}

export const tSNeverKeywordTypePair: EvaluatePair<TSNeverKeyword, TSNeverKeywordTypeClass> =
    makeEvaluatePair(isTSNeverKeyword, (target, originalSource) =>
        TSNeverKeywordTypeClass.create(target, originalSource),
    );

export const isTSNeverKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSNeverKeywordTypeClass => target instanceof TSNeverKeywordTypeClass;
