import { isExportNamespaceSpecifier, type ExportNamespaceSpecifier } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ExportNamespaceSpecifierTypeClass extends LwcCommonTypeClass<'exportNamespaceSpecifier'> {
    private constructor(originalSource: string) {
        super('exportNamespaceSpecifier', originalSource);
    }

    static create(
        target: ExportNamespaceSpecifier,
        originalSource: string,
    ): ExportNamespaceSpecifierTypeClass {
        throw new Error(
            'ExportNamespaceSpecifierTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const exportNamespaceSpecifierTypePair: EvaluatePair<
    ExportNamespaceSpecifier,
    ExportNamespaceSpecifierTypeClass
> = makeEvaluatePair(isExportNamespaceSpecifier, (target, originalSource) =>
    ExportNamespaceSpecifierTypeClass.create(target, originalSource),
);

export const isExportNamespaceSpecifierType = (
    target: LwcCommonTypeClass<string>,
): target is ExportNamespaceSpecifierTypeClass =>
    target instanceof ExportNamespaceSpecifierTypeClass;
