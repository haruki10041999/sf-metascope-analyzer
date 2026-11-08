import { isTSNumberKeyword, type TSNumberKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSNumberKeywordTypeClass extends LwcCommonTypeClass<'tSNumberKeyword'> {
    private constructor() {
        super('tSNumberKeyword');
    }

    static create(_target: TSNumberKeyword, _originalSource: string): TSNumberKeywordTypeClass {
        return new TSNumberKeywordTypeClass();
    }
}

export const tSNumberKeywordTypePair: EvaluatePair<TSNumberKeyword, TSNumberKeywordTypeClass> =
    makeEvaluatePair(isTSNumberKeyword, (target, originalSource) =>
        TSNumberKeywordTypeClass.create(target, originalSource),
    );

export const isTSNumberKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSNumberKeywordTypeClass => target instanceof TSNumberKeywordTypeClass;
