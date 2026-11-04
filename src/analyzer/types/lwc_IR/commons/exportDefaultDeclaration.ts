import { isExportDefaultDeclaration, type ExportDefaultDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ExportDefaultDeclarationTypeClass extends LwcCommonTypeClass<'exportDefaultDeclaration'> {
    private constructor(originalSource: string) {
        super('exportDefaultDeclaration', originalSource);
    }

    static create(
        target: ExportDefaultDeclaration,
        originalSource: string,
    ): ExportDefaultDeclarationTypeClass {
        throw new Error(
            'ExportDefaultDeclarationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const exportDefaultDeclarationTypePair: EvaluatePair<
    ExportDefaultDeclaration,
    ExportDefaultDeclarationTypeClass
> = makeEvaluatePair(isExportDefaultDeclaration, (target, originalSource) =>
    ExportDefaultDeclarationTypeClass.create(target, originalSource),
);

export const isExportDefaultDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is ExportDefaultDeclarationTypeClass =>
    target instanceof ExportDefaultDeclarationTypeClass;
