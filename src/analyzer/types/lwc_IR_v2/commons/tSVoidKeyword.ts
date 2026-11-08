import { isTSVoidKeyword, type TSVoidKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSVoidKeywordTypeClass extends LwcCommonTypeClass<'tSVoidKeyword'> {
    private constructor() {
        super('tSVoidKeyword');
    }

    static create(_target: TSVoidKeyword, _originalSource: string): TSVoidKeywordTypeClass {
        return new TSVoidKeywordTypeClass();
    }
}

export const tSVoidKeywordTypePair: EvaluatePair<TSVoidKeyword, TSVoidKeywordTypeClass> =
    makeEvaluatePair(isTSVoidKeyword, (target, originalSource) =>
        TSVoidKeywordTypeClass.create(target, originalSource),
    );

export const isTSVoidKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSVoidKeywordTypeClass => target instanceof TSVoidKeywordTypeClass;
