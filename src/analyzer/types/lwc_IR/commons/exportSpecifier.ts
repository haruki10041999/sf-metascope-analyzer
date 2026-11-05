import { isExportSpecifier, type ExportSpecifier } from '@babel/types';
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

const exportSpecifierLocalPairs = lazyPairs(
    () => [identifierTypePair, stringLiteralTypePair] as const,
);
const exportSpecifierExportedPairs = lazyPairs(
    () => [identifierTypePair, stringLiteralTypePair] as const,
);

export type ExportSpecifierFields = {
    local: IdentifierTypeClass | StringLiteralTypeClass | LwcErrorTypeClass;
    exported: IdentifierTypeClass | StringLiteralTypeClass | LwcErrorTypeClass;
    exportKind: NonNullable<ExportSpecifier['exportKind']> | null;
};

export class ExportSpecifierTypeClass extends LwcCommonTypeClass<'exportSpecifier'> {
    private readonly value: ExportSpecifierFields;

    private constructor(value: ExportSpecifierFields) {
        super('exportSpecifier');
        this.value = value;
    }

    static create(target: ExportSpecifier, originalSource: string): ExportSpecifierTypeClass {
        return new ExportSpecifierTypeClass({
            local: visitNode(
                target.local,
                originalSource,
                exportSpecifierLocalPairs(),
                'ExportSpecifier.local',
            ),
            exported: visitNode(
                target.exported,
                originalSource,
                exportSpecifierExportedPairs(),
                'ExportSpecifier.exported',
            ),
            exportKind: target.exportKind ?? null,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ExportSpecifierFields {
        return this.value;
    }

    getLocal(): ExportSpecifierFields['local'] {
        return this.value.local;
    }

    getExported(): ExportSpecifierFields['exported'] {
        return this.value.exported;
    }

    getExportKind(): ExportSpecifierFields['exportKind'] {
        return this.value.exportKind;
    }
}

export const exportSpecifierTypePair: EvaluatePair<ExportSpecifier, ExportSpecifierTypeClass> =
    makeEvaluatePair(isExportSpecifier, (target, originalSource) =>
        ExportSpecifierTypeClass.create(target, originalSource),
    );

export const isExportSpecifierType = (
    target: LwcCommonTypeClass<string>,
): target is ExportSpecifierTypeClass => target instanceof ExportSpecifierTypeClass;
