import { isFunctionTypeParam, type FunctionTypeParam } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class FunctionTypeParamTypeClass extends LwcCommonTypeClass<'functionTypeParam'> {
    private constructor(originalSource: string) {
        super('functionTypeParam', originalSource);
    }

    static create(target: FunctionTypeParam, originalSource: string): FunctionTypeParamTypeClass {
        throw new Error('FunctionTypeParamTypeClass.create is not implemented: ' + target.type);
    }
}

export const functionTypeParamTypePair: EvaluatePair<
    FunctionTypeParam,
    FunctionTypeParamTypeClass
> = makeEvaluatePair(isFunctionTypeParam, (target, originalSource) =>
    FunctionTypeParamTypeClass.create(target, originalSource),
);

export const isFunctionTypeParamType = (
    target: LwcCommonTypeClass<string>,
): target is FunctionTypeParamTypeClass => target instanceof FunctionTypeParamTypeClass;
