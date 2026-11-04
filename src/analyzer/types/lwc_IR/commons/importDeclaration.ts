import { isImportDeclaration, type ImportDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ImportDeclarationTypeClass extends LwcCommonTypeClass<'importDeclaration'> {
    private constructor(originalSource: string) {
        super('importDeclaration', originalSource);
    }

    static create(target: ImportDeclaration, originalSource: string): ImportDeclarationTypeClass {
        throw new Error('ImportDeclarationTypeClass.create is not implemented: ' + target.type);
    }
}

export const importDeclarationTypePair: EvaluatePair<
    ImportDeclaration,
    ImportDeclarationTypeClass
> = makeEvaluatePair(isImportDeclaration, (target, originalSource) =>
    ImportDeclarationTypeClass.create(target, originalSource),
);

export const isImportDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is ImportDeclarationTypeClass => target instanceof ImportDeclarationTypeClass;
