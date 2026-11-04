import { isExportAllDeclaration, type ExportAllDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ExportAllDeclarationTypeClass extends LwcCommonTypeClass<'exportAllDeclaration'> {
    private constructor(originalSource: string) {
        super('exportAllDeclaration', originalSource);
    }

    static create(
        target: ExportAllDeclaration,
        originalSource: string,
    ): ExportAllDeclarationTypeClass {
        throw new Error('ExportAllDeclarationTypeClass.create is not implemented: ' + target.type);
    }
}

export const exportAllDeclarationTypePair: EvaluatePair<
    ExportAllDeclaration,
    ExportAllDeclarationTypeClass
> = makeEvaluatePair(isExportAllDeclaration, (target, originalSource) =>
    ExportAllDeclarationTypeClass.create(target, originalSource),
);

export const isExportAllDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is ExportAllDeclarationTypeClass => target instanceof ExportAllDeclarationTypeClass;
