import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import {
    isDeclareExportDeclaration,
    isExportSpecifier,
    type DeclareExportDeclaration,
} from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { failIrBuild } from '../buildFailure';
import { flowVisitorEvaluatePairs, type FlowTypeClass } from '../flowVisitor';
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

const declareExportDeclarationSpecifiersPairs = lazyPairs(
    () => [exportSpecifierTypePair, exportNamespaceSpecifierTypePair] as const,
);

/**
 * export の形ごとに、書けるフィールドが決まる (ExportNamedDeclaration と同じ)。
 * default (`declare export default T`) を書けるのは declaration の形だけ
 */
type DeclareExportDeclarationKindFields =
    | { kind: 'declaration'; declaration: FlowTypeClass; default: boolean }
    | { kind: 'local'; specifiers: LocalExportSpecifierTypeClass[] }
    | {
          kind: 'reexport';
          specifiers: (ExportSpecifierTypeClass | ExportNamespaceSpecifierTypeClass)[];
          source: StringLiteralTypeClass;
          attributes: ImportAttributeTypeClass[] | null;
      };

export type DeclareExportDeclarationFields = TypeField<'declareExportDeclaration'> &
    DeclareExportDeclarationKindFields;

const createKindFields = (
    target: DeclareExportDeclaration,
    originalSource: string,
): DeclareExportDeclarationKindFields => {
    const specifiers = target.specifiers ?? [];
    if (target.declaration != null) {
        if (specifiers.length > 0 || target.source != null) {
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
                flowVisitorEvaluatePairs(),
                'FlowVisitor',
            ),
            default: target.default ?? false,
        };
    }
    if (target.default) {
        return failIrBuild(
            'TYPE_MISMATCH',
            target,
            originalSource,
            'default の export には declaration が要ります',
        );
    }
    if (target.source == null) {
        return {
            kind: 'local',
            specifiers: specifiers.map((child) =>
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
            specifiers,
            originalSource,
            declareExportDeclarationSpecifiersPairs(),
            'DeclareExportDeclaration.specifiers',
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

export class DeclareExportDeclarationTypeClass extends LwcCommonTypeClass<
    'declareExportDeclaration',
    DeclareExportDeclarationFields
> {
    private constructor(value: FieldsOf<DeclareExportDeclarationFields>, sourceSpan: SourceSpan) {
        super('declareExportDeclaration', value, sourceSpan);
    }

    static create(
        target: DeclareExportDeclaration,
        originalSource: string,
    ): DeclareExportDeclarationTypeClass {
        return new DeclareExportDeclarationTypeClass(
            createKindFields(target, originalSource),
            getSourceSpan(target, originalSource),
        );
    }

    getKind(): DeclareExportDeclarationFields['kind'] {
        return this.getFields().kind;
    }
}

export const declareExportDeclarationTypePair: EvaluatePair<
    DeclareExportDeclaration,
    DeclareExportDeclarationTypeClass
> = makeEvaluatePair(isDeclareExportDeclaration, (target, originalSource) =>
    DeclareExportDeclarationTypeClass.create(target, originalSource),
);

export const isDeclareExportDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is DeclareExportDeclarationTypeClass =>
    target instanceof DeclareExportDeclarationTypeClass;
