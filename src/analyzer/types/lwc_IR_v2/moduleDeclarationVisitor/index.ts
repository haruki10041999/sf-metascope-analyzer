import { type TypeField } from '../../commons/ir';
import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
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

export const moduleDeclarationVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            exportAllDeclarationTypePair,
            exportDefaultDeclarationTypePair,
            exportNamedDeclarationTypePair,
            importDeclarationTypePair,
        ] as const,
);

export class ModuleDeclarationVisitor extends LwcCommonVisitor<
    ReturnType<typeof moduleDeclarationVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return moduleDeclarationVisitorEvaluatePairs();
    }
}

export type ModuleDeclarationTypeClass =
    | ExportAllDeclarationTypeClass
    | ExportDefaultDeclarationTypeClass
    | ExportNamedDeclarationTypeClass
    | ImportDeclarationTypeClass;

export const isModuleDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ModuleDeclarationTypeClass => {
    return (
        target instanceof ExportAllDeclarationTypeClass ||
        target instanceof ExportDefaultDeclarationTypeClass ||
        target instanceof ExportNamedDeclarationTypeClass ||
        target instanceof ImportDeclarationTypeClass
    );
};
