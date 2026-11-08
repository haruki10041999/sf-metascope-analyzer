import { isDeclareExportDeclaration, type DeclareExportDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    visitOptionalNode,
} from '../commonVisitor';
import { flowVisitorEvaluatePairs, type FlowTypeClass } from '../flowVisitor';
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

const declareExportDeclarationSpecifiersPairs = lazyPairs(
    () => [exportSpecifierTypePair, exportNamespaceSpecifierTypePair] as const,
);
const declareExportDeclarationSourcePairs = lazyPairs(() => [stringLiteralTypePair] as const);
const declareExportDeclarationAttributesPairs = lazyPairs(() => [importAttributeTypePair] as const);

export type DeclareExportDeclarationFields = {
    declaration: FlowTypeClass | LwcErrorTypeClass | null;
    specifiers:
        (ExportSpecifierTypeClass | ExportNamespaceSpecifierTypeClass | LwcErrorTypeClass)[] | null;
    source: StringLiteralTypeClass | LwcErrorTypeClass | null;
    default: NonNullable<DeclareExportDeclaration['default']> | null;
    attributes: (ImportAttributeTypeClass | LwcErrorTypeClass)[] | null;
};

export class DeclareExportDeclarationTypeClass extends LwcCommonTypeClass<'declareExportDeclaration'> {
    private readonly value: DeclareExportDeclarationFields;

    private constructor(value: DeclareExportDeclarationFields) {
        super('declareExportDeclaration');
        this.value = value;
    }

    static create(
        target: DeclareExportDeclaration,
        originalSource: string,
    ): DeclareExportDeclarationTypeClass {
        return new DeclareExportDeclarationTypeClass({
            declaration: visitOptionalNode(
                target.declaration,
                originalSource,
                flowVisitorEvaluatePairs(),
                'FlowVisitor',
            ),
            specifiers:
                target.specifiers == null
                    ? null
                    : visitNodeList(
                          target.specifiers,
                          originalSource,
                          declareExportDeclarationSpecifiersPairs(),
                          'DeclareExportDeclaration.specifiers',
                      ),
            source: visitOptionalNode(
                target.source,
                originalSource,
                declareExportDeclarationSourcePairs(),
                'DeclareExportDeclaration.source',
            ),
            default: target.default ?? null,
            attributes:
                target.attributes == null
                    ? null
                    : visitNodeList(
                          target.attributes,
                          originalSource,
                          declareExportDeclarationAttributesPairs(),
                          'DeclareExportDeclaration.attributes',
                      ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): DeclareExportDeclarationFields {
        return this.value;
    }

    getDeclaration(): DeclareExportDeclarationFields['declaration'] {
        return this.value.declaration;
    }

    getSpecifiers(): DeclareExportDeclarationFields['specifiers'] {
        return this.value.specifiers;
    }

    getSource(): DeclareExportDeclarationFields['source'] {
        return this.value.source;
    }

    getDefault(): DeclareExportDeclarationFields['default'] {
        return this.value.default;
    }

    getAttributes(): DeclareExportDeclarationFields['attributes'] {
        return this.value.attributes;
    }
}

export const declareExportDeclarationTypePair: EvaluatePair<
    DeclareExportDeclaration,
    DeclareExportDeclarationTypeClass
> = makeEvaluatePair(isDeclareExportDeclaration, (target, originalSource) =>
    DeclareExportDeclarationTypeClass.create(target, originalSource),
);

export const isDeclareExportDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareExportDeclarationTypeClass =>
    target instanceof DeclareExportDeclarationTypeClass;
