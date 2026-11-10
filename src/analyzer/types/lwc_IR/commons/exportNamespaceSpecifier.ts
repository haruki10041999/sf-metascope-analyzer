import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isExportNamespaceSpecifier, type ExportNamespaceSpecifier } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { stringLiteralTypePair, type StringLiteralTypeClass } from './stringLiteral';

const exportNamespaceSpecifierExportedPairs = lazyPairs(
    () => [identifierTypePair, stringLiteralTypePair] as const,
);

export type ExportNamespaceSpecifierFields = TypeField<'exportNamespaceSpecifier'> & {
    exported: IdentifierTypeClass | StringLiteralTypeClass;
};

export class ExportNamespaceSpecifierTypeClass extends LwcCommonTypeClass<
    'exportNamespaceSpecifier',
    ExportNamespaceSpecifierFields
> {
    private constructor(value: FieldsOf<ExportNamespaceSpecifierFields>, sourceSpan: SourceSpan) {
        super('exportNamespaceSpecifier', value, sourceSpan);
    }

    static create(
        target: ExportNamespaceSpecifier,
        originalSource: string,
    ): ExportNamespaceSpecifierTypeClass {
        return new ExportNamespaceSpecifierTypeClass(
            {
                exported: visitNode(
                    target.exported,
                    originalSource,
                    exportNamespaceSpecifierExportedPairs(),
                    'ExportNamespaceSpecifier.exported',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getExported(): ExportNamespaceSpecifierFields['exported'] {
        return this.getFields().exported;
    }
}

export const exportNamespaceSpecifierTypePair: EvaluatePair<
    ExportNamespaceSpecifier,
    ExportNamespaceSpecifierTypeClass
> = makeEvaluatePair(isExportNamespaceSpecifier, (target, originalSource) =>
    ExportNamespaceSpecifierTypeClass.create(target, originalSource),
);

export const isExportNamespaceSpecifierType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ExportNamespaceSpecifierTypeClass =>
    target instanceof ExportNamespaceSpecifierTypeClass;
