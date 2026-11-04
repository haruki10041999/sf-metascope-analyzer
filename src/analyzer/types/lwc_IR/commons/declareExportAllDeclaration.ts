import { isDeclareExportAllDeclaration, type DeclareExportAllDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class DeclareExportAllDeclarationTypeClass extends LwcCommonTypeClass<'declareExportAllDeclaration'> {
    private constructor(originalSource: string) {
        super('declareExportAllDeclaration', originalSource);
    }

    static create(
        target: DeclareExportAllDeclaration,
        originalSource: string,
    ): DeclareExportAllDeclarationTypeClass {
        throw new Error(
            'DeclareExportAllDeclarationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const declareExportAllDeclarationTypePair: EvaluatePair<
    DeclareExportAllDeclaration,
    DeclareExportAllDeclarationTypeClass
> = makeEvaluatePair(isDeclareExportAllDeclaration, (target, originalSource) =>
    DeclareExportAllDeclarationTypeClass.create(target, originalSource),
);

export const isDeclareExportAllDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareExportAllDeclarationTypeClass =>
    target instanceof DeclareExportAllDeclarationTypeClass;
