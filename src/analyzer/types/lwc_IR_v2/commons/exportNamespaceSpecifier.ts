import { isExportNamespaceSpecifier, type ExportNamespaceSpecifier } from '@babel/types';
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

const exportNamespaceSpecifierExportedPairs = lazyPairs(
    () => [identifierTypePair, stringLiteralTypePair] as const,
);

export type ExportNamespaceSpecifierFields = {
    exported: IdentifierTypeClass | StringLiteralTypeClass | LwcErrorTypeClass;
};

export class ExportNamespaceSpecifierTypeClass extends LwcCommonTypeClass<'exportNamespaceSpecifier'> {
    private readonly value: ExportNamespaceSpecifierFields;

    private constructor(value: ExportNamespaceSpecifierFields) {
        super('exportNamespaceSpecifier');
        this.value = value;
    }

    static create(
        target: ExportNamespaceSpecifier,
        originalSource: string,
    ): ExportNamespaceSpecifierTypeClass {
        return new ExportNamespaceSpecifierTypeClass({
            exported: visitNode(
                target.exported,
                originalSource,
                exportNamespaceSpecifierExportedPairs(),
                'ExportNamespaceSpecifier.exported',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ExportNamespaceSpecifierFields {
        return this.value;
    }

    getExported(): ExportNamespaceSpecifierFields['exported'] {
        return this.value.exported;
    }
}

export const exportNamespaceSpecifierTypePair: EvaluatePair<
    ExportNamespaceSpecifier,
    ExportNamespaceSpecifierTypeClass
> = makeEvaluatePair(isExportNamespaceSpecifier, (target, originalSource) =>
    ExportNamespaceSpecifierTypeClass.create(target, originalSource),
);

export const isExportNamespaceSpecifierType = (
    target: LwcCommonTypeClass<string>,
): target is ExportNamespaceSpecifierTypeClass =>
    target instanceof ExportNamespaceSpecifierTypeClass;
