import { type TypeField } from '../../commons/ir';
import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import {
    AnyTypeAnnotationTypeClass,
    anyTypeAnnotationTypePair,
} from '../commons/anyTypeAnnotation';
import {
    ArrayTypeAnnotationTypeClass,
    arrayTypeAnnotationTypePair,
} from '../commons/arrayTypeAnnotation';
import {
    BooleanTypeAnnotationTypeClass,
    booleanTypeAnnotationTypePair,
} from '../commons/booleanTypeAnnotation';
import {
    BooleanLiteralTypeAnnotationTypeClass,
    booleanLiteralTypeAnnotationTypePair,
} from '../commons/booleanLiteralTypeAnnotation';
import {
    NullLiteralTypeAnnotationTypeClass,
    nullLiteralTypeAnnotationTypePair,
} from '../commons/nullLiteralTypeAnnotation';
import { ClassImplementsTypeClass, classImplementsTypePair } from './classImplements';
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
    DeclaredPredicateTypeClass,
    declaredPredicateTypePair,
} from '../commons/declaredPredicate';
import {
    ExistsTypeAnnotationTypeClass,
    existsTypeAnnotationTypePair,
} from '../commons/existsTypeAnnotation';
import {
    FunctionTypeAnnotationTypeClass,
    functionTypeAnnotationTypePair,
} from '../commons/functionTypeAnnotation';
import { FunctionTypeParamTypeClass, functionTypeParamTypePair } from './functionTypeParam';
import {
    GenericTypeAnnotationTypeClass,
    genericTypeAnnotationTypePair,
} from '../commons/genericTypeAnnotation';
import {
    InferredPredicateTypeClass,
    inferredPredicateTypePair,
} from '../commons/inferredPredicate';
import { InterfaceExtendsTypeClass, interfaceExtendsTypePair } from './interfaceExtends';
import {
    InterfaceDeclarationTypeClass,
    interfaceDeclarationTypePair,
} from '../commons/interfaceDeclaration';
import {
    InterfaceTypeAnnotationTypeClass,
    interfaceTypeAnnotationTypePair,
} from '../commons/interfaceTypeAnnotation';
import {
    IntersectionTypeAnnotationTypeClass,
    intersectionTypeAnnotationTypePair,
} from '../commons/intersectionTypeAnnotation';
import {
    MixedTypeAnnotationTypeClass,
    mixedTypeAnnotationTypePair,
} from '../commons/mixedTypeAnnotation';
import {
    EmptyTypeAnnotationTypeClass,
    emptyTypeAnnotationTypePair,
} from '../commons/emptyTypeAnnotation';
import {
    NullableTypeAnnotationTypeClass,
    nullableTypeAnnotationTypePair,
} from '../commons/nullableTypeAnnotation';
import {
    NumberLiteralTypeAnnotationTypeClass,
    numberLiteralTypeAnnotationTypePair,
} from '../commons/numberLiteralTypeAnnotation';
import {
    BigIntLiteralTypeAnnotationTypeClass,
    bigIntLiteralTypeAnnotationTypePair,
} from '../commons/bigIntLiteralTypeAnnotation';
import {
    NumberTypeAnnotationTypeClass,
    numberTypeAnnotationTypePair,
} from '../commons/numberTypeAnnotation';
import {
    ObjectTypeAnnotationTypeClass,
    objectTypeAnnotationTypePair,
} from '../commons/objectTypeAnnotation';
import {
    ObjectTypeInternalSlotTypeClass,
    objectTypeInternalSlotTypePair,
} from '../commons/objectTypeInternalSlot';
import {
    ObjectTypeCallPropertyTypeClass,
    objectTypeCallPropertyTypePair,
} from '../commons/objectTypeCallProperty';
import {
    ObjectTypeIndexerTypeClass,
    objectTypeIndexerTypePair,
} from '../commons/objectTypeIndexer';
import {
    ObjectTypePropertyTypeClass,
    objectTypePropertyTypePair,
} from '../commons/objectTypeProperty';
import {
    ObjectTypeSpreadPropertyTypeClass,
    objectTypeSpreadPropertyTypePair,
} from '../commons/objectTypeSpreadProperty';
import { OpaqueTypeTypeClass, opaqueTypeTypePair } from '../commons/opaqueType';
import {
    QualifiedTypeIdentifierTypeClass,
    qualifiedTypeIdentifierTypePair,
} from './qualifiedTypeIdentifier';
import {
    StringLiteralTypeAnnotationTypeClass,
    stringLiteralTypeAnnotationTypePair,
} from '../commons/stringLiteralTypeAnnotation';
import {
    StringTypeAnnotationTypeClass,
    stringTypeAnnotationTypePair,
} from '../commons/stringTypeAnnotation';
import {
    SymbolTypeAnnotationTypeClass,
    symbolTypeAnnotationTypePair,
} from '../commons/symbolTypeAnnotation';
import {
    ThisTypeAnnotationTypeClass,
    thisTypeAnnotationTypePair,
} from '../commons/thisTypeAnnotation';
import {
    TupleTypeAnnotationTypeClass,
    tupleTypeAnnotationTypePair,
} from '../commons/tupleTypeAnnotation';
import {
    TypeofTypeAnnotationTypeClass,
    typeofTypeAnnotationTypePair,
} from '../commons/typeofTypeAnnotation';
import { TypeAliasTypeClass, typeAliasTypePair } from '../commons/typeAlias';
import { TypeAnnotationTypeClass, typeAnnotationTypePair } from './typeAnnotation';
import {
    TypeCastExpressionTypeClass,
    typeCastExpressionTypePair,
} from '../commons/typeCastExpression';
import { TypeParameterTypeClass, typeParameterTypePair } from './typeParameter';
import {
    TypeParameterDeclarationTypeClass,
    typeParameterDeclarationTypePair,
} from './typeParameterDeclaration';
import {
    TypeParameterInstantiationTypeClass,
    typeParameterInstantiationTypePair,
} from './typeParameterInstantiation';
import {
    UnionTypeAnnotationTypeClass,
    unionTypeAnnotationTypePair,
} from '../commons/unionTypeAnnotation';
import { VarianceTypeClass, varianceTypePair } from './variance';
import {
    VoidTypeAnnotationTypeClass,
    voidTypeAnnotationTypePair,
} from '../commons/voidTypeAnnotation';
import { EnumDeclarationTypeClass, enumDeclarationTypePair } from '../commons/enumDeclaration';
import { EnumBooleanBodyTypeClass, enumBooleanBodyTypePair } from '../commons/enumBooleanBody';
import { EnumNumberBodyTypeClass, enumNumberBodyTypePair } from '../commons/enumNumberBody';
import { EnumStringBodyTypeClass, enumStringBodyTypePair } from '../commons/enumStringBody';
import { EnumSymbolBodyTypeClass, enumSymbolBodyTypePair } from '../commons/enumSymbolBody';
import {
    EnumBooleanMemberTypeClass,
    enumBooleanMemberTypePair,
} from '../commons/enumBooleanMember';
import { EnumNumberMemberTypeClass, enumNumberMemberTypePair } from '../commons/enumNumberMember';
import { EnumStringMemberTypeClass, enumStringMemberTypePair } from '../commons/enumStringMember';
import {
    EnumDefaultedMemberTypeClass,
    enumDefaultedMemberTypePair,
} from '../commons/enumDefaultedMember';
import {
    IndexedAccessTypeTypeClass,
    indexedAccessTypeTypePair,
} from '../commons/indexedAccessType';
import {
    OptionalIndexedAccessTypeTypeClass,
    optionalIndexedAccessTypeTypePair,
} from '../commons/optionalIndexedAccessType';

