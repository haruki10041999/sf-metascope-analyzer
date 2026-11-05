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

export const exportDeclarationVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            exportAllDeclarationTypePair,
            exportDefaultDeclarationTypePair,
            exportNamedDeclarationTypePair,
        ] as const,
);

export class ExportDeclarationVisitor extends LwcCommonVisitor<
    ReturnType<typeof exportDeclarationVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return exportDeclarationVisitorEvaluatePairs();
    }
}

export type ExportDeclarationTypeClass =
    | ExportAllDeclarationTypeClass
    | ExportDefaultDeclarationTypeClass
    | ExportNamedDeclarationTypeClass;

export const isExportDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is ExportDeclarationTypeClass => {
    return (
        target instanceof ExportAllDeclarationTypeClass ||
        target instanceof ExportDefaultDeclarationTypeClass ||
        target instanceof ExportNamedDeclarationTypeClass
    );
};
