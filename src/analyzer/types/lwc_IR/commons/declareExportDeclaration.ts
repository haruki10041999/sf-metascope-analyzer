import { isDeclareExportDeclaration, type DeclareExportDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class DeclareExportDeclarationTypeClass extends LwcCommonTypeClass<'declareExportDeclaration'> {
    private constructor(originalSource: string) {
        super('declareExportDeclaration', originalSource);
    }

    static create(
        target: DeclareExportDeclaration,
        originalSource: string,
    ): DeclareExportDeclarationTypeClass {
        throw new Error(
            'DeclareExportDeclarationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const declareExportDeclarationTypePair: EvaluatePair<
    DeclareExportDeclaration,
    DeclareExportDeclarationTypeClass
> = makeEvaluatePair(isDeclareExportDeclaration, (target, originalSource) =>
    DeclareExportDeclarationTypeClass.create(target, originalSource),
);

export const isDeclareExportDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareExportDeclarationTypeClass =>
    target instanceof DeclareExportDeclarationTypeClass;
