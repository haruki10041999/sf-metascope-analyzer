import { isImportDefaultSpecifier, type ImportDefaultSpecifier } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ImportDefaultSpecifierTypeClass extends LwcCommonTypeClass<'importDefaultSpecifier'> {
    private constructor(originalSource: string) {
        super('importDefaultSpecifier', originalSource);
    }

    static create(
        target: ImportDefaultSpecifier,
        originalSource: string,
    ): ImportDefaultSpecifierTypeClass {
        throw new Error(
            'ImportDefaultSpecifierTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const importDefaultSpecifierTypePair: EvaluatePair<
    ImportDefaultSpecifier,
    ImportDefaultSpecifierTypeClass
> = makeEvaluatePair(isImportDefaultSpecifier, (target, originalSource) =>
    ImportDefaultSpecifierTypeClass.create(target, originalSource),
);

export const isImportDefaultSpecifierType = (
    target: LwcCommonTypeClass<string>,
): target is ImportDefaultSpecifierTypeClass => target instanceof ImportDefaultSpecifierTypeClass;
