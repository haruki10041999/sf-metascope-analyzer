import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import {
    isClassDeclaration,
    isEnumDeclaration,
    isExportDefaultDeclaration,
    isFunctionDeclaration,
    isTSDeclareFunction,
    isTSInterfaceDeclaration,
    type ExportDefaultDeclaration,
} from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { ClassDeclarationTypeClass } from './classDeclaration';
import { EnumDeclarationTypeClass } from './enumDeclaration';
import { FunctionDeclarationTypeClass } from './functionDeclaration';
import { type IdentifierTypeClass } from './identifier';
import { TSDeclareFunctionTypeClass } from './tSDeclareFunction';
import { TSInterfaceDeclarationTypeClass } from './tSInterfaceDeclaration';

/**
 * export default のあとに来るものの種類。
 * 名前のないクラス・関数の宣言 (`export default class {}`) を書けるのはここだけなので、id は null を許す。
 * - class: `export default class A {}` (LWC のコンポーネントのクラス)
 * - function: `export default function f() {}`
 * - expression: `export default foo` / `export default { ... }`
 * - ts: `export default function f(): void;` (オーバーロード) / `export default interface I {}`
 * - flow: `export default enum E {}` (Flow の enum)
 */
type ExportDefaultDeclarationKindFields =
    | { kind: 'class'; declaration: ClassDeclarationTypeClass<IdentifierTypeClass | null> }
    | {
          kind: 'function';
          declaration: FunctionDeclarationTypeClass<IdentifierTypeClass | null>;
      }
    | { kind: 'expression'; declaration: ExpressionTypeClass }
    | {
          kind: 'ts';
          declaration:
              | TSDeclareFunctionTypeClass<IdentifierTypeClass | null>
              | TSInterfaceDeclarationTypeClass;
      }
    | { kind: 'flow'; declaration: EnumDeclarationTypeClass };

export type ExportDefaultDeclarationFields = TypeField<'exportDefaultDeclaration'> &
    ExportDefaultDeclarationKindFields;

const createKindFields = (
    declaration: ExportDefaultDeclaration['declaration'],
    originalSource: string,
): ExportDefaultDeclarationKindFields => {
    if (isClassDeclaration(declaration)) {
        return {
            kind: 'class',
            declaration: ClassDeclarationTypeClass.createDefaultExport(declaration, originalSource),
        };
    }
    if (isFunctionDeclaration(declaration)) {
        return {
            kind: 'function',
            declaration: FunctionDeclarationTypeClass.createDefaultExport(
                declaration,
                originalSource,
            ),
        };
    }
    if (isTSDeclareFunction(declaration)) {
        return {
            kind: 'ts',
            declaration: TSDeclareFunctionTypeClass.createDefaultExport(
                declaration,
                originalSource,
            ),
        };
    }
    if (isTSInterfaceDeclaration(declaration)) {
        return {
            kind: 'ts',
            declaration: TSInterfaceDeclarationTypeClass.create(declaration, originalSource),
        };
    }
    if (isEnumDeclaration(declaration)) {
        return {
            kind: 'flow',
            declaration: EnumDeclarationTypeClass.create(declaration, originalSource),
        };
    }
    return {
        kind: 'expression',
        declaration: visitNode(
            declaration,
            originalSource,
            expressionVisitorEvaluatePairs(),
            'ExpressionVisitor',
        ),
    };
};

export class ExportDefaultDeclarationTypeClass extends LwcCommonTypeClass<
    'exportDefaultDeclaration',
    ExportDefaultDeclarationFields
> {
    private constructor(value: FieldsOf<ExportDefaultDeclarationFields>, sourceSpan: SourceSpan) {
        super('exportDefaultDeclaration', value, sourceSpan);
    }

    static create(
        target: ExportDefaultDeclaration,
        originalSource: string,
    ): ExportDefaultDeclarationTypeClass {
        return new ExportDefaultDeclarationTypeClass(
            createKindFields(target.declaration, originalSource),
            getSourceSpan(target, originalSource),
        );
    }

    getKind(): ExportDefaultDeclarationFields['kind'] {
        return this.getFields().kind;
    }

    getDeclaration(): ExportDefaultDeclarationFields['declaration'] {
        return this.getFields().declaration;
    }
}

export const exportDefaultDeclarationTypePair: EvaluatePair<
    ExportDefaultDeclaration,
    ExportDefaultDeclarationTypeClass
> = makeEvaluatePair(isExportDefaultDeclaration, (target, originalSource) =>
    ExportDefaultDeclarationTypeClass.create(target, originalSource),
);

export const isExportDefaultDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ExportDefaultDeclarationTypeClass =>
    target instanceof ExportDefaultDeclarationTypeClass;
