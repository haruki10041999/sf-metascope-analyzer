import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
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

const flowDeclarationVisitorEvaluatePairs = [
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
] as const;

export class FlowDeclarationVisitor extends LwcCommonVisitor<
    (typeof flowDeclarationVisitorEvaluatePairs)[number]
> {
    readonly evaluatePair = flowDeclarationVisitorEvaluatePairs;
}

export type FlowDeclarationTypeClass =
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
    | TypeAliasTypeClass;

export const isFlowDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is FlowDeclarationTypeClass => {
    return (
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
        target instanceof TypeAliasTypeClass
    );
};
