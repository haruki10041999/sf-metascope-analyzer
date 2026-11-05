import { isTSBooleanKeyword, type TSBooleanKeyword } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSBooleanKeywordTypeClass extends LwcCommonTypeClass<'tSBooleanKeyword'> {
    private constructor() {
        super('tSBooleanKeyword');
    }

    static create(_target: TSBooleanKeyword, _originalSource: string): TSBooleanKeywordTypeClass {
        return new TSBooleanKeywordTypeClass();
    }
}

export const tSBooleanKeywordTypePair: EvaluatePair<TSBooleanKeyword, TSBooleanKeywordTypeClass> =
    makeEvaluatePair(isTSBooleanKeyword, (target, originalSource) =>
        TSBooleanKeywordTypeClass.create(target, originalSource),
    );

export const isTSBooleanKeywordType = (
    target: LwcCommonTypeClass<string>,
): target is TSBooleanKeywordTypeClass => target instanceof TSBooleanKeywordTypeClass;
