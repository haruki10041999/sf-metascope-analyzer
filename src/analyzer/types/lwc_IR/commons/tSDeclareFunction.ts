import { isTSDeclareFunction, type TSDeclareFunction } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSDeclareFunctionTypeClass extends LwcCommonTypeClass<'tSDeclareFunction'> {
    private constructor(originalSource: string) {
        super('tSDeclareFunction', originalSource);
    }

    static create(target: TSDeclareFunction, originalSource: string): TSDeclareFunctionTypeClass {
        throw new Error('TSDeclareFunctionTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSDeclareFunctionTypePair: EvaluatePair<
    TSDeclareFunction,
    TSDeclareFunctionTypeClass
> = makeEvaluatePair(isTSDeclareFunction, (target, originalSource) =>
    TSDeclareFunctionTypeClass.create(target, originalSource),
);

export const isTSDeclareFunctionType = (
    target: LwcCommonTypeClass<string>,
): target is TSDeclareFunctionTypeClass => target instanceof TSDeclareFunctionTypeClass;