export {
    AnyTypeAnnotationTypeClass,
    anyTypeAnnotationTypePair,
    isAnyTypeAnnotationType,
} from '../commons/anyTypeAnnotation';
export {
    ArrayTypeAnnotationTypeClass,
    arrayTypeAnnotationTypePair,
    isArrayTypeAnnotationType,
} from '../commons/arrayTypeAnnotation';
export {
    BooleanTypeAnnotationTypeClass,
    booleanTypeAnnotationTypePair,
    isBooleanTypeAnnotationType,
} from '../commons/booleanTypeAnnotation';
export {
    BooleanLiteralTypeAnnotationTypeClass,
    booleanLiteralTypeAnnotationTypePair,
    isBooleanLiteralTypeAnnotationType,
} from '../commons/booleanLiteralTypeAnnotation';
export {
    NullLiteralTypeAnnotationTypeClass,
    nullLiteralTypeAnnotationTypePair,
    isNullLiteralTypeAnnotationType,
} from '../commons/nullLiteralTypeAnnotation';
export {
    ClassImplementsTypeClass,
    classImplementsTypePair,
    isClassImplementsType,
} from './classImplements';
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
    DeclaredPredicateTypeClass,
    declaredPredicateTypePair,
    isDeclaredPredicateType,
} from '../commons/declaredPredicate';
export {
    ExistsTypeAnnotationTypeClass,
    existsTypeAnnotationTypePair,
    isExistsTypeAnnotationType,
} from '../commons/existsTypeAnnotation';
export {
    FunctionTypeAnnotationTypeClass,
    functionTypeAnnotationTypePair,
    isFunctionTypeAnnotationType,
} from '../commons/functionTypeAnnotation';
export {
    FunctionTypeParamTypeClass,
    functionTypeParamTypePair,
    isFunctionTypeParamType,
} from './functionTypeParam';
export {
    GenericTypeAnnotationTypeClass,
    genericTypeAnnotationTypePair,
    isGenericTypeAnnotationType,
} from '../commons/genericTypeAnnotation';
export {
    InferredPredicateTypeClass,
    inferredPredicateTypePair,
    isInferredPredicateType,
} from '../commons/inferredPredicate';
export {
    InterfaceExtendsTypeClass,
    interfaceExtendsTypePair,
    isInterfaceExtendsType,
} from './interfaceExtends';
export {
    InterfaceDeclarationTypeClass,
    interfaceDeclarationTypePair,
    isInterfaceDeclarationType,
} from '../commons/interfaceDeclaration';
export {
    InterfaceTypeAnnotationTypeClass,
    interfaceTypeAnnotationTypePair,
    isInterfaceTypeAnnotationType,
} from '../commons/interfaceTypeAnnotation';
export {
    IntersectionTypeAnnotationTypeClass,
    intersectionTypeAnnotationTypePair,
    isIntersectionTypeAnnotationType,
} from '../commons/intersectionTypeAnnotation';
export {
    MixedTypeAnnotationTypeClass,
    mixedTypeAnnotationTypePair,
    isMixedTypeAnnotationType,
} from '../commons/mixedTypeAnnotation';
export {
    EmptyTypeAnnotationTypeClass,
    emptyTypeAnnotationTypePair,
    isEmptyTypeAnnotationType,
} from '../commons/emptyTypeAnnotation';
export {
    NullableTypeAnnotationTypeClass,
    nullableTypeAnnotationTypePair,
    isNullableTypeAnnotationType,
} from '../commons/nullableTypeAnnotation';
export {
    NumberLiteralTypeAnnotationTypeClass,
    numberLiteralTypeAnnotationTypePair,
    isNumberLiteralTypeAnnotationType,
} from '../commons/numberLiteralTypeAnnotation';
export {
    BigIntLiteralTypeAnnotationTypeClass,
    bigIntLiteralTypeAnnotationTypePair,
    isBigIntLiteralTypeAnnotationType,
} from '../commons/bigIntLiteralTypeAnnotation';
export {
    NumberTypeAnnotationTypeClass,
    numberTypeAnnotationTypePair,
    isNumberTypeAnnotationType,
} from '../commons/numberTypeAnnotation';
export {
    ObjectTypeAnnotationTypeClass,
    objectTypeAnnotationTypePair,
    isObjectTypeAnnotationType,
} from '../commons/objectTypeAnnotation';
export {
    ObjectTypeInternalSlotTypeClass,
    objectTypeInternalSlotTypePair,
    isObjectTypeInternalSlotType,
} from '../commons/objectTypeInternalSlot';
export {
    ObjectTypeCallPropertyTypeClass,
    objectTypeCallPropertyTypePair,
    isObjectTypeCallPropertyType,
} from '../commons/objectTypeCallProperty';
export {
    ObjectTypeIndexerTypeClass,
    objectTypeIndexerTypePair,
    isObjectTypeIndexerType,
} from '../commons/objectTypeIndexer';
export {
    ObjectTypePropertyTypeClass,
    objectTypePropertyTypePair,
    isObjectTypePropertyType,
} from '../commons/objectTypeProperty';
export {
    ObjectTypeSpreadPropertyTypeClass,
    objectTypeSpreadPropertyTypePair,
    isObjectTypeSpreadPropertyType,
} from '../commons/objectTypeSpreadProperty';
export { OpaqueTypeTypeClass, opaqueTypeTypePair, isOpaqueTypeType } from '../commons/opaqueType';
export {
    QualifiedTypeIdentifierTypeClass,
    qualifiedTypeIdentifierTypePair,
    isQualifiedTypeIdentifierType,
} from './qualifiedTypeIdentifier';
export {
    StringLiteralTypeAnnotationTypeClass,
    stringLiteralTypeAnnotationTypePair,
    isStringLiteralTypeAnnotationType,
} from '../commons/stringLiteralTypeAnnotation';
export {
    StringTypeAnnotationTypeClass,
    stringTypeAnnotationTypePair,
    isStringTypeAnnotationType,
} from '../commons/stringTypeAnnotation';
export {
    SymbolTypeAnnotationTypeClass,
    symbolTypeAnnotationTypePair,
    isSymbolTypeAnnotationType,
} from '../commons/symbolTypeAnnotation';
export {
    ThisTypeAnnotationTypeClass,
    thisTypeAnnotationTypePair,
    isThisTypeAnnotationType,
} from '../commons/thisTypeAnnotation';
export {
    TupleTypeAnnotationTypeClass,
    tupleTypeAnnotationTypePair,
    isTupleTypeAnnotationType,
} from '../commons/tupleTypeAnnotation';
export {
    TypeofTypeAnnotationTypeClass,
    typeofTypeAnnotationTypePair,
    isTypeofTypeAnnotationType,
} from '../commons/typeofTypeAnnotation';
export { TypeAliasTypeClass, typeAliasTypePair, isTypeAliasType } from '../commons/typeAlias';
export {
    TypeAnnotationTypeClass,
    typeAnnotationTypePair,
    isTypeAnnotationType,
} from './typeAnnotation';
export {
    TypeCastExpressionTypeClass,
    typeCastExpressionTypePair,
    isTypeCastExpressionType,
} from '../commons/typeCastExpression';
export {
    TypeParameterTypeClass,
    typeParameterTypePair,
    isTypeParameterType,
} from './typeParameter';
export {
    TypeParameterDeclarationTypeClass,
    typeParameterDeclarationTypePair,
    isTypeParameterDeclarationType,
} from './typeParameterDeclaration';
export {
    TypeParameterInstantiationTypeClass,
    typeParameterInstantiationTypePair,
    isTypeParameterInstantiationType,
} from './typeParameterInstantiation';
export {
    UnionTypeAnnotationTypeClass,
    unionTypeAnnotationTypePair,
    isUnionTypeAnnotationType,
} from '../commons/unionTypeAnnotation';
export { VarianceTypeClass, varianceTypePair, isVarianceType } from './variance';
export {
    VoidTypeAnnotationTypeClass,
    voidTypeAnnotationTypePair,
    isVoidTypeAnnotationType,
} from '../commons/voidTypeAnnotation';
export {
    EnumDeclarationTypeClass,
    enumDeclarationTypePair,
    isEnumDeclarationType,
} from '../commons/enumDeclaration';
export {
    EnumBooleanBodyTypeClass,
    enumBooleanBodyTypePair,
    isEnumBooleanBodyType,
} from '../commons/enumBooleanBody';
export {
    EnumNumberBodyTypeClass,
    enumNumberBodyTypePair,
    isEnumNumberBodyType,
} from '../commons/enumNumberBody';
export {
    EnumStringBodyTypeClass,
    enumStringBodyTypePair,
    isEnumStringBodyType,
} from '../commons/enumStringBody';
export {
    EnumSymbolBodyTypeClass,
    enumSymbolBodyTypePair,
    isEnumSymbolBodyType,
} from '../commons/enumSymbolBody';
export {
    EnumBooleanMemberTypeClass,
    enumBooleanMemberTypePair,
    isEnumBooleanMemberType,
} from '../commons/enumBooleanMember';
export {
    EnumNumberMemberTypeClass,
    enumNumberMemberTypePair,
    isEnumNumberMemberType,
} from '../commons/enumNumberMember';
export {
    EnumStringMemberTypeClass,
    enumStringMemberTypePair,
    isEnumStringMemberType,
} from '../commons/enumStringMember';
export {
    EnumDefaultedMemberTypeClass,
    enumDefaultedMemberTypePair,
    isEnumDefaultedMemberType,
} from '../commons/enumDefaultedMember';
export {
    IndexedAccessTypeTypeClass,
    indexedAccessTypeTypePair,
    isIndexedAccessTypeType,
} from '../commons/indexedAccessType';
export {
    OptionalIndexedAccessTypeTypeClass,
    optionalIndexedAccessTypeTypePair,
    isOptionalIndexedAccessTypeType,
} from '../commons/optionalIndexedAccessType';

