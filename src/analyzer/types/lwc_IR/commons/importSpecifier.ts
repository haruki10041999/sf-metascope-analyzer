import { isImportSpecifier, type ImportSpecifier } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ImportSpecifierTypeClass extends LwcCommonTypeClass<'importSpecifier'> {
    private constructor(originalSource: string) {
        super('importSpecifier', originalSource);
    }

    static create(target: ImportSpecifier, originalSource: string): ImportSpecifierTypeClass {
        throw new Error('ImportSpecifierTypeClass.create is not implemented: ' + target.type);
    }
}

export const importSpecifierTypePair: EvaluatePair<ImportSpecifier, ImportSpecifierTypeClass> =
    makeEvaluatePair(isImportSpecifier, (target, originalSource) =>
        ImportSpecifierTypeClass.create(target, originalSource),
    );

export const isImportSpecifierType = (
    target: LwcCommonTypeClass<string>,
): target is ImportSpecifierTypeClass => target instanceof ImportSpecifierTypeClass;
