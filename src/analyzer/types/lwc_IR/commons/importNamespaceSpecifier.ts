import { isImportNamespaceSpecifier, type ImportNamespaceSpecifier } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ImportNamespaceSpecifierTypeClass extends LwcCommonTypeClass<'importNamespaceSpecifier'> {
    private constructor(originalSource: string) {
        super('importNamespaceSpecifier', originalSource);
    }

    static create(
        target: ImportNamespaceSpecifier,
        originalSource: string,
    ): ImportNamespaceSpecifierTypeClass {
        throw new Error(
            'ImportNamespaceSpecifierTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const importNamespaceSpecifierTypePair: EvaluatePair<
    ImportNamespaceSpecifier,
    ImportNamespaceSpecifierTypeClass
> = makeEvaluatePair(isImportNamespaceSpecifier, (target, originalSource) =>
    ImportNamespaceSpecifierTypeClass.create(target, originalSource),
);

export const isImportNamespaceSpecifierType = (
    target: LwcCommonTypeClass<string>,
): target is ImportNamespaceSpecifierTypeClass =>
    target instanceof ImportNamespaceSpecifierTypeClass;
