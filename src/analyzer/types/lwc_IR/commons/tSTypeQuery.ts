import { isTSTypeQuery, type TSTypeQuery } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSTypeQueryTypeClass extends LwcCommonTypeClass<'tSTypeQuery'> {
    private constructor(originalSource: string) {
        super('tSTypeQuery', originalSource);
    }

    static create(target: TSTypeQuery, originalSource: string): TSTypeQueryTypeClass {
        throw new Error('TSTypeQueryTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSTypeQueryTypePair: EvaluatePair<TSTypeQuery, TSTypeQueryTypeClass> =
    makeEvaluatePair(isTSTypeQuery, (target, originalSource) =>
        TSTypeQueryTypeClass.create(target, originalSource),
    );

export const isTSTypeQueryType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeQueryTypeClass => target instanceof TSTypeQueryTypeClass;
