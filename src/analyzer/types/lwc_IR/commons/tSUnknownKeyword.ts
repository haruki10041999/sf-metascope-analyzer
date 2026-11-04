import { isTSUnknownKeyword, type TSUnknownKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSUnknownKeywordTypeClass extends LwcCommonTypeClass<'tSUnknownKeyword'> {
    private constructor(originalSource: string) {
        super('tSUnknownKeyword', originalSource);
    }

    static create(target: TSUnknownKeyword, originalSource: string): TSUnknownKeywordTypeClass {
        throw new Error('TSUnknownKeywordTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSUnknownKeywordTypePair: EvaluatePair<TSUnknownKeyword, TSUnknownKeywordTypeClass> =
    makeEvaluatePair(isTSUnknownKeyword, (target, originalSource) =>
        TSUnknownKeywordTypeClass.create(target, originalSource),
    );

export const isTSUnknownKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSUnknownKeywordTypeClass => target instanceof TSUnknownKeywordTypeClass;
