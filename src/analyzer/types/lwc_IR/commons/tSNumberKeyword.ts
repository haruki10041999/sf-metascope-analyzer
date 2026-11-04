import { isTSNumberKeyword, type TSNumberKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSNumberKeywordTypeClass extends LwcCommonTypeClass<'tSNumberKeyword'> {
    private constructor(originalSource: string) {
        super('tSNumberKeyword', originalSource);
    }

    static create(target: TSNumberKeyword, originalSource: string): TSNumberKeywordTypeClass {
        throw new Error('TSNumberKeywordTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSNumberKeywordTypePair: EvaluatePair<TSNumberKeyword, TSNumberKeywordTypeClass> =
    makeEvaluatePair(isTSNumberKeyword, (target, originalSource) =>
        TSNumberKeywordTypeClass.create(target, originalSource),
    );

export const isTSNumberKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSNumberKeywordTypeClass => target instanceof TSNumberKeywordTypeClass;
