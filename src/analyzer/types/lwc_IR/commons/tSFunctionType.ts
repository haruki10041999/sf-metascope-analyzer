import { isTSFunctionType, type TSFunctionType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSFunctionTypeTypeClass extends LwcCommonTypeClass<'tSFunctionType'> {
    private constructor(originalSource: string) {
        super('tSFunctionType', originalSource);
    }

    static create(target: TSFunctionType, originalSource: string): TSFunctionTypeTypeClass {
        throw new Error('TSFunctionTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSFunctionTypeTypePair: EvaluatePair<TSFunctionType, TSFunctionTypeTypeClass> =
    makeEvaluatePair(isTSFunctionType, (target, originalSource) =>
        TSFunctionTypeTypeClass.create(target, originalSource),
    );

export const isTSFunctionTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSFunctionTypeTypeClass => target instanceof TSFunctionTypeTypeClass;
