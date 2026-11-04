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

const moduleDeclarationVisitorEvaluatePairs = [
    exportAllDeclarationTypePair,
    exportDefaultDeclarationTypePair,
    exportNamedDeclarationTypePair,
    importDeclarationTypePair,
] as const;

export class ModuleDeclarationVisitor extends LwcCommonVisitor<
    (typeof moduleDeclarationVisitorEvaluatePairs)[number]
> {
    readonly evaluatePair = moduleDeclarationVisitorEvaluatePairs;
}

export type ModuleDeclarationTypeClass =
    | ExportAllDeclarationTypeClass
    | ExportDefaultDeclarationTypeClass
    | ExportNamedDeclarationTypeClass
    | ImportDeclarationTypeClass;

export const isModuleDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is ModuleDeclarationTypeClass => {
    return (
        target instanceof ExportAllDeclarationTypeClass ||
        target instanceof ExportDefaultDeclarationTypeClass ||
        target instanceof ExportNamedDeclarationTypeClass ||
        target instanceof ImportDeclarationTypeClass
    );
};
