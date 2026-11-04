import { isOpaqueType, type OpaqueType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class OpaqueTypeTypeClass extends LwcCommonTypeClass<'opaqueType'> {
    private constructor(originalSource: string) {
        super('opaqueType', originalSource);
    }

    static create(target: OpaqueType, originalSource: string): OpaqueTypeTypeClass {
        throw new Error('OpaqueTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const opaqueTypeTypePair: EvaluatePair<OpaqueType, OpaqueTypeTypeClass> = makeEvaluatePair(
    isOpaqueType,
    (target, originalSource) => OpaqueTypeTypeClass.create(target, originalSource),
);

export const isOpaqueTypeType = (
    target: LwcCommonTypeClass<string>,
): target is OpaqueTypeTypeClass => target instanceof OpaqueTypeTypeClass;
