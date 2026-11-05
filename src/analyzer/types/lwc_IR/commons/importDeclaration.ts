import { isImportDeclaration, type ImportDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
} from '../commonVisitor';
import {
    importAttributeTypePair,
    type ImportAttributeTypeClass,
} from '../standardizedVisitor/importAttribute';
import {
    importDefaultSpecifierTypePair,
    type ImportDefaultSpecifierTypeClass,
} from './importDefaultSpecifier';
import {
    importNamespaceSpecifierTypePair,
    type ImportNamespaceSpecifierTypeClass,
} from './importNamespaceSpecifier';
import { importSpecifierTypePair, type ImportSpecifierTypeClass } from './importSpecifier';
import { stringLiteralTypePair, type StringLiteralTypeClass } from './stringLiteral';

const importDeclarationAttributesPairs = lazyPairs(() => [importAttributeTypePair] as const);
const importDeclarationSpecifiersPairs = lazyPairs(
    () =>
        [
            importSpecifierTypePair,
            importDefaultSpecifierTypePair,
            importNamespaceSpecifierTypePair,
        ] as const,
);
const importDeclarationSourcePairs = lazyPairs(() => [stringLiteralTypePair] as const);

export type ImportDeclarationFields = {
    attributes: (ImportAttributeTypeClass | LwcErrorTypeClass)[] | null;
    module: NonNullable<ImportDeclaration['module']> | null;
    phase: NonNullable<ImportDeclaration['phase']> | null;
    specifiers: (
        | ImportSpecifierTypeClass
        | ImportDefaultSpecifierTypeClass
        | ImportNamespaceSpecifierTypeClass
        | LwcErrorTypeClass
    )[];
    source: StringLiteralTypeClass | LwcErrorTypeClass;
    importKind: NonNullable<ImportDeclaration['importKind']> | null;
};

export class ImportDeclarationTypeClass extends LwcCommonTypeClass<'importDeclaration'> {
    private readonly value: ImportDeclarationFields;

    private constructor(value: ImportDeclarationFields) {
        super('importDeclaration');
        this.value = value;
    }

    static create(target: ImportDeclaration, originalSource: string): ImportDeclarationTypeClass {
        return new ImportDeclarationTypeClass({
            attributes:
                target.attributes == null
                    ? null
                    : visitNodeList(
                          target.attributes,
                          originalSource,
                          importDeclarationAttributesPairs(),
                          'ImportDeclaration.attributes',
                      ),
            module: target.module ?? null,
            phase: target.phase ?? null,
            specifiers: visitNodeList(
                target.specifiers,
                originalSource,
                importDeclarationSpecifiersPairs(),
                'ImportDeclaration.specifiers',
            ),
            source: visitNode(
                target.source,
                originalSource,
                importDeclarationSourcePairs(),
                'ImportDeclaration.source',
            ),
            importKind: target.importKind ?? null,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ImportDeclarationFields {
        return this.value;
    }

    getAttributes(): ImportDeclarationFields['attributes'] {
        return this.value.attributes;
    }

    getModule(): ImportDeclarationFields['module'] {
        return this.value.module;
    }

    getPhase(): ImportDeclarationFields['phase'] {
        return this.value.phase;
    }

    getSpecifiers(): ImportDeclarationFields['specifiers'] {
        return this.value.specifiers;
    }

    getSource(): ImportDeclarationFields['source'] {
        return this.value.source;
    }

    getImportKind(): ImportDeclarationFields['importKind'] {
        return this.value.importKind;
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
