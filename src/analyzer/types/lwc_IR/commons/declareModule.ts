import { isDeclareModule, type DeclareModule } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class DeclareModuleTypeClass extends LwcCommonTypeClass<'declareModule'> {
    private constructor(originalSource: string) {
        super('declareModule', originalSource);
    }

    static create(target: DeclareModule, originalSource: string): DeclareModuleTypeClass {
        throw new Error('DeclareModuleTypeClass.create is not implemented: ' + target.type);
    }
}

export const declareModuleTypePair: EvaluatePair<DeclareModule, DeclareModuleTypeClass> =
    makeEvaluatePair(isDeclareModule, (target, originalSource) =>
        DeclareModuleTypeClass.create(target, originalSource),
    );

export const isDeclareModuleType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareModuleTypeClass => target instanceof DeclareModuleTypeClass;
