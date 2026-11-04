import { isTSInferType, type TSInferType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSInferTypeTypeClass extends LwcCommonTypeClass<'tSInferType'> {
    private constructor(originalSource: string) {
        super('tSInferType', originalSource);
    }

    static create(target: TSInferType, originalSource: string): TSInferTypeTypeClass {
        throw new Error('TSInferTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSInferTypeTypePair: EvaluatePair<TSInferType, TSInferTypeTypeClass> =
    makeEvaluatePair(isTSInferType, (target, originalSource) =>
        TSInferTypeTypeClass.create(target, originalSource),
    );

export const isTSInferTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSInferTypeTypeClass => target instanceof TSInferTypeTypeClass;
