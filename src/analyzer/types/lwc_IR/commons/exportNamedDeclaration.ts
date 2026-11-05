import { isExportNamedDeclaration, type ExportNamedDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    visitOptionalNode,
} from '../commonVisitor';
import { declarationVisitorEvaluatePairs, type DeclarationTypeClass } from '../declarationVisitor';
import {
    exportDefaultSpecifierTypePair,
    type ExportDefaultSpecifierTypeClass,
} from '../moduleSpecifierVisitor/exportDefaultSpecifier';
import {
    importAttributeTypePair,
    type ImportAttributeTypeClass,
} from '../standardizedVisitor/importAttribute';
import {
    exportNamespaceSpecifierTypePair,
    type ExportNamespaceSpecifierTypeClass,
} from './exportNamespaceSpecifier';
import { exportSpecifierTypePair, type ExportSpecifierTypeClass } from './exportSpecifier';
import { stringLiteralTypePair, type StringLiteralTypeClass } from './stringLiteral';

const exportNamedDeclarationAttributesPairs = lazyPairs(() => [importAttributeTypePair] as const);
const exportNamedDeclarationSpecifiersPairs = lazyPairs(
    () =>
        [
            exportSpecifierTypePair,
            exportDefaultSpecifierTypePair,
            exportNamespaceSpecifierTypePair,
        ] as const,
);
const exportNamedDeclarationSourcePairs = lazyPairs(() => [stringLiteralTypePair] as const);

export type ExportNamedDeclarationFields = {
    declaration: DeclarationTypeClass | LwcErrorTypeClass | null;
    attributes: (ImportAttributeTypeClass | LwcErrorTypeClass)[] | null;
    specifiers: (
        | ExportSpecifierTypeClass
        | ExportDefaultSpecifierTypeClass
        | ExportNamespaceSpecifierTypeClass
        | LwcErrorTypeClass
    )[];
    source: StringLiteralTypeClass | LwcErrorTypeClass | null;
    exportKind: NonNullable<ExportNamedDeclaration['exportKind']> | null;
};

export class ExportNamedDeclarationTypeClass extends LwcCommonTypeClass<'exportNamedDeclaration'> {
    private readonly value: ExportNamedDeclarationFields;

    private constructor(value: ExportNamedDeclarationFields) {
        super('exportNamedDeclaration');
        this.value = value;
    }

    static create(
        target: ExportNamedDeclaration,
        originalSource: string,
    ): ExportNamedDeclarationTypeClass {
        return new ExportNamedDeclarationTypeClass({
            declaration: visitOptionalNode(
                target.declaration,
                originalSource,
                declarationVisitorEvaluatePairs(),
                'DeclarationVisitor',
            ),
            attributes:
                target.attributes == null
                    ? null
                    : visitNodeList(
                          target.attributes,
                          originalSource,
                          exportNamedDeclarationAttributesPairs(),
                          'ExportNamedDeclaration.attributes',
                      ),
            specifiers: visitNodeList(
                target.specifiers,
                originalSource,
                exportNamedDeclarationSpecifiersPairs(),
                'ExportNamedDeclaration.specifiers',
            ),
            source: visitOptionalNode(
                target.source,
                originalSource,
                exportNamedDeclarationSourcePairs(),
                'ExportNamedDeclaration.source',
            ),
            exportKind: target.exportKind ?? null,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ExportNamedDeclarationFields {
        return this.value;
    }

    getDeclaration(): ExportNamedDeclarationFields['declaration'] {
        return this.value.declaration;
    }

    getAttributes(): ExportNamedDeclarationFields['attributes'] {
        return this.value.attributes;
    }

    getSpecifiers(): ExportNamedDeclarationFields['specifiers'] {
        return this.value.specifiers;
    }

    getSource(): ExportNamedDeclarationFields['source'] {
        return this.value.source;
    }

    getExportKind(): ExportNamedDeclarationFields['exportKind'] {
        return this.value.exportKind;
    }
}

export const exportNamedDeclarationTypePair: EvaluatePair<
    ExportNamedDeclaration,
    ExportNamedDeclarationTypeClass
> = makeEvaluatePair(isExportNamedDeclaration, (target, originalSource) =>
    ExportNamedDeclarationTypeClass.create(target, originalSource),
);

export const isExportNamedDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is ExportNamedDeclarationTypeClass => target instanceof ExportNamedDeclarationTypeClass;
