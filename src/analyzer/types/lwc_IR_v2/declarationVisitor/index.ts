import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import {
    FunctionDeclarationTypeClass,
    functionDeclarationTypePair,
} from '../commons/functionDeclaration';
import {
    VariableDeclarationTypeClass,
    variableDeclarationTypePair,
} from '../commons/variableDeclaration';
import { ClassDeclarationTypeClass, classDeclarationTypePair } from '../commons/classDeclaration';
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
import { DeclareClassTypeClass, declareClassTypePair } from '../commons/declareClass';
import { DeclareFunctionTypeClass, declareFunctionTypePair } from '../commons/declareFunction';
import { DeclareInterfaceTypeClass, declareInterfaceTypePair } from '../commons/declareInterface';
import { DeclareModuleTypeClass, declareModuleTypePair } from '../commons/declareModule';
import {
    DeclareModuleExportsTypeClass,
    declareModuleExportsTypePair,
} from '../commons/declareModuleExports';
import { DeclareTypeAliasTypeClass, declareTypeAliasTypePair } from '../commons/declareTypeAlias';
import {
    DeclareOpaqueTypeTypeClass,
    declareOpaqueTypeTypePair,
} from '../commons/declareOpaqueType';
import { DeclareVariableTypeClass, declareVariableTypePair } from '../commons/declareVariable';
import {
    DeclareExportDeclarationTypeClass,
    declareExportDeclarationTypePair,
} from '../commons/declareExportDeclaration';
import {
    DeclareExportAllDeclarationTypeClass,
    declareExportAllDeclarationTypePair,
} from '../commons/declareExportAllDeclaration';
import {
    InterfaceDeclarationTypeClass,
    interfaceDeclarationTypePair,
} from '../commons/interfaceDeclaration';
import { OpaqueTypeTypeClass, opaqueTypeTypePair } from '../commons/opaqueType';
import { TypeAliasTypeClass, typeAliasTypePair } from '../commons/typeAlias';
import { EnumDeclarationTypeClass, enumDeclarationTypePair } from '../commons/enumDeclaration';
import {
    TSDeclareFunctionTypeClass,
    tSDeclareFunctionTypePair,
} from '../commons/tSDeclareFunction';
import {
    TSInterfaceDeclarationTypeClass,
    tSInterfaceDeclarationTypePair,
} from '../commons/tSInterfaceDeclaration';
import {
    TSTypeAliasDeclarationTypeClass,
    tSTypeAliasDeclarationTypePair,
} from '../commons/tSTypeAliasDeclaration';
import {
    TSEnumDeclarationTypeClass,
    tSEnumDeclarationTypePair,
} from '../commons/tSEnumDeclaration';
import {
    TSModuleDeclarationTypeClass,
    tSModuleDeclarationTypePair,
} from '../commons/tSModuleDeclaration';
import {
    TSImportEqualsDeclarationTypeClass,
    tSImportEqualsDeclarationTypePair,
} from '../commons/tSImportEqualsDeclaration';

export {
    FunctionDeclarationTypeClass,
    functionDeclarationTypePair,
    isFunctionDeclarationType,
} from '../commons/functionDeclaration';
export {
    VariableDeclarationTypeClass,
    variableDeclarationTypePair,
    isVariableDeclarationType,
} from '../commons/variableDeclaration';
export {
    ClassDeclarationTypeClass,
    classDeclarationTypePair,
    isClassDeclarationType,
} from '../commons/classDeclaration';
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
export {
    DeclareClassTypeClass,
    declareClassTypePair,
    isDeclareClassType,
} from '../commons/declareClass';
export {
    DeclareFunctionTypeClass,
    declareFunctionTypePair,
    isDeclareFunctionType,
} from '../commons/declareFunction';
export {
    DeclareInterfaceTypeClass,
    declareInterfaceTypePair,
    isDeclareInterfaceType,
} from '../commons/declareInterface';
export {
    DeclareModuleTypeClass,
    declareModuleTypePair,
    isDeclareModuleType,
} from '../commons/declareModule';
export {
    DeclareModuleExportsTypeClass,
    declareModuleExportsTypePair,
    isDeclareModuleExportsType,
} from '../commons/declareModuleExports';
export {
    DeclareTypeAliasTypeClass,
    declareTypeAliasTypePair,
    isDeclareTypeAliasType,
} from '../commons/declareTypeAlias';
export {
    DeclareOpaqueTypeTypeClass,
    declareOpaqueTypeTypePair,
    isDeclareOpaqueTypeType,
} from '../commons/declareOpaqueType';
export {
    DeclareVariableTypeClass,
    declareVariableTypePair,
    isDeclareVariableType,
} from '../commons/declareVariable';
export {
    DeclareExportDeclarationTypeClass,
    declareExportDeclarationTypePair,
    isDeclareExportDeclarationType,
} from '../commons/declareExportDeclaration';
export {
    DeclareExportAllDeclarationTypeClass,
    declareExportAllDeclarationTypePair,
    isDeclareExportAllDeclarationType,
} from '../commons/declareExportAllDeclaration';
export {
    InterfaceDeclarationTypeClass,
    interfaceDeclarationTypePair,
    isInterfaceDeclarationType,
} from '../commons/interfaceDeclaration';
export { OpaqueTypeTypeClass, opaqueTypeTypePair, isOpaqueTypeType } from '../commons/opaqueType';
export { TypeAliasTypeClass, typeAliasTypePair, isTypeAliasType } from '../commons/typeAlias';
export {
    EnumDeclarationTypeClass,
    enumDeclarationTypePair,
    isEnumDeclarationType,
} from '../commons/enumDeclaration';
export {
    TSDeclareFunctionTypeClass,
    tSDeclareFunctionTypePair,
    isTSDeclareFunctionType,
} from '../commons/tSDeclareFunction';
export {
    TSInterfaceDeclarationTypeClass,
    tSInterfaceDeclarationTypePair,
    isTSInterfaceDeclarationType,
} from '../commons/tSInterfaceDeclaration';
export {
    TSTypeAliasDeclarationTypeClass,
    tSTypeAliasDeclarationTypePair,
    isTSTypeAliasDeclarationType,
} from '../commons/tSTypeAliasDeclaration';
export {
    TSEnumDeclarationTypeClass,
    tSEnumDeclarationTypePair,
    isTSEnumDeclarationType,
} from '../commons/tSEnumDeclaration';
export {
    TSModuleDeclarationTypeClass,
    tSModuleDeclarationTypePair,
    isTSModuleDeclarationType,
} from '../commons/tSModuleDeclaration';
export {
    TSImportEqualsDeclarationTypeClass,
    tSImportEqualsDeclarationTypePair,
    isTSImportEqualsDeclarationType,
} from '../commons/tSImportEqualsDeclaration';

