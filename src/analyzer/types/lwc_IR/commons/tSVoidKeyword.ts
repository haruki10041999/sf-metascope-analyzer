import { isTSVoidKeyword, type TSVoidKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSVoidKeywordTypeClass extends LwcCommonTypeClass<'tSVoidKeyword'> {
    private constructor(originalSource: string) {
        super('tSVoidKeyword', originalSource);
    }

    static create(target: TSVoidKeyword, originalSource: string): TSVoidKeywordTypeClass {
        throw new Error('TSVoidKeywordTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSVoidKeywordTypePair: EvaluatePair<TSVoidKeyword, TSVoidKeywordTypeClass> =
    makeEvaluatePair(isTSVoidKeyword, (target, originalSource) =>
        TSVoidKeywordTypeClass.create(target, originalSource),
    );

export const isTSVoidKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSVoidKeywordTypeClass => target instanceof TSVoidKeywordTypeClass;
