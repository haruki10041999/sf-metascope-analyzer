import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { ExportSpecifierTypeClass, exportSpecifierTypePair } from '../commons/exportSpecifier';
import {
    ImportDefaultSpecifierTypeClass,
    importDefaultSpecifierTypePair,
} from '../commons/importDefaultSpecifier';
import {
    ImportNamespaceSpecifierTypeClass,
    importNamespaceSpecifierTypePair,
} from '../commons/importNamespaceSpecifier';
import { ImportSpecifierTypeClass, importSpecifierTypePair } from '../commons/importSpecifier';
import {
    ExportNamespaceSpecifierTypeClass,
    exportNamespaceSpecifierTypePair,
} from '../commons/exportNamespaceSpecifier';
import {
    ExportDefaultSpecifierTypeClass,
    exportDefaultSpecifierTypePair,
} from './exportDefaultSpecifier';

export {
    ExportSpecifierTypeClass,
    exportSpecifierTypePair,
    isExportSpecifierType,
} from '../commons/exportSpecifier';
export {
    ImportDefaultSpecifierTypeClass,
    importDefaultSpecifierTypePair,
    isImportDefaultSpecifierType,
} from '../commons/importDefaultSpecifier';
export {
    ImportNamespaceSpecifierTypeClass,
    importNamespaceSpecifierTypePair,
    isImportNamespaceSpecifierType,
} from '../commons/importNamespaceSpecifier';
export {
    ImportSpecifierTypeClass,
    importSpecifierTypePair,
    isImportSpecifierType,
} from '../commons/importSpecifier';
export {
    ExportNamespaceSpecifierTypeClass,
    exportNamespaceSpecifierTypePair,
    isExportNamespaceSpecifierType,
} from '../commons/exportNamespaceSpecifier';
export {
    ExportDefaultSpecifierTypeClass,
    exportDefaultSpecifierTypePair,
    isExportDefaultSpecifierType,
} from './exportDefaultSpecifier';

export const moduleSpecifierVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            exportSpecifierTypePair,
            importDefaultSpecifierTypePair,
            importNamespaceSpecifierTypePair,
            importSpecifierTypePair,
            exportNamespaceSpecifierTypePair,
            exportDefaultSpecifierTypePair,
        ] as const,
);

export class ModuleSpecifierVisitor extends LwcCommonVisitor<
    ReturnType<typeof moduleSpecifierVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return moduleSpecifierVisitorEvaluatePairs();
    }
}

export type ModuleSpecifierTypeClass =
    | ExportSpecifierTypeClass
    | ImportDefaultSpecifierTypeClass
    | ImportNamespaceSpecifierTypeClass
    | ImportSpecifierTypeClass
    | ExportNamespaceSpecifierTypeClass
    | ExportDefaultSpecifierTypeClass;

export const isModuleSpecifierType = (
    target: LwcCommonTypeClass<string>,
): target is ModuleSpecifierTypeClass => {
    return (
        target instanceof ExportSpecifierTypeClass ||
        target instanceof ImportDefaultSpecifierTypeClass ||
        target instanceof ImportNamespaceSpecifierTypeClass ||
        target instanceof ImportSpecifierTypeClass ||
        target instanceof ExportNamespaceSpecifierTypeClass ||
        target instanceof ExportDefaultSpecifierTypeClass
    );
};
