import { isDeclareExportAllDeclaration, type DeclareExportAllDeclaration } from '@babel/types';
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

const declareExportAllDeclarationSourcePairs = lazyPairs(() => [stringLiteralTypePair] as const);
const declareExportAllDeclarationAttributesPairs = lazyPairs(
    () => [importAttributeTypePair] as const,
);

export type DeclareExportAllDeclarationFields = {
    source: StringLiteralTypeClass | LwcErrorTypeClass;
    exportKind: NonNullable<DeclareExportAllDeclaration['exportKind']> | null;
    attributes: (ImportAttributeTypeClass | LwcErrorTypeClass)[] | null;
};

export class DeclareExportAllDeclarationTypeClass extends LwcCommonTypeClass<'declareExportAllDeclaration'> {
    private readonly value: DeclareExportAllDeclarationFields;

    private constructor(value: DeclareExportAllDeclarationFields) {
        super('declareExportAllDeclaration');
        this.value = value;
    }

    static create(
        target: DeclareExportAllDeclaration,
        originalSource: string,
    ): DeclareExportAllDeclarationTypeClass {
        return new DeclareExportAllDeclarationTypeClass({
            source: visitNode(
                target.source,
                originalSource,
                declareExportAllDeclarationSourcePairs(),
                'DeclareExportAllDeclaration.source',
            ),
            exportKind: target.exportKind ?? null,
            attributes:
                target.attributes == null
                    ? null
                    : visitNodeList(
                          target.attributes,
                          originalSource,
                          declareExportAllDeclarationAttributesPairs(),
                          'DeclareExportAllDeclaration.attributes',
                      ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): DeclareExportAllDeclarationFields {
        return this.value;
    }

    getSource(): DeclareExportAllDeclarationFields['source'] {
        return this.value.source;
    }

    getExportKind(): DeclareExportAllDeclarationFields['exportKind'] {
        return this.value.exportKind;
    }

    getAttributes(): DeclareExportAllDeclarationFields['attributes'] {
        return this.value.attributes;
    }
}

export const declareExportAllDeclarationTypePair: EvaluatePair<
    DeclareExportAllDeclaration,
    DeclareExportAllDeclarationTypeClass
> = makeEvaluatePair(isDeclareExportAllDeclaration, (target, originalSource) =>
    DeclareExportAllDeclarationTypeClass.create(target, originalSource),
);

export const isDeclareExportAllDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareExportAllDeclarationTypeClass =>
    target instanceof DeclareExportAllDeclarationTypeClass;
