import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import {
    isExportNamedDeclaration,
    isExportSpecifier,
    type ExportNamedDeclaration,
} from '@babel/types';
import { failIrBuild } from '../buildFailure';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { declarationVisitorEvaluatePairs, type DeclarationTypeClass } from '../declarationVisitor';
import {
    exportDefaultSpecifierTypePair,
    type ExportDefaultSpecifierTypeClass,
} from '../moduleSpecifierVisitor/exportDefaultSpecifier';
import { ImportAttributeTypeClass } from '../standardizedVisitor/importAttribute';
import {
    exportNamespaceSpecifierTypePair,
    type ExportNamespaceSpecifierTypeClass,
} from './exportNamespaceSpecifier';
import {
    exportSpecifierTypePair,
    LocalExportSpecifierTypeClass,
    type ExportSpecifierTypeClass,
} from './exportSpecifier';
import { StringLiteralTypeClass } from './stringLiteral';

const exportNamedDeclarationSpecifiersPairs = lazyPairs(
    () =>
        [
            exportSpecifierTypePair,
            exportDefaultSpecifierTypePair,
            exportNamespaceSpecifierTypePair,
        ] as const,
);

/**
 * export の形ごとに、書けるフィールドが決まる。
 * - declaration: `export const a = 1` / `export class A {}`
 * - local: `export { a, b as c }` (source がない。specifier の local は識別子だけ)
 * - reexport: `export { a } from 'x'` / `export * as ns from 'x'` / `export v from 'x'`
 */
type ExportNamedDeclarationFormFields =
    | { kind: 'declaration'; declaration: DeclarationTypeClass }
    | { kind: 'local'; specifiers: LocalExportSpecifierTypeClass[] }
    | {
          kind: 'reexport';
          specifiers: (
              | ExportSpecifierTypeClass
              | ExportDefaultSpecifierTypeClass
              | ExportNamespaceSpecifierTypeClass
          )[];
          source: StringLiteralTypeClass;
          attributes: ImportAttributeTypeClass[] | null;
      };

export type ExportNamedDeclarationFields = TypeField<'exportNamedDeclaration'> & {
    exportKind: NonNullable<ExportNamedDeclaration['exportKind']>;
} & ExportNamedDeclarationFormFields;

const createFormFields = (
    target: ExportNamedDeclaration,
    originalSource: string,
): ExportNamedDeclarationFormFields => {
    if (target.declaration != null) {
        if (target.specifiers.length > 0 || target.source != null) {
            return failIrBuild(
                'TYPE_MISMATCH',
                target,
                originalSource,
                'declaration のある export に specifiers・source は書けません',
            );
        }
        return {
            kind: 'declaration',
            declaration: visitNode(
                target.declaration,
                originalSource,
                declarationVisitorEvaluatePairs(),
                'DeclarationVisitor',
            ),
        };
    }

    if (target.source == null) {
        return {
            kind: 'local',
            specifiers: target.specifiers.map((child) =>
                isExportSpecifier(child)
                    ? LocalExportSpecifierTypeClass.create(child, originalSource)
                    : failIrBuild(
                          'TYPE_MISMATCH',
                          child,
                          originalSource,
                          'source のない export に書けるのは ExportSpecifier だけです',
                      ),
            ),
        };
    }

    return {
        kind: 'reexport',
        specifiers: visitNodeList(
            target.specifiers,
            originalSource,
            exportNamedDeclarationSpecifiersPairs(),
            'ExportNamedDeclaration.specifiers',
        ),
        source: StringLiteralTypeClass.create(target.source, originalSource),
        attributes:
            target.attributes == null
                ? null
                : target.attributes.map((child) =>
                      ImportAttributeTypeClass.create(child, originalSource),
                  ),
    };
};

export class ExportNamedDeclarationTypeClass extends LwcCommonTypeClass<
    'exportNamedDeclaration',
    ExportNamedDeclarationFields
> {
    private constructor(value: FieldsOf<ExportNamedDeclarationFields>, sourceSpan: SourceSpan) {
        super('exportNamedDeclaration', value, sourceSpan);
    }

    static create(
        target: ExportNamedDeclaration,
        originalSource: string,
    ): ExportNamedDeclarationTypeClass {
        return new ExportNamedDeclarationTypeClass(
            {
                exportKind: target.exportKind ?? 'value',
                ...createFormFields(target, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getKind(): ExportNamedDeclarationFields['kind'] {
        return this.getFields().kind;
    }

    getExportKind(): ExportNamedDeclarationFields['exportKind'] {
        return this.getFields().exportKind;
    }
}

export const exportNamedDeclarationTypePair: EvaluatePair<
    ExportNamedDeclaration,
    ExportNamedDeclarationTypeClass
> = makeEvaluatePair(isExportNamedDeclaration, (target, originalSource) =>
    ExportNamedDeclarationTypeClass.create(target, originalSource),
);

export const isExportNamedDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ExportNamedDeclarationTypeClass => target instanceof ExportNamedDeclarationTypeClass;