export const declarationVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            functionDeclarationTypePair,
            variableDeclarationTypePair,
            classDeclarationTypePair,
            exportAllDeclarationTypePair,
            exportDefaultDeclarationTypePair,
            exportNamedDeclarationTypePair,
            importDeclarationTypePair,
            declareClassTypePair,
            declareFunctionTypePair,
            declareInterfaceTypePair,
            declareModuleTypePair,
            declareModuleExportsTypePair,
            declareTypeAliasTypePair,
            declareOpaqueTypeTypePair,
            declareVariableTypePair,
            declareExportDeclarationTypePair,
            declareExportAllDeclarationTypePair,
            interfaceDeclarationTypePair,
            opaqueTypeTypePair,
            typeAliasTypePair,
            enumDeclarationTypePair,
            tSDeclareFunctionTypePair,
            tSInterfaceDeclarationTypePair,
            tSTypeAliasDeclarationTypePair,
            tSEnumDeclarationTypePair,
            tSModuleDeclarationTypePair,
            tSImportEqualsDeclarationTypePair,
        ] as const,
);

export class DeclarationVisitor extends LwcCommonVisitor<
    ReturnType<typeof declarationVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return declarationVisitorEvaluatePairs();
    }
}

export type DeclarationTypeClass =
    | FunctionDeclarationTypeClass
    | VariableDeclarationTypeClass
    | ClassDeclarationTypeClass
    | ExportAllDeclarationTypeClass
    | ExportDefaultDeclarationTypeClass
    | ExportNamedDeclarationTypeClass
    | ImportDeclarationTypeClass
    | DeclareClassTypeClass
    | DeclareFunctionTypeClass
    | DeclareInterfaceTypeClass
    | DeclareModuleTypeClass
    | DeclareModuleExportsTypeClass
    | DeclareTypeAliasTypeClass
    | DeclareOpaqueTypeTypeClass
    | DeclareVariableTypeClass
    | DeclareExportDeclarationTypeClass
    | DeclareExportAllDeclarationTypeClass
    | InterfaceDeclarationTypeClass
    | OpaqueTypeTypeClass
    | TypeAliasTypeClass
    | EnumDeclarationTypeClass
    | TSDeclareFunctionTypeClass
    | TSInterfaceDeclarationTypeClass
    | TSTypeAliasDeclarationTypeClass
    | TSEnumDeclarationTypeClass
    | TSModuleDeclarationTypeClass
    | TSImportEqualsDeclarationTypeClass;

export const isDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is DeclarationTypeClass => {
    return (
        target instanceof FunctionDeclarationTypeClass ||
        target instanceof VariableDeclarationTypeClass ||
        target instanceof ClassDeclarationTypeClass ||
        target instanceof ExportAllDeclarationTypeClass ||
        target instanceof ExportDefaultDeclarationTypeClass ||
        target instanceof ExportNamedDeclarationTypeClass ||
        target instanceof ImportDeclarationTypeClass ||
        target instanceof DeclareClassTypeClass ||
        target instanceof DeclareFunctionTypeClass ||
        target instanceof DeclareInterfaceTypeClass ||
        target instanceof DeclareModuleTypeClass ||
        target instanceof DeclareModuleExportsTypeClass ||
        target instanceof DeclareTypeAliasTypeClass ||
        target instanceof DeclareOpaqueTypeTypeClass ||
        target instanceof DeclareVariableTypeClass ||
        target instanceof DeclareExportDeclarationTypeClass ||
        target instanceof DeclareExportAllDeclarationTypeClass ||
        target instanceof InterfaceDeclarationTypeClass ||
        target instanceof OpaqueTypeTypeClass ||
        target instanceof TypeAliasTypeClass ||
        target instanceof EnumDeclarationTypeClass ||
        target instanceof TSDeclareFunctionTypeClass ||
        target instanceof TSInterfaceDeclarationTypeClass ||
        target instanceof TSTypeAliasDeclarationTypeClass ||
        target instanceof TSEnumDeclarationTypeClass ||
        target instanceof TSModuleDeclarationTypeClass ||
        target instanceof TSImportEqualsDeclarationTypeClass
    );
};
