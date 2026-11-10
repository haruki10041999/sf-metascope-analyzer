import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isImportSpecifier, type ImportSpecifier } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { identifierTypePair, IdentifierTypeClass } from './identifier';
import { stringLiteralTypePair, type StringLiteralTypeClass } from './stringLiteral';

const importSpecifierImportedPairs = lazyPairs(
    () => [identifierTypePair, stringLiteralTypePair] as const,
);

export type ImportSpecifierFields = TypeField<'importSpecifier'> & {
    local: IdentifierTypeClass;
    imported: IdentifierTypeClass | StringLiteralTypeClass;
    importKind: NonNullable<ImportSpecifier['importKind']>;
};

export class ImportSpecifierTypeClass extends LwcCommonTypeClass<
    'importSpecifier',
    ImportSpecifierFields
> {
    private constructor(value: FieldsOf<ImportSpecifierFields>, sourceSpan: SourceSpan) {
        super('importSpecifier', value, sourceSpan);
    }

    static create(target: ImportSpecifier, originalSource: string): ImportSpecifierTypeClass {
        return new ImportSpecifierTypeClass(
            {
                local: IdentifierTypeClass.create(target.local, originalSource),
                imported: visitNode(
                    target.imported,
                    originalSource,
                    importSpecifierImportedPairs(),
                    'ImportSpecifier.imported',
                ),
                importKind: target.importKind ?? 'value',
            },
            getSourceSpan(target, originalSource),
        );
    }

    getLocal(): ImportSpecifierFields['local'] {
        return this.getFields().local;
    }

    getImported(): ImportSpecifierFields['imported'] {
        return this.getFields().imported;
    }

    getImportKind(): ImportSpecifierFields['importKind'] {
        return this.getFields().importKind;
    }
}

export const importSpecifierTypePair: EvaluatePair<ImportSpecifier, ImportSpecifierTypeClass> =
    makeEvaluatePair(isImportSpecifier, (target, originalSource) =>
        ImportSpecifierTypeClass.create(target, originalSource),
    );

export const isImportSpecifierType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ImportSpecifierTypeClass => target instanceof ImportSpecifierTypeClass;
