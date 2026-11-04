import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
import {
    ExportAllDeclarationTypeClass,
    exportAllDeclarationTypePair,
} from '../commons/exportAllDeclaration';
import {
    ExportDefaultDeclarationTypeClass,
    exportDefaultDeclarationTypePair,
} from '../commons/exportDefaultDeclaration';
import {
    ExportNamedDeclarationTypeClass,
    exportNamedDeclarationTypePair,
} from '../commons/exportNamedDeclaration';
import {
    ImportDeclarationTypeClass,
    importDeclarationTypePair,
} from '../commons/importDeclaration';

export {
    ExportAllDeclarationTypeClass,
    exportAllDeclarationTypePair,
    isExportAllDeclarationType,
} from '../commons/exportAllDeclaration';
export {
    ExportDefaultDeclarationTypeClass,
    exportDefaultDeclarationTypePair,
    isExportDefaultDeclarationType,
} from '../commons/exportDefaultDeclaration';
export {
    ExportNamedDeclarationTypeClass,
    exportNamedDeclarationTypePair,
    isExportNamedDeclarationType,
} from '../commons/exportNamedDeclaration';
export {
    ImportDeclarationTypeClass,
    importDeclarationTypePair,
    isImportDeclarationType,
} from '../commons/importDeclaration';

const importOrExportDeclarationVisitorEvaluatePairs = [
    exportAllDeclarationTypePair,
    exportDefaultDeclarationTypePair,
    exportNamedDeclarationTypePair,
    importDeclarationTypePair,
] as const;

export class ImportOrExportDeclarationVisitor extends LwcCommonVisitor<
    (typeof importOrExportDeclarationVisitorEvaluatePairs)[number]
> {
    readonly evaluatePair = importOrExportDeclarationVisitorEvaluatePairs;
}

export type ImportOrExportDeclarationTypeClass =
    | ExportAllDeclarationTypeClass
    | ExportDefaultDeclarationTypeClass
    | ExportNamedDeclarationTypeClass
    | ImportDeclarationTypeClass;

export const isImportOrExportDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is ImportOrExportDeclarationTypeClass => {
    return (
        target instanceof ExportAllDeclarationTypeClass ||
        target instanceof ExportDefaultDeclarationTypeClass ||
        target instanceof ExportNamedDeclarationTypeClass ||
        target instanceof ImportDeclarationTypeClass
    );
};
