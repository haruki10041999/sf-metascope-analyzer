import { isTSStringKeyword, type TSStringKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSStringKeywordTypeClass extends LwcCommonTypeClass<'tSStringKeyword'> {
    private constructor() {
        super('tSStringKeyword');
    }

    static create(_target: TSStringKeyword, _originalSource: string): TSStringKeywordTypeClass {
        return new TSStringKeywordTypeClass();
    }
}

export const tSStringKeywordTypePair: EvaluatePair<TSStringKeyword, TSStringKeywordTypeClass> =
    makeEvaluatePair(isTSStringKeyword, (target, originalSource) =>
        TSStringKeywordTypeClass.create(target, originalSource),
    );

export const isTSStringKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSStringKeywordTypeClass => target instanceof TSStringKeywordTypeClass;