export const flowVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            anyTypeAnnotationTypePair,
            arrayTypeAnnotationTypePair,
            booleanTypeAnnotationTypePair,
            booleanLiteralTypeAnnotationTypePair,
            nullLiteralTypeAnnotationTypePair,
            classImplementsTypePair,
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
            declaredPredicateTypePair,
            existsTypeAnnotationTypePair,
            functionTypeAnnotationTypePair,
            functionTypeParamTypePair,
            genericTypeAnnotationTypePair,
            inferredPredicateTypePair,
            interfaceExtendsTypePair,
            interfaceDeclarationTypePair,
            interfaceTypeAnnotationTypePair,
            intersectionTypeAnnotationTypePair,
            mixedTypeAnnotationTypePair,
            emptyTypeAnnotationTypePair,
            nullableTypeAnnotationTypePair,
            numberLiteralTypeAnnotationTypePair,
            bigIntLiteralTypeAnnotationTypePair,
            numberTypeAnnotationTypePair,
            objectTypeAnnotationTypePair,
            objectTypeInternalSlotTypePair,
            objectTypeCallPropertyTypePair,
            objectTypeIndexerTypePair,
            objectTypePropertyTypePair,
            objectTypeSpreadPropertyTypePair,
            opaqueTypeTypePair,
            qualifiedTypeIdentifierTypePair,
            stringLiteralTypeAnnotationTypePair,
            stringTypeAnnotationTypePair,
            symbolTypeAnnotationTypePair,
            thisTypeAnnotationTypePair,
            tupleTypeAnnotationTypePair,
            typeofTypeAnnotationTypePair,
            typeAliasTypePair,
            typeAnnotationTypePair,
            typeCastExpressionTypePair,
            typeParameterTypePair,
            typeParameterDeclarationTypePair,
            typeParameterInstantiationTypePair,
            unionTypeAnnotationTypePair,
            varianceTypePair,
            voidTypeAnnotationTypePair,
            enumDeclarationTypePair,
            enumBooleanBodyTypePair,
            enumNumberBodyTypePair,
            enumStringBodyTypePair,
            enumSymbolBodyTypePair,
            enumBooleanMemberTypePair,
            enumNumberMemberTypePair,
            enumStringMemberTypePair,
            enumDefaultedMemberTypePair,
            indexedAccessTypeTypePair,
            optionalIndexedAccessTypeTypePair,
        ] as const,
);

