import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isExportSpecifier, isIdentifier, type ExportSpecifier } from '@babel/types';
import { failIrBuild } from '../buildFailure';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { IdentifierTypeClass, identifierTypePair } from './identifier';
import { stringLiteralTypePair, type StringLiteralTypeClass } from './stringLiteral';

const exportSpecifierLocalPairs = lazyPairs(
    () => [identifierTypePair, stringLiteralTypePair] as const,
);
const exportSpecifierExportedPairs = lazyPairs(
    () => [identifierTypePair, stringLiteralTypePair] as const,
);

/** 再エクスポート (`export { a as b } from 'x'`) の specifier。local に文字列 (`export { 'a b' as c } from 'x'`) も書ける */
export type ExportSpecifierFields = TypeField<'exportSpecifier'> & {
    local: IdentifierTypeClass | StringLiteralTypeClass;
    exported: IdentifierTypeClass | StringLiteralTypeClass;
    exportKind: NonNullable<ExportSpecifier['exportKind']>;
};

export class ExportSpecifierTypeClass extends LwcCommonTypeClass<
    'exportSpecifier',
    ExportSpecifierFields
> {
    private constructor(value: FieldsOf<ExportSpecifierFields>, sourceSpan: SourceSpan) {
        super('exportSpecifier', value, sourceSpan);
    }

    static create(target: ExportSpecifier, originalSource: string): ExportSpecifierTypeClass {
        return new ExportSpecifierTypeClass(
            {
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
                exportKind: target.exportKind ?? 'value',
            },
            getSourceSpan(target, originalSource),
        );
    }

    getLocal(): ExportSpecifierFields['local'] {
        return this.getFields().local;
    }

    getExported(): ExportSpecifierFields['exported'] {
        return this.getFields().exported;
    }

    getExportKind(): ExportSpecifierFields['exportKind'] {
        return this.getFields().exportKind;
    }
}

/** ローカルの export (`export { a as b }`。source がない) の specifier。local は識別子だけ */
export type LocalExportSpecifierFields = TypeField<'localExportSpecifier'> & {
    local: IdentifierTypeClass;
    exported: IdentifierTypeClass | StringLiteralTypeClass;
    exportKind: NonNullable<ExportSpecifier['exportKind']>;
};

export class LocalExportSpecifierTypeClass extends LwcCommonTypeClass<
    'localExportSpecifier',
    LocalExportSpecifierFields
> {
    private constructor(value: FieldsOf<LocalExportSpecifierFields>, sourceSpan: SourceSpan) {
        super('localExportSpecifier', value, sourceSpan);
    }

    static create(target: ExportSpecifier, originalSource: string): LocalExportSpecifierTypeClass {
        if (!isIdentifier(target.local)) {
            return failIrBuild(
                'TYPE_MISMATCH',
                target,
                originalSource,
                'source のない export の local は識別子だけです',
            );
        }
        return new LocalExportSpecifierTypeClass(
            {
                local: IdentifierTypeClass.create(target.local, originalSource),
                exported: visitNode(
                    target.exported,
                    originalSource,
                    exportSpecifierExportedPairs(),
                    'ExportSpecifier.exported',
                ),
                exportKind: target.exportKind ?? 'value',
            },
            getSourceSpan(target, originalSource),
        );
    }

    getLocal(): LocalExportSpecifierFields['local'] {
        return this.getFields().local;
    }

    getExported(): LocalExportSpecifierFields['exported'] {
        return this.getFields().exported;
    }

    getExportKind(): LocalExportSpecifierFields['exportKind'] {
        return this.getFields().exportKind;
    }
}

export const exportSpecifierTypePair: EvaluatePair<ExportSpecifier, ExportSpecifierTypeClass> =
    makeEvaluatePair(isExportSpecifier, (target, originalSource) =>
        ExportSpecifierTypeClass.create(target, originalSource),
    );

export const isExportSpecifierType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ExportSpecifierTypeClass => target instanceof ExportSpecifierTypeClass;

export const isLocalExportSpecifierType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is LocalExportSpecifierTypeClass => target instanceof LocalExportSpecifierTypeClass;
