import { isDeclareModuleExports, type DeclareModuleExports } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class DeclareModuleExportsTypeClass extends LwcCommonTypeClass<'declareModuleExports'> {
    private constructor(originalSource: string) {
        super('declareModuleExports', originalSource);
    }

    static create(
        target: DeclareModuleExports,
        originalSource: string,
    ): DeclareModuleExportsTypeClass {
        throw new Error('DeclareModuleExportsTypeClass.create is not implemented: ' + target.type);
    }
}

export const declareModuleExportsTypePair: EvaluatePair<
    DeclareModuleExports,
    DeclareModuleExportsTypeClass
> = makeEvaluatePair(isDeclareModuleExports, (target, originalSource) =>
    DeclareModuleExportsTypeClass.create(target, originalSource),
);

export const isDeclareModuleExportsType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareModuleExportsTypeClass => target instanceof DeclareModuleExportsTypeClass;
