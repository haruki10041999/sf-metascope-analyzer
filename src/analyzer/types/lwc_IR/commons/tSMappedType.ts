import { isTSMappedType, type TSMappedType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSMappedTypeTypeClass extends LwcCommonTypeClass<'tSMappedType'> {
    private constructor(originalSource: string) {
        super('tSMappedType', originalSource);
    }

    static create(target: TSMappedType, originalSource: string): TSMappedTypeTypeClass {
        throw new Error('TSMappedTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSMappedTypeTypePair: EvaluatePair<TSMappedType, TSMappedTypeTypeClass> =
    makeEvaluatePair(isTSMappedType, (target, originalSource) =>
        TSMappedTypeTypeClass.create(target, originalSource),
    );

export const isTSMappedTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSMappedTypeTypeClass => target instanceof TSMappedTypeTypeClass;
