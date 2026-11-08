import { isTSObjectKeyword, type TSObjectKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSObjectKeywordTypeClass extends LwcCommonTypeClass<'tSObjectKeyword'> {
    private constructor() {
        super('tSObjectKeyword');
    }

    static create(_target: TSObjectKeyword, _originalSource: string): TSObjectKeywordTypeClass {
        return new TSObjectKeywordTypeClass();
    }
}

export const tSObjectKeywordTypePair: EvaluatePair<TSObjectKeyword, TSObjectKeywordTypeClass> =
    makeEvaluatePair(isTSObjectKeyword, (target, originalSource) =>
        TSObjectKeywordTypeClass.create(target, originalSource),
    );

export const isTSObjectKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSObjectKeywordTypeClass => target instanceof TSObjectKeywordTypeClass;
