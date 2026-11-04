import { isTSBooleanKeyword, type TSBooleanKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSBooleanKeywordTypeClass extends LwcCommonTypeClass<'tSBooleanKeyword'> {
    private constructor(originalSource: string) {
        super('tSBooleanKeyword', originalSource);
    }

    static create(target: TSBooleanKeyword, originalSource: string): TSBooleanKeywordTypeClass {
        throw new Error('TSBooleanKeywordTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSBooleanKeywordTypePair: EvaluatePair<TSBooleanKeyword, TSBooleanKeywordTypeClass> =
    makeEvaluatePair(isTSBooleanKeyword, (target, originalSource) =>
        TSBooleanKeywordTypeClass.create(target, originalSource),
    );

export const isTSBooleanKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSBooleanKeywordTypeClass => target instanceof TSBooleanKeywordTypeClass;
