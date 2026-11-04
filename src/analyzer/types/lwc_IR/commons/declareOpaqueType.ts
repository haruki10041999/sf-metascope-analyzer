import { isDeclareOpaqueType, type DeclareOpaqueType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class DeclareOpaqueTypeTypeClass extends LwcCommonTypeClass<'declareOpaqueType'> {
    private constructor(originalSource: string) {
        super('declareOpaqueType', originalSource);
    }

    static create(target: DeclareOpaqueType, originalSource: string): DeclareOpaqueTypeTypeClass {
        throw new Error('DeclareOpaqueTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const declareOpaqueTypeTypePair: EvaluatePair<
    DeclareOpaqueType,
    DeclareOpaqueTypeTypeClass
> = makeEvaluatePair(isDeclareOpaqueType, (target, originalSource) =>
    DeclareOpaqueTypeTypeClass.create(target, originalSource),
);

export const isDeclareOpaqueTypeType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareOpaqueTypeTypeClass => target instanceof DeclareOpaqueTypeTypeClass;
