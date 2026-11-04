import { isTSTypeParameter, type TSTypeParameter } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSTypeParameterTypeClass extends LwcCommonTypeClass<'tSTypeParameter'> {
    private constructor(originalSource: string) {
        super('tSTypeParameter', originalSource);
    }

    static create(target: TSTypeParameter, originalSource: string): TSTypeParameterTypeClass {
        throw new Error('TSTypeParameterTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSTypeParameterTypePair: EvaluatePair<TSTypeParameter, TSTypeParameterTypeClass> =
    makeEvaluatePair(isTSTypeParameter, (target, originalSource) =>
        TSTypeParameterTypeClass.create(target, originalSource),
    );

export const isTSTypeParameterType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeParameterTypeClass => target instanceof TSTypeParameterTypeClass;
