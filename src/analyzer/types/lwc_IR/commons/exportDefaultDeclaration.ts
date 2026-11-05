import { isExportDefaultDeclaration, type ExportDefaultDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { classDeclarationTypePair, type ClassDeclarationTypeClass } from './classDeclaration';
import { enumDeclarationTypePair, type EnumDeclarationTypeClass } from './enumDeclaration';
import {
    functionDeclarationTypePair,
    type FunctionDeclarationTypeClass,
} from './functionDeclaration';
import { tSDeclareFunctionTypePair, type TSDeclareFunctionTypeClass } from './tSDeclareFunction';
import {
    tSInterfaceDeclarationTypePair,
    type TSInterfaceDeclarationTypeClass,
} from './tSInterfaceDeclaration';

const exportDefaultDeclarationDeclarationPairs = lazyPairs(
    () =>
        [
            functionDeclarationTypePair,
            classDeclarationTypePair,
            ...expressionVisitorEvaluatePairs(),
            tSDeclareFunctionTypePair,
            tSInterfaceDeclarationTypePair,
            enumDeclarationTypePair,
        ] as const,
);

export type ExportDefaultDeclarationFields = {
    declaration:
        | FunctionDeclarationTypeClass
        | ClassDeclarationTypeClass
        | ExpressionTypeClass
        | TSDeclareFunctionTypeClass
        | TSInterfaceDeclarationTypeClass
        | EnumDeclarationTypeClass
        | LwcErrorTypeClass;
    exportKind: NonNullable<ExportDefaultDeclaration['exportKind']> | null;
};

export class ExportDefaultDeclarationTypeClass extends LwcCommonTypeClass<'exportDefaultDeclaration'> {
    private readonly value: ExportDefaultDeclarationFields;

    private constructor(value: ExportDefaultDeclarationFields) {
        super('exportDefaultDeclaration');
        this.value = value;
    }

    static create(
        target: ExportDefaultDeclaration,
        originalSource: string,
    ): ExportDefaultDeclarationTypeClass {
        return new ExportDefaultDeclarationTypeClass({
            declaration: visitNode(
                target.declaration,
                originalSource,
                exportDefaultDeclarationDeclarationPairs(),
                'ExportDefaultDeclaration.declaration',
            ),
            exportKind: target.exportKind ?? null,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ExportDefaultDeclarationFields {
        return this.value;
    }

    getDeclaration(): ExportDefaultDeclarationFields['declaration'] {
        return this.value.declaration;
    }

    getExportKind(): ExportDefaultDeclarationFields['exportKind'] {
        return this.value.exportKind;
    }
}

export const exportDefaultDeclarationTypePair: EvaluatePair<
    ExportDefaultDeclaration,
    ExportDefaultDeclarationTypeClass
> = makeEvaluatePair(isExportDefaultDeclaration, (target, originalSource) =>
    ExportDefaultDeclarationTypeClass.create(target, originalSource),
);

export const isExportDefaultDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is ExportDefaultDeclarationTypeClass =>
    target instanceof ExportDefaultDeclarationTypeClass;
