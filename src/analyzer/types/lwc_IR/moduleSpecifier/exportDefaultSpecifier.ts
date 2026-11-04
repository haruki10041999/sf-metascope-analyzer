import { isExportDefaultSpecifier, type ExportDefaultSpecifier } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ExportDefaultSpecifierTypeClass extends LwcCommonTypeClass<'exportDefaultSpecifier'> {
    private constructor(originalSource: string) {
        super('exportDefaultSpecifier', originalSource);
    }

    static create(
        target: ExportDefaultSpecifier,
        originalSource: string,
    ): ExportDefaultSpecifierTypeClass {
        throw new Error(
            'ExportDefaultSpecifierTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const exportDefaultSpecifierTypePair: EvaluatePair<
    ExportDefaultSpecifier,
    ExportDefaultSpecifierTypeClass
> = makeEvaluatePair(isExportDefaultSpecifier, (target, originalSource) =>
    ExportDefaultSpecifierTypeClass.create(target, originalSource),
);

export const isExportDefaultSpecifierType = (
    target: LwcCommonTypeClass<string>,
): target is ExportDefaultSpecifierTypeClass => target instanceof ExportDefaultSpecifierTypeClass;