export class FlowVisitor extends LwcCommonVisitor<
    ReturnType<typeof flowVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return flowVisitorEvaluatePairs();
    }
}

export type FlowTypeClass =
    | AnyTypeAnnotationTypeClass
    | ArrayTypeAnnotationTypeClass
    | BooleanTypeAnnotationTypeClass
    | BooleanLiteralTypeAnnotationTypeClass
    | NullLiteralTypeAnnotationTypeClass
    | ClassImplementsTypeClass
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
    | DeclaredPredicateTypeClass
    | ExistsTypeAnnotationTypeClass
    | FunctionTypeAnnotationTypeClass
    | FunctionTypeParamTypeClass
    | GenericTypeAnnotationTypeClass
    | InferredPredicateTypeClass
    | InterfaceExtendsTypeClass
    | InterfaceDeclarationTypeClass
    | InterfaceTypeAnnotationTypeClass
    | IntersectionTypeAnnotationTypeClass
    | MixedTypeAnnotationTypeClass
    | EmptyTypeAnnotationTypeClass
    | NullableTypeAnnotationTypeClass
    | NumberLiteralTypeAnnotationTypeClass
    | BigIntLiteralTypeAnnotationTypeClass
    | NumberTypeAnnotationTypeClass
    | ObjectTypeAnnotationTypeClass
    | ObjectTypeInternalSlotTypeClass
    | ObjectTypeCallPropertyTypeClass
    | ObjectTypeIndexerTypeClass
    | ObjectTypePropertyTypeClass
    | ObjectTypeSpreadPropertyTypeClass
    | OpaqueTypeTypeClass
    | QualifiedTypeIdentifierTypeClass
    | StringLiteralTypeAnnotationTypeClass
    | StringTypeAnnotationTypeClass
    | SymbolTypeAnnotationTypeClass
    | ThisTypeAnnotationTypeClass
    | TupleTypeAnnotationTypeClass
    | TypeofTypeAnnotationTypeClass
    | TypeAliasTypeClass
    | TypeAnnotationTypeClass
    | TypeCastExpressionTypeClass
    | TypeParameterTypeClass
    | TypeParameterDeclarationTypeClass
    | TypeParameterInstantiationTypeClass
    | UnionTypeAnnotationTypeClass
    | VarianceTypeClass
    | VoidTypeAnnotationTypeClass
    | EnumDeclarationTypeClass
    | EnumBooleanBodyTypeClass
    | EnumNumberBodyTypeClass
    | EnumStringBodyTypeClass
    | EnumSymbolBodyTypeClass
    | EnumBooleanMemberTypeClass
    | EnumNumberMemberTypeClass
    | EnumStringMemberTypeClass
    | EnumDefaultedMemberTypeClass
    | IndexedAccessTypeTypeClass
    | OptionalIndexedAccessTypeTypeClass;

