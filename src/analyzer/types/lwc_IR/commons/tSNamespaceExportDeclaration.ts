import { isTSNamespaceExportDeclaration, type TSNamespaceExportDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSNamespaceExportDeclarationTypeClass extends LwcCommonTypeClass<'tSNamespaceExportDeclaration'> {
    private constructor(originalSource: string) {
        super('tSNamespaceExportDeclaration', originalSource);
    }

    static create(
        target: TSNamespaceExportDeclaration,
        originalSource: string,
    ): TSNamespaceExportDeclarationTypeClass {
        throw new Error(
            'TSNamespaceExportDeclarationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const tSNamespaceExportDeclarationTypePair: EvaluatePair<
    TSNamespaceExportDeclaration,
    TSNamespaceExportDeclarationTypeClass
> = makeEvaluatePair(isTSNamespaceExportDeclaration, (target, originalSource) =>
    TSNamespaceExportDeclarationTypeClass.create(target, originalSource),
);

export const isTSNamespaceExportDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is TSNamespaceExportDeclarationTypeClass =>
    target instanceof TSNamespaceExportDeclarationTypeClass;
