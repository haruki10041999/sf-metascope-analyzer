import { isTSObjectKeyword, type TSObjectKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSObjectKeywordTypeClass extends LwcCommonTypeClass<'tSObjectKeyword'> {
    private constructor(originalSource: string) {
        super('tSObjectKeyword', originalSource);
    }

    static create(target: TSObjectKeyword, originalSource: string): TSObjectKeywordTypeClass {
        throw new Error('TSObjectKeywordTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSObjectKeywordTypePair: EvaluatePair<TSObjectKeyword, TSObjectKeywordTypeClass> =
    makeEvaluatePair(isTSObjectKeyword, (target, originalSource) =>
        TSObjectKeywordTypeClass.create(target, originalSource),
    );

export const isTSObjectKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSObjectKeywordTypeClass => target instanceof TSObjectKeywordTypeClass;