export const isFlowType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is FlowTypeClass => {
    return (
        target instanceof AnyTypeAnnotationTypeClass ||
        target instanceof ArrayTypeAnnotationTypeClass ||
        target instanceof BooleanTypeAnnotationTypeClass ||
        target instanceof BooleanLiteralTypeAnnotationTypeClass ||
        target instanceof NullLiteralTypeAnnotationTypeClass ||
        target instanceof ClassImplementsTypeClass ||
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
        target instanceof DeclaredPredicateTypeClass ||
        target instanceof ExistsTypeAnnotationTypeClass ||
        target instanceof FunctionTypeAnnotationTypeClass ||
        target instanceof FunctionTypeParamTypeClass ||
        target instanceof GenericTypeAnnotationTypeClass ||
        target instanceof InferredPredicateTypeClass ||
        target instanceof InterfaceExtendsTypeClass ||
        target instanceof InterfaceDeclarationTypeClass ||
        target instanceof InterfaceTypeAnnotationTypeClass ||
        target instanceof IntersectionTypeAnnotationTypeClass ||
        target instanceof MixedTypeAnnotationTypeClass ||
        target instanceof EmptyTypeAnnotationTypeClass ||
        target instanceof NullableTypeAnnotationTypeClass ||
        target instanceof NumberLiteralTypeAnnotationTypeClass ||
        target instanceof BigIntLiteralTypeAnnotationTypeClass ||
        target instanceof NumberTypeAnnotationTypeClass ||
        target instanceof ObjectTypeAnnotationTypeClass ||
        target instanceof ObjectTypeInternalSlotTypeClass ||
        target instanceof ObjectTypeCallPropertyTypeClass ||
        target instanceof ObjectTypeIndexerTypeClass ||
        target instanceof ObjectTypePropertyTypeClass ||
        target instanceof ObjectTypeSpreadPropertyTypeClass ||
        target instanceof OpaqueTypeTypeClass ||
        target instanceof QualifiedTypeIdentifierTypeClass ||
        target instanceof StringLiteralTypeAnnotationTypeClass ||
        target instanceof StringTypeAnnotationTypeClass ||
        target instanceof SymbolTypeAnnotationTypeClass ||
        target instanceof ThisTypeAnnotationTypeClass ||
        target instanceof TupleTypeAnnotationTypeClass ||
        target instanceof TypeofTypeAnnotationTypeClass ||
        target instanceof TypeAliasTypeClass ||
        target instanceof TypeAnnotationTypeClass ||
        target instanceof TypeCastExpressionTypeClass ||
        target instanceof TypeParameterTypeClass ||
        target instanceof TypeParameterDeclarationTypeClass ||
        target instanceof TypeParameterInstantiationTypeClass ||
        target instanceof UnionTypeAnnotationTypeClass ||
        target instanceof VarianceTypeClass ||
        target instanceof VoidTypeAnnotationTypeClass ||
        target instanceof EnumDeclarationTypeClass ||
        target instanceof EnumBooleanBodyTypeClass ||
        target instanceof EnumNumberBodyTypeClass ||
        target instanceof EnumStringBodyTypeClass ||
        target instanceof EnumSymbolBodyTypeClass ||
        target instanceof EnumBooleanMemberTypeClass ||
        target instanceof EnumNumberMemberTypeClass ||
        target instanceof EnumStringMemberTypeClass ||
        target instanceof EnumDefaultedMemberTypeClass ||
        target instanceof IndexedAccessTypeTypeClass ||
        target instanceof OptionalIndexedAccessTypeTypeClass
    );
};
