import { isExportNamedDeclaration, type ExportNamedDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ExportNamedDeclarationTypeClass extends LwcCommonTypeClass<'exportNamedDeclaration'> {
    private constructor(originalSource: string) {
        super('exportNamedDeclaration', originalSource);
    }

    static create(
        target: ExportNamedDeclaration,
        originalSource: string,
    ): ExportNamedDeclarationTypeClass {
        throw new Error(
            'ExportNamedDeclarationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const exportNamedDeclarationTypePair: EvaluatePair<
    ExportNamedDeclaration,
    ExportNamedDeclarationTypeClass
> = makeEvaluatePair(isExportNamedDeclaration, (target, originalSource) =>
    ExportNamedDeclarationTypeClass.create(target, originalSource),
);

export const isExportNamedDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is ExportNamedDeclarationTypeClass => target instanceof ExportNamedDeclarationTypeClass;
