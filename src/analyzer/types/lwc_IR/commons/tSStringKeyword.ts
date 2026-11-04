import { isTSStringKeyword, type TSStringKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSStringKeywordTypeClass extends LwcCommonTypeClass<'tSStringKeyword'> {
    private constructor(originalSource: string) {
        super('tSStringKeyword', originalSource);
    }

    static create(target: TSStringKeyword, originalSource: string): TSStringKeywordTypeClass {
        throw new Error('TSStringKeywordTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSStringKeywordTypePair: EvaluatePair<TSStringKeyword, TSStringKeywordTypeClass> =
    makeEvaluatePair(isTSStringKeyword, (target, originalSource) =>
        TSStringKeywordTypeClass.create(target, originalSource),
    );

export const isTSStringKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSStringKeywordTypeClass => target instanceof TSStringKeywordTypeClass;
