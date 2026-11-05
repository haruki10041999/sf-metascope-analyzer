import { isImportSpecifier, type ImportSpecifier } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { stringLiteralTypePair, type StringLiteralTypeClass } from './stringLiteral';

const importSpecifierLocalPairs = lazyPairs(() => [identifierTypePair] as const);
const importSpecifierImportedPairs = lazyPairs(
    () => [identifierTypePair, stringLiteralTypePair] as const,
);

export type ImportSpecifierFields = {
    local: IdentifierTypeClass | LwcErrorTypeClass;
    imported: IdentifierTypeClass | StringLiteralTypeClass | LwcErrorTypeClass;
    importKind: NonNullable<ImportSpecifier['importKind']> | null;
};

export class ImportSpecifierTypeClass extends LwcCommonTypeClass<'importSpecifier'> {
    private readonly value: ImportSpecifierFields;

    private constructor(value: ImportSpecifierFields) {
        super('importSpecifier');
        this.value = value;
    }

    static create(target: ImportSpecifier, originalSource: string): ImportSpecifierTypeClass {
        return new ImportSpecifierTypeClass({
            local: visitNode(
                target.local,
                originalSource,
                importSpecifierLocalPairs(),
                'ImportSpecifier.local',
            ),
            imported: visitNode(
                target.imported,
                originalSource,
                importSpecifierImportedPairs(),
                'ImportSpecifier.imported',
            ),
            importKind: target.importKind ?? null,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ImportSpecifierFields {
        return this.value;
    }

    getLocal(): ImportSpecifierFields['local'] {
        return this.value.local;
    }

    getImported(): ImportSpecifierFields['imported'] {
        return this.value.imported;
    }

    getImportKind(): ImportSpecifierFields['importKind'] {
        return this.value.importKind;
    }
}

export const importSpecifierTypePair: EvaluatePair<ImportSpecifier, ImportSpecifierTypeClass> =
    makeEvaluatePair(isImportSpecifier, (target, originalSource) =>
        ImportSpecifierTypeClass.create(target, originalSource),
    );

export const isImportSpecifierType = (
    target: LwcCommonTypeClass<string>,
): target is ImportSpecifierTypeClass => target instanceof ImportSpecifierTypeClass;
