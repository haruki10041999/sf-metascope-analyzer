import { isDeclareInterface, type DeclareInterface } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class DeclareInterfaceTypeClass extends LwcCommonTypeClass<'declareInterface'> {
    private constructor(originalSource: string) {
        super('declareInterface', originalSource);
    }

    static create(target: DeclareInterface, originalSource: string): DeclareInterfaceTypeClass {
        throw new Error('DeclareInterfaceTypeClass.create is not implemented: ' + target.type);
    }
}

export const declareInterfaceTypePair: EvaluatePair<DeclareInterface, DeclareInterfaceTypeClass> =
    makeEvaluatePair(isDeclareInterface, (target, originalSource) =>
        DeclareInterfaceTypeClass.create(target, originalSource),
    );

export const isDeclareInterfaceType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareInterfaceTypeClass => target instanceof DeclareInterfaceTypeClass;
