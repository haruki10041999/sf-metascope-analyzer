import { isExportAllDeclaration, type ExportAllDeclaration } from '@babel/types';
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
import { stringLiteralTypePair, type StringLiteralTypeClass } from './stringLiteral';

const exportAllDeclarationSourcePairs = lazyPairs(() => [stringLiteralTypePair] as const);
const exportAllDeclarationAttributesPairs = lazyPairs(() => [importAttributeTypePair] as const);

export type ExportAllDeclarationFields = {
    source: StringLiteralTypeClass | LwcErrorTypeClass;
    exportKind: NonNullable<ExportAllDeclaration['exportKind']> | null;
    attributes: (ImportAttributeTypeClass | LwcErrorTypeClass)[] | null;
};

export class ExportAllDeclarationTypeClass extends LwcCommonTypeClass<'exportAllDeclaration'> {
    private readonly value: ExportAllDeclarationFields;

    private constructor(value: ExportAllDeclarationFields) {
        super('exportAllDeclaration');
        this.value = value;
    }

    static create(
        target: ExportAllDeclaration,
        originalSource: string,
    ): ExportAllDeclarationTypeClass {
        return new ExportAllDeclarationTypeClass({
            source: visitNode(
                target.source,
                originalSource,
                exportAllDeclarationSourcePairs(),
                'ExportAllDeclaration.source',
            ),
            exportKind: target.exportKind ?? null,
            attributes:
                target.attributes == null
                    ? null
                    : visitNodeList(
                          target.attributes,
                          originalSource,
                          exportAllDeclarationAttributesPairs(),
                          'ExportAllDeclaration.attributes',
                      ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ExportAllDeclarationFields {
        return this.value;
    }

    getSource(): ExportAllDeclarationFields['source'] {
        return this.value.source;
    }

    getExportKind(): ExportAllDeclarationFields['exportKind'] {
        return this.value.exportKind;
    }

    getAttributes(): ExportAllDeclarationFields['attributes'] {
        return this.value.attributes;
    }
}

export const exportAllDeclarationTypePair: EvaluatePair<
    ExportAllDeclaration,
    ExportAllDeclarationTypeClass
> = makeEvaluatePair(isExportAllDeclaration, (target, originalSource) =>
    ExportAllDeclarationTypeClass.create(target, originalSource),
);

export const isExportAllDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is ExportAllDeclarationTypeClass => target instanceof ExportAllDeclarationTypeClass;
