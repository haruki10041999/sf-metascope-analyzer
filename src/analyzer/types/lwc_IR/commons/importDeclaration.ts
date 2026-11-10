import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import {
    isImportDeclaration,
    isImportDefaultSpecifier,
    isImportNamespaceSpecifier,
    isImportSpecifier,
    type ImportDeclaration,
} from '@babel/types';
import { failIrBuild } from '../buildFailure';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { ImportAttributeTypeClass } from '../standardizedVisitor/importAttribute';
import { ImportDefaultSpecifierTypeClass } from './importDefaultSpecifier';
import { ImportNamespaceSpecifierTypeClass } from './importNamespaceSpecifier';
import { ImportSpecifierTypeClass } from './importSpecifier';
import { StringLiteralTypeClass } from './stringLiteral';

/** default の import のあとに続くもの (`{ a, b }` か `* as ns`)。どちらか一方だけ書ける */
export type ImportBindings =
    | { kind: 'named'; specifiers: ImportSpecifierTypeClass[] }
    | { kind: 'namespace'; specifier: ImportNamespaceSpecifierTypeClass };

/**
 * phase ごとに書ける specifier が決まる。
 * - なし: `import a from` / `import a, { b } from` / `import * as ns from` / `import 'x'` など
 * - source: `import source a from 'x'` (default 1 個だけ)
 * - defer: `import defer * as ns from 'x'` (namespace 1 個だけ)
 */
type ImportDeclarationPhaseFields =
    | {
          phase: null;
          default: ImportDefaultSpecifierTypeClass | null;
          bindings: ImportBindings | null;
      }
    | { phase: 'source'; default: ImportDefaultSpecifierTypeClass; bindings: null }
    | {
          phase: 'defer';
          default: null;
          bindings: { kind: 'namespace'; specifier: ImportNamespaceSpecifierTypeClass };
      };

export type ImportDeclarationFields = TypeField<'importDeclaration'> & {
    attributes: ImportAttributeTypeClass[] | null;
    source: StringLiteralTypeClass;
    importKind: NonNullable<ImportDeclaration['importKind']>;
} & ImportDeclarationPhaseFields;

const createPhaseFields = (
    target: ImportDeclaration,
    originalSource: string,
): ImportDeclarationPhaseFields => {
    const defaultSpecifiers = target.specifiers.filter(isImportDefaultSpecifier);
    const namespaceSpecifiers = target.specifiers.filter(isImportNamespaceSpecifier);
    const namedSpecifiers = target.specifiers.filter(isImportSpecifier);

    const [defaultSpecifier, ...extraDefaults] = defaultSpecifiers;
    const [namespaceSpecifier, ...extraNamespaces] = namespaceSpecifiers;
    if (
        extraDefaults.length > 0 ||
        extraNamespaces.length > 0 ||
        (namespaceSpecifier && namedSpecifiers.length > 0)
    ) {
        return failIrBuild(
            'TYPE_MISMATCH',
            target,
            originalSource,
            'ImportDeclaration の specifiers の組み合わせが正しくありません',
        );
    }

    const defaultNode =
        defaultSpecifier == null
            ? null
            : ImportDefaultSpecifierTypeClass.create(defaultSpecifier, originalSource);
    const namespace =
        namespaceSpecifier == null
            ? null
            : {
                  kind: 'namespace' as const,
                  specifier: ImportNamespaceSpecifierTypeClass.create(
                      namespaceSpecifier,
                      originalSource,
                  ),
              };
    const bindings: ImportBindings | null =
        namespace ??
        (namedSpecifiers.length > 0
            ? {
                  kind: 'named',
                  specifiers: namedSpecifiers.map((child) =>
                      ImportSpecifierTypeClass.create(child, originalSource),
                  ),
              }
            : null);

    switch (target.phase ?? null) {
        case null:
            return { phase: null, default: defaultNode, bindings };
        case 'source':
            if (defaultNode == null || bindings != null) {
                return failIrBuild(
                    'TYPE_MISMATCH',
                    target,
                    originalSource,
                    'import source は default の specifier 1 個だけを持ちます',
                );
            }
            return { phase: 'source', default: defaultNode, bindings: null };
        case 'defer':
            if (defaultNode != null || namespace == null) {
                return failIrBuild(
                    'TYPE_MISMATCH',
                    target,
                    originalSource,
                    'import defer は namespace の specifier 1 個だけを持ちます',
                );
            }
            return { phase: 'defer', default: null, bindings: namespace };
    }
};

export class ImportDeclarationTypeClass extends LwcCommonTypeClass<
    'importDeclaration',
    ImportDeclarationFields
> {
    private constructor(value: FieldsOf<ImportDeclarationFields>, sourceSpan: SourceSpan) {
        super('importDeclaration', value, sourceSpan);
    }

    static create(target: ImportDeclaration, originalSource: string): ImportDeclarationTypeClass {
        return new ImportDeclarationTypeClass(
            {
                attributes:
                    target.attributes == null
                        ? null
                        : target.attributes.map((child) =>
                              ImportAttributeTypeClass.create(child, originalSource),
                          ),
                source: StringLiteralTypeClass.create(target.source, originalSource),
                importKind: target.importKind ?? 'value',
                ...createPhaseFields(target, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getAttributes(): ImportDeclarationFields['attributes'] {
        return this.getFields().attributes;
    }

    getPhase(): ImportDeclarationFields['phase'] {
        return this.getFields().phase;
    }

    getDefault(): ImportDeclarationFields['default'] {
        return this.getFields().default;
    }

    getBindings(): ImportDeclarationFields['bindings'] {
        return this.getFields().bindings;
    }

    getSource(): ImportDeclarationFields['source'] {
        return this.getFields().source;
    }

    getImportKind(): ImportDeclarationFields['importKind'] {
        return this.getFields().importKind;
    }
}

export const importDeclarationTypePair: EvaluatePair<
    ImportDeclaration,
    ImportDeclarationTypeClass
> = makeEvaluatePair(isImportDeclaration, (target, originalSource) =>
    ImportDeclarationTypeClass.create(target, originalSource),
);

export const isImportDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ImportDeclarationTypeClass => target instanceof ImportDeclarationTypeClass;
