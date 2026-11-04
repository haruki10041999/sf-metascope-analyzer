import { isExportSpecifier, type ExportSpecifier } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ExportSpecifierTypeClass extends LwcCommonTypeClass<'exportSpecifier'> {
    private constructor(originalSource: string) {
        super('exportSpecifier', originalSource);
    }

    static create(target: ExportSpecifier, originalSource: string): ExportSpecifierTypeClass {
        throw new Error('ExportSpecifierTypeClass.create is not implemented: ' + target.type);
    }
}

export const exportSpecifierTypePair: EvaluatePair<ExportSpecifier, ExportSpecifierTypeClass> =
    makeEvaluatePair(isExportSpecifier, (target, originalSource) =>
        ExportSpecifierTypeClass.create(target, originalSource),
    );

export const isExportSpecifierType = (
    target: LwcCommonTypeClass<string>,
): target is ExportSpecifierTypeClass => target instanceof ExportSpecifierTypeClass;
