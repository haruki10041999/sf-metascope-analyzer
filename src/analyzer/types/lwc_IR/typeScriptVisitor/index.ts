import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { TSParameterPropertyTypeClass, tSParameterPropertyTypePair } from './tSParameterProperty';
import {
    TSDeclareFunctionTypeClass,
    tSDeclareFunctionTypePair,
} from '../commons/tSDeclareFunction';
import { TSDeclareMethodTypeClass, tSDeclareMethodTypePair } from './tSDeclareMethod';
import { TSQualifiedNameTypeClass, tSQualifiedNameTypePair } from '../commons/tSQualifiedName';
import {
    TSCallSignatureDeclarationTypeClass,
    tSCallSignatureDeclarationTypePair,
} from '../commons/tSCallSignatureDeclaration';
import {
    TSConstructSignatureDeclarationTypeClass,
    tSConstructSignatureDeclarationTypePair,
} from '../commons/tSConstructSignatureDeclaration';
import {
    TSPropertySignatureTypeClass,
    tSPropertySignatureTypePair,
} from '../commons/tSPropertySignature';
import {
    TSMethodSignatureTypeClass,
    tSMethodSignatureTypePair,
} from '../commons/tSMethodSignature';
import { TSIndexSignatureTypeClass, tSIndexSignatureTypePair } from '../commons/tSIndexSignature';
import { TSAnyKeywordTypeClass, tSAnyKeywordTypePair } from '../commons/tSAnyKeyword';
import { TSBooleanKeywordTypeClass, tSBooleanKeywordTypePair } from '../commons/tSBooleanKeyword';
import { TSBigIntKeywordTypeClass, tSBigIntKeywordTypePair } from '../commons/tSBigIntKeyword';
import {
    TSIntrinsicKeywordTypeClass,
    tSIntrinsicKeywordTypePair,
} from '../commons/tSIntrinsicKeyword';
import { TSNeverKeywordTypeClass, tSNeverKeywordTypePair } from '../commons/tSNeverKeyword';
import { TSNullKeywordTypeClass, tSNullKeywordTypePair } from '../commons/tSNullKeyword';
import { TSNumberKeywordTypeClass, tSNumberKeywordTypePair } from '../commons/tSNumberKeyword';
import { TSObjectKeywordTypeClass, tSObjectKeywordTypePair } from '../commons/tSObjectKeyword';
import { TSStringKeywordTypeClass, tSStringKeywordTypePair } from '../commons/tSStringKeyword';
import { TSSymbolKeywordTypeClass, tSSymbolKeywordTypePair } from '../commons/tSSymbolKeyword';
import {
    TSUndefinedKeywordTypeClass,
    tSUndefinedKeywordTypePair,
} from '../commons/tSUndefinedKeyword';
import { TSUnknownKeywordTypeClass, tSUnknownKeywordTypePair } from '../commons/tSUnknownKeyword';
import { TSVoidKeywordTypeClass, tSVoidKeywordTypePair } from '../commons/tSVoidKeyword';
import { TSThisTypeTypeClass, tSThisTypeTypePair } from '../commons/tSThisType';
import { TSFunctionTypeTypeClass, tSFunctionTypeTypePair } from '../commons/tSFunctionType';
import {
    TSConstructorTypeTypeClass,
    tSConstructorTypeTypePair,
} from '../commons/tSConstructorType';
import { TSTypeReferenceTypeClass, tSTypeReferenceTypePair } from '../commons/tSTypeReference';
import { TSTypePredicateTypeClass, tSTypePredicateTypePair } from '../commons/tSTypePredicate';
import { TSTypeQueryTypeClass, tSTypeQueryTypePair } from '../commons/tSTypeQuery';
import { TSTypeLiteralTypeClass, tSTypeLiteralTypePair } from '../commons/tSTypeLiteral';
import { TSArrayTypeTypeClass, tSArrayTypeTypePair } from '../commons/tSArrayType';
import { TSTupleTypeTypeClass, tSTupleTypeTypePair } from '../commons/tSTupleType';
import { TSOptionalTypeTypeClass, tSOptionalTypeTypePair } from '../commons/tSOptionalType';
import { TSRestTypeTypeClass, tSRestTypeTypePair } from '../commons/tSRestType';
import {
    TSNamedTupleMemberTypeClass,
    tSNamedTupleMemberTypePair,
} from '../commons/tSNamedTupleMember';
import { TSUnionTypeTypeClass, tSUnionTypeTypePair } from '../commons/tSUnionType';
import {
    TSIntersectionTypeTypeClass,
    tSIntersectionTypeTypePair,
} from '../commons/tSIntersectionType';
import {
    TSConditionalTypeTypeClass,
    tSConditionalTypeTypePair,
} from '../commons/tSConditionalType';
import { TSInferTypeTypeClass, tSInferTypeTypePair } from '../commons/tSInferType';
import {
    TSParenthesizedTypeTypeClass,
    tSParenthesizedTypeTypePair,
} from '../commons/tSParenthesizedType';
import { TSTypeOperatorTypeClass, tSTypeOperatorTypePair } from '../commons/tSTypeOperator';
import {
    TSIndexedAccessTypeTypeClass,
    tSIndexedAccessTypeTypePair,
} from '../commons/tSIndexedAccessType';
import { TSMappedTypeTypeClass, tSMappedTypeTypePair } from '../commons/tSMappedType';
import {
    TSTemplateLiteralTypeTypeClass,
    tSTemplateLiteralTypeTypePair,
} from '../commons/tSTemplateLiteralType';
import { TSLiteralTypeTypeClass, tSLiteralTypeTypePair } from '../commons/tSLiteralType';
import {
    TSClassImplementsTypeClass,
    tSClassImplementsTypePair,
} from '../commons/tSClassImplements';
import {
    TSInterfaceHeritageTypeClass,
    tSInterfaceHeritageTypePair,
} from '../commons/tSInterfaceHeritage';
import {
    TSInterfaceDeclarationTypeClass,
    tSInterfaceDeclarationTypePair,
} from '../commons/tSInterfaceDeclaration';
import { TSInterfaceBodyTypeClass, tSInterfaceBodyTypePair } from './tSInterfaceBody';
import {
    TSTypeAliasDeclarationTypeClass,
    tSTypeAliasDeclarationTypePair,
} from '../commons/tSTypeAliasDeclaration';
import {
    TSInstantiationExpressionTypeClass,
    tSInstantiationExpressionTypePair,
} from '../commons/tSInstantiationExpression';
import { TSAsExpressionTypeClass, tSAsExpressionTypePair } from '../commons/tSAsExpression';
import {
    TSSatisfiesExpressionTypeClass,
    tSSatisfiesExpressionTypePair,
} from '../commons/tSSatisfiesExpression';
import { TSTypeAssertionTypeClass, tSTypeAssertionTypePair } from '../commons/tSTypeAssertion';
import { TSEnumBodyTypeClass, tSEnumBodyTypePair } from './tSEnumBody';
import {
    TSEnumDeclarationTypeClass,
    tSEnumDeclarationTypePair,
} from '../commons/tSEnumDeclaration';
import { TSEnumMemberTypeClass, tSEnumMemberTypePair } from './tSEnumMember';
import {
    TSModuleDeclarationTypeClass,
    tSModuleDeclarationTypePair,
} from '../commons/tSModuleDeclaration';
import { TSModuleBlockTypeClass, tSModuleBlockTypePair } from '../commons/tSModuleBlock';
import { TSImportTypeTypeClass, tSImportTypeTypePair } from '../commons/tSImportType';
import {
    TSImportEqualsDeclarationTypeClass,
    tSImportEqualsDeclarationTypePair,
} from '../commons/tSImportEqualsDeclaration';
import {
    TSExternalModuleReferenceTypeClass,
    tSExternalModuleReferenceTypePair,
} from './tSExternalModuleReference';
import {
    TSNonNullExpressionTypeClass,
    tSNonNullExpressionTypePair,
} from '../commons/tSNonNullExpression';
import {
    TSExportAssignmentTypeClass,
    tSExportAssignmentTypePair,
} from '../commons/tSExportAssignment';
import {
    TSNamespaceExportDeclarationTypeClass,
    tSNamespaceExportDeclarationTypePair,
} from '../commons/tSNamespaceExportDeclaration';
import { TSTypeAnnotationTypeClass, tSTypeAnnotationTypePair } from './tSTypeAnnotation';
import {
    TSTypeParameterInstantiationTypeClass,
    tSTypeParameterInstantiationTypePair,
} from './tSTypeParameterInstantiation';
import {
    TSTypeParameterDeclarationTypeClass,
    tSTypeParameterDeclarationTypePair,
} from './tSTypeParameterDeclaration';
import { TSTypeParameterTypeClass, tSTypeParameterTypePair } from './tSTypeParameter';

export {
    TSParameterPropertyTypeClass,
    tSParameterPropertyTypePair,
    isTSParameterPropertyType,
} from './tSParameterProperty';
export {
    TSDeclareFunctionTypeClass,
    tSDeclareFunctionTypePair,
    isTSDeclareFunctionType,
} from '../commons/tSDeclareFunction';
export {
    TSDeclareMethodTypeClass,
    tSDeclareMethodTypePair,
    isTSDeclareMethodType,
} from './tSDeclareMethod';
export {
    TSQualifiedNameTypeClass,
    tSQualifiedNameTypePair,
    isTSQualifiedNameType,
} from '../commons/tSQualifiedName';
export {
    TSCallSignatureDeclarationTypeClass,
    tSCallSignatureDeclarationTypePair,
    isTSCallSignatureDeclarationType,
} from '../commons/tSCallSignatureDeclaration';
export {
    TSConstructSignatureDeclarationTypeClass,
    tSConstructSignatureDeclarationTypePair,
    isTSConstructSignatureDeclarationType,
} from '../commons/tSConstructSignatureDeclaration';
export {
    TSPropertySignatureTypeClass,
    tSPropertySignatureTypePair,
    isTSPropertySignatureType,
} from '../commons/tSPropertySignature';
export {
    TSMethodSignatureTypeClass,
    tSMethodSignatureTypePair,
    isTSMethodSignatureType,
} from '../commons/tSMethodSignature';
export {
    TSIndexSignatureTypeClass,
    tSIndexSignatureTypePair,
    isTSIndexSignatureType,
} from '../commons/tSIndexSignature';
export {
    TSAnyKeywordTypeClass,
    tSAnyKeywordTypePair,
    isTSAnyKeywordType,
} from '../commons/tSAnyKeyword';
export {
    TSBooleanKeywordTypeClass,
    tSBooleanKeywordTypePair,
    isTSBooleanKeywordType,
} from '../commons/tSBooleanKeyword';
export {
    TSBigIntKeywordTypeClass,
    tSBigIntKeywordTypePair,
    isTSBigIntKeywordType,
} from '../commons/tSBigIntKeyword';
export {
    TSIntrinsicKeywordTypeClass,
    tSIntrinsicKeywordTypePair,
    isTSIntrinsicKeywordType,
} from '../commons/tSIntrinsicKeyword';
export {
    TSNeverKeywordTypeClass,
    tSNeverKeywordTypePair,
    isTSNeverKeywordType,
} from '../commons/tSNeverKeyword';
export {
    TSNullKeywordTypeClass,
    tSNullKeywordTypePair,
    isTSNullKeywordType,
} from '../commons/tSNullKeyword';
export {
    TSNumberKeywordTypeClass,
    tSNumberKeywordTypePair,
    isTSNumberKeywordType,
} from '../commons/tSNumberKeyword';
export {
    TSObjectKeywordTypeClass,
    tSObjectKeywordTypePair,
    isTSObjectKeywordType,
} from '../commons/tSObjectKeyword';
export {
    TSStringKeywordTypeClass,
    tSStringKeywordTypePair,
    isTSStringKeywordType,
} from '../commons/tSStringKeyword';
export {
    TSSymbolKeywordTypeClass,
    tSSymbolKeywordTypePair,
    isTSSymbolKeywordType,
} from '../commons/tSSymbolKeyword';
export {
    TSUndefinedKeywordTypeClass,
    tSUndefinedKeywordTypePair,
    isTSUndefinedKeywordType,
} from '../commons/tSUndefinedKeyword';
export {
    TSUnknownKeywordTypeClass,
    tSUnknownKeywordTypePair,
    isTSUnknownKeywordType,
} from '../commons/tSUnknownKeyword';
export {
    TSVoidKeywordTypeClass,
    tSVoidKeywordTypePair,
    isTSVoidKeywordType,
} from '../commons/tSVoidKeyword';
export { TSThisTypeTypeClass, tSThisTypeTypePair, isTSThisTypeType } from '../commons/tSThisType';
export {
    TSFunctionTypeTypeClass,
    tSFunctionTypeTypePair,
    isTSFunctionTypeType,
} from '../commons/tSFunctionType';
export {
    TSConstructorTypeTypeClass,
    tSConstructorTypeTypePair,
    isTSConstructorTypeType,
} from '../commons/tSConstructorType';
export {
    TSTypeReferenceTypeClass,
    tSTypeReferenceTypePair,
    isTSTypeReferenceType,
} from '../commons/tSTypeReference';
export {
    TSTypePredicateTypeClass,
    tSTypePredicateTypePair,
    isTSTypePredicateType,
} from '../commons/tSTypePredicate';
export {
    TSTypeQueryTypeClass,
    tSTypeQueryTypePair,
    isTSTypeQueryType,
} from '../commons/tSTypeQuery';
export {
    TSTypeLiteralTypeClass,
    tSTypeLiteralTypePair,
    isTSTypeLiteralType,
} from '../commons/tSTypeLiteral';
export {
    TSArrayTypeTypeClass,
    tSArrayTypeTypePair,
    isTSArrayTypeType,
} from '../commons/tSArrayType';
export {
    TSTupleTypeTypeClass,
    tSTupleTypeTypePair,
    isTSTupleTypeType,
} from '../commons/tSTupleType';
export {
    TSOptionalTypeTypeClass,
    tSOptionalTypeTypePair,
    isTSOptionalTypeType,
} from '../commons/tSOptionalType';
export { TSRestTypeTypeClass, tSRestTypeTypePair, isTSRestTypeType } from '../commons/tSRestType';
export {
    TSNamedTupleMemberTypeClass,
    tSNamedTupleMemberTypePair,
    isTSNamedTupleMemberType,
} from '../commons/tSNamedTupleMember';
export {
    TSUnionTypeTypeClass,
    tSUnionTypeTypePair,
    isTSUnionTypeType,
} from '../commons/tSUnionType';
export {
    TSIntersectionTypeTypeClass,
    tSIntersectionTypeTypePair,
    isTSIntersectionTypeType,
} from '../commons/tSIntersectionType';
export {
    TSConditionalTypeTypeClass,
    tSConditionalTypeTypePair,
    isTSConditionalTypeType,
} from '../commons/tSConditionalType';
export {
    TSInferTypeTypeClass,
    tSInferTypeTypePair,
    isTSInferTypeType,
} from '../commons/tSInferType';
export {
    TSParenthesizedTypeTypeClass,
    tSParenthesizedTypeTypePair,
    isTSParenthesizedTypeType,
} from '../commons/tSParenthesizedType';
export {
    TSTypeOperatorTypeClass,
    tSTypeOperatorTypePair,
    isTSTypeOperatorType,
} from '../commons/tSTypeOperator';
export {
    TSIndexedAccessTypeTypeClass,
    tSIndexedAccessTypeTypePair,
    isTSIndexedAccessTypeType,
} from '../commons/tSIndexedAccessType';
export {
    TSMappedTypeTypeClass,
    tSMappedTypeTypePair,
    isTSMappedTypeType,
} from '../commons/tSMappedType';
export {
    TSTemplateLiteralTypeTypeClass,
    tSTemplateLiteralTypeTypePair,
    isTSTemplateLiteralTypeType,
} from '../commons/tSTemplateLiteralType';
export {
    TSLiteralTypeTypeClass,
    tSLiteralTypeTypePair,
    isTSLiteralTypeType,
} from '../commons/tSLiteralType';
export {
    TSClassImplementsTypeClass,
    tSClassImplementsTypePair,
    isTSClassImplementsType,
} from '../commons/tSClassImplements';
export {
    TSInterfaceHeritageTypeClass,
    tSInterfaceHeritageTypePair,
    isTSInterfaceHeritageType,
} from '../commons/tSInterfaceHeritage';
export {
    TSInterfaceDeclarationTypeClass,
    tSInterfaceDeclarationTypePair,
    isTSInterfaceDeclarationType,
} from '../commons/tSInterfaceDeclaration';
export {
    TSInterfaceBodyTypeClass,
    tSInterfaceBodyTypePair,
    isTSInterfaceBodyType,
} from './tSInterfaceBody';
export {
    TSTypeAliasDeclarationTypeClass,
    tSTypeAliasDeclarationTypePair,
    isTSTypeAliasDeclarationType,
} from '../commons/tSTypeAliasDeclaration';
export {
    TSInstantiationExpressionTypeClass,
    tSInstantiationExpressionTypePair,
    isTSInstantiationExpressionType,
} from '../commons/tSInstantiationExpression';
export {
    TSAsExpressionTypeClass,
    tSAsExpressionTypePair,
    isTSAsExpressionType,
} from '../commons/tSAsExpression';
export {
    TSSatisfiesExpressionTypeClass,
    tSSatisfiesExpressionTypePair,
    isTSSatisfiesExpressionType,
} from '../commons/tSSatisfiesExpression';
export {
    TSTypeAssertionTypeClass,
    tSTypeAssertionTypePair,
    isTSTypeAssertionType,
} from '../commons/tSTypeAssertion';
export { TSEnumBodyTypeClass, tSEnumBodyTypePair, isTSEnumBodyType } from './tSEnumBody';
export {
    TSEnumDeclarationTypeClass,
    tSEnumDeclarationTypePair,
    isTSEnumDeclarationType,
} from '../commons/tSEnumDeclaration';
export { TSEnumMemberTypeClass, tSEnumMemberTypePair, isTSEnumMemberType } from './tSEnumMember';
export {
    TSModuleDeclarationTypeClass,
    tSModuleDeclarationTypePair,
    isTSModuleDeclarationType,
} from '../commons/tSModuleDeclaration';
export {
    TSModuleBlockTypeClass,
    tSModuleBlockTypePair,
    isTSModuleBlockType,
} from '../commons/tSModuleBlock';
export {
    TSImportTypeTypeClass,
    tSImportTypeTypePair,
    isTSImportTypeType,
} from '../commons/tSImportType';
export {
    TSImportEqualsDeclarationTypeClass,
    tSImportEqualsDeclarationTypePair,
    isTSImportEqualsDeclarationType,
} from '../commons/tSImportEqualsDeclaration';
export {
    TSExternalModuleReferenceTypeClass,
    tSExternalModuleReferenceTypePair,
    isTSExternalModuleReferenceType,
} from './tSExternalModuleReference';
export {
    TSNonNullExpressionTypeClass,
    tSNonNullExpressionTypePair,
    isTSNonNullExpressionType,
} from '../commons/tSNonNullExpression';
export {
    TSExportAssignmentTypeClass,
    tSExportAssignmentTypePair,
    isTSExportAssignmentType,
} from '../commons/tSExportAssignment';
export {
    TSNamespaceExportDeclarationTypeClass,
    tSNamespaceExportDeclarationTypePair,
    isTSNamespaceExportDeclarationType,
} from '../commons/tSNamespaceExportDeclaration';
export {
    TSTypeAnnotationTypeClass,
    tSTypeAnnotationTypePair,
    isTSTypeAnnotationType,
} from './tSTypeAnnotation';
export {
    TSTypeParameterInstantiationTypeClass,
    tSTypeParameterInstantiationTypePair,
    isTSTypeParameterInstantiationType,
} from './tSTypeParameterInstantiation';
export {
    TSTypeParameterDeclarationTypeClass,
    tSTypeParameterDeclarationTypePair,
    isTSTypeParameterDeclarationType,
} from './tSTypeParameterDeclaration';
export {
    TSTypeParameterTypeClass,
    tSTypeParameterTypePair,
    isTSTypeParameterType,
} from './tSTypeParameter';

export const typeScriptVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            tSParameterPropertyTypePair,
            tSDeclareFunctionTypePair,
            tSDeclareMethodTypePair,
            tSQualifiedNameTypePair,
            tSCallSignatureDeclarationTypePair,
            tSConstructSignatureDeclarationTypePair,
            tSPropertySignatureTypePair,
            tSMethodSignatureTypePair,
            tSIndexSignatureTypePair,
            tSAnyKeywordTypePair,
            tSBooleanKeywordTypePair,
            tSBigIntKeywordTypePair,
            tSIntrinsicKeywordTypePair,
            tSNeverKeywordTypePair,
            tSNullKeywordTypePair,
            tSNumberKeywordTypePair,
            tSObjectKeywordTypePair,
            tSStringKeywordTypePair,
            tSSymbolKeywordTypePair,
            tSUndefinedKeywordTypePair,
            tSUnknownKeywordTypePair,
            tSVoidKeywordTypePair,
            tSThisTypeTypePair,
            tSFunctionTypeTypePair,
            tSConstructorTypeTypePair,
            tSTypeReferenceTypePair,
            tSTypePredicateTypePair,
            tSTypeQueryTypePair,
            tSTypeLiteralTypePair,
            tSArrayTypeTypePair,
            tSTupleTypeTypePair,
            tSOptionalTypeTypePair,
            tSRestTypeTypePair,
            tSNamedTupleMemberTypePair,
            tSUnionTypeTypePair,
            tSIntersectionTypeTypePair,
            tSConditionalTypeTypePair,
            tSInferTypeTypePair,
            tSParenthesizedTypeTypePair,
            tSTypeOperatorTypePair,
            tSIndexedAccessTypeTypePair,
            tSMappedTypeTypePair,
            tSTemplateLiteralTypeTypePair,
            tSLiteralTypeTypePair,
            tSClassImplementsTypePair,
            tSInterfaceHeritageTypePair,
            tSInterfaceDeclarationTypePair,
            tSInterfaceBodyTypePair,
            tSTypeAliasDeclarationTypePair,
            tSInstantiationExpressionTypePair,
            tSAsExpressionTypePair,
            tSSatisfiesExpressionTypePair,
            tSTypeAssertionTypePair,
            tSEnumBodyTypePair,
            tSEnumDeclarationTypePair,
            tSEnumMemberTypePair,
            tSModuleDeclarationTypePair,
            tSModuleBlockTypePair,
            tSImportTypeTypePair,
            tSImportEqualsDeclarationTypePair,
            tSExternalModuleReferenceTypePair,
            tSNonNullExpressionTypePair,
            tSExportAssignmentTypePair,
            tSNamespaceExportDeclarationTypePair,
            tSTypeAnnotationTypePair,
            tSTypeParameterInstantiationTypePair,
            tSTypeParameterDeclarationTypePair,
            tSTypeParameterTypePair,
        ] as const,
);

export class TypeScriptVisitor extends LwcCommonVisitor<
    ReturnType<typeof typeScriptVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return typeScriptVisitorEvaluatePairs();
    }
}

export type TypeScriptTypeClass =
    | TSParameterPropertyTypeClass
    | TSDeclareFunctionTypeClass
    | TSDeclareMethodTypeClass
    | TSQualifiedNameTypeClass
    | TSCallSignatureDeclarationTypeClass
    | TSConstructSignatureDeclarationTypeClass
    | TSPropertySignatureTypeClass
    | TSMethodSignatureTypeClass
    | TSIndexSignatureTypeClass
    | TSAnyKeywordTypeClass
    | TSBooleanKeywordTypeClass
    | TSBigIntKeywordTypeClass
    | TSIntrinsicKeywordTypeClass
    | TSNeverKeywordTypeClass
    | TSNullKeywordTypeClass
    | TSNumberKeywordTypeClass
    | TSObjectKeywordTypeClass
    | TSStringKeywordTypeClass
    | TSSymbolKeywordTypeClass
    | TSUndefinedKeywordTypeClass
    | TSUnknownKeywordTypeClass
    | TSVoidKeywordTypeClass
    | TSThisTypeTypeClass
    | TSFunctionTypeTypeClass
    | TSConstructorTypeTypeClass
    | TSTypeReferenceTypeClass
    | TSTypePredicateTypeClass
    | TSTypeQueryTypeClass
    | TSTypeLiteralTypeClass
    | TSArrayTypeTypeClass
    | TSTupleTypeTypeClass
    | TSOptionalTypeTypeClass
    | TSRestTypeTypeClass
    | TSNamedTupleMemberTypeClass
    | TSUnionTypeTypeClass
    | TSIntersectionTypeTypeClass
    | TSConditionalTypeTypeClass
    | TSInferTypeTypeClass
    | TSParenthesizedTypeTypeClass
    | TSTypeOperatorTypeClass
    | TSIndexedAccessTypeTypeClass
    | TSMappedTypeTypeClass
    | TSTemplateLiteralTypeTypeClass
    | TSLiteralTypeTypeClass
    | TSClassImplementsTypeClass
    | TSInterfaceHeritageTypeClass
    | TSInterfaceDeclarationTypeClass
    | TSInterfaceBodyTypeClass
    | TSTypeAliasDeclarationTypeClass
    | TSInstantiationExpressionTypeClass
    | TSAsExpressionTypeClass
    | TSSatisfiesExpressionTypeClass
    | TSTypeAssertionTypeClass
    | TSEnumBodyTypeClass
    | TSEnumDeclarationTypeClass
    | TSEnumMemberTypeClass
    | TSModuleDeclarationTypeClass
    | TSModuleBlockTypeClass
    | TSImportTypeTypeClass
    | TSImportEqualsDeclarationTypeClass
    | TSExternalModuleReferenceTypeClass
    | TSNonNullExpressionTypeClass
    | TSExportAssignmentTypeClass
    | TSNamespaceExportDeclarationTypeClass
    | TSTypeAnnotationTypeClass
    | TSTypeParameterInstantiationTypeClass
    | TSTypeParameterDeclarationTypeClass
    | TSTypeParameterTypeClass;

export const isTypeScriptType = (
    target: LwcCommonTypeClass<string>,
): target is TypeScriptTypeClass => {
    return (
        target instanceof TSParameterPropertyTypeClass ||
        target instanceof TSDeclareFunctionTypeClass ||
        target instanceof TSDeclareMethodTypeClass ||
        target instanceof TSQualifiedNameTypeClass ||
        target instanceof TSCallSignatureDeclarationTypeClass ||
        target instanceof TSConstructSignatureDeclarationTypeClass ||
        target instanceof TSPropertySignatureTypeClass ||
        target instanceof TSMethodSignatureTypeClass ||
        target instanceof TSIndexSignatureTypeClass ||
        target instanceof TSAnyKeywordTypeClass ||
        target instanceof TSBooleanKeywordTypeClass ||
        target instanceof TSBigIntKeywordTypeClass ||
        target instanceof TSIntrinsicKeywordTypeClass ||
        target instanceof TSNeverKeywordTypeClass ||
        target instanceof TSNullKeywordTypeClass ||
        target instanceof TSNumberKeywordTypeClass ||
        target instanceof TSObjectKeywordTypeClass ||
        target instanceof TSStringKeywordTypeClass ||
        target instanceof TSSymbolKeywordTypeClass ||
        target instanceof TSUndefinedKeywordTypeClass ||
        target instanceof TSUnknownKeywordTypeClass ||
        target instanceof TSVoidKeywordTypeClass ||
        target instanceof TSThisTypeTypeClass ||
        target instanceof TSFunctionTypeTypeClass ||
        target instanceof TSConstructorTypeTypeClass ||
        target instanceof TSTypeReferenceTypeClass ||
        target instanceof TSTypePredicateTypeClass ||
        target instanceof TSTypeQueryTypeClass ||
        target instanceof TSTypeLiteralTypeClass ||
        target instanceof TSArrayTypeTypeClass ||
        target instanceof TSTupleTypeTypeClass ||
        target instanceof TSOptionalTypeTypeClass ||
        target instanceof TSRestTypeTypeClass ||
        target instanceof TSNamedTupleMemberTypeClass ||
        target instanceof TSUnionTypeTypeClass ||
        target instanceof TSIntersectionTypeTypeClass ||
        target instanceof TSConditionalTypeTypeClass ||
        target instanceof TSInferTypeTypeClass ||
        target instanceof TSParenthesizedTypeTypeClass ||
        target instanceof TSTypeOperatorTypeClass ||
        target instanceof TSIndexedAccessTypeTypeClass ||
        target instanceof TSMappedTypeTypeClass ||
        target instanceof TSTemplateLiteralTypeTypeClass ||
        target instanceof TSLiteralTypeTypeClass ||
        target instanceof TSClassImplementsTypeClass ||
        target instanceof TSInterfaceHeritageTypeClass ||
        target instanceof TSInterfaceDeclarationTypeClass ||
        target instanceof TSInterfaceBodyTypeClass ||
        target instanceof TSTypeAliasDeclarationTypeClass ||
        target instanceof TSInstantiationExpressionTypeClass ||
        target instanceof TSAsExpressionTypeClass ||
        target instanceof TSSatisfiesExpressionTypeClass ||
        target instanceof TSTypeAssertionTypeClass ||
        target instanceof TSEnumBodyTypeClass ||
        target instanceof TSEnumDeclarationTypeClass ||
        target instanceof TSEnumMemberTypeClass ||
        target instanceof TSModuleDeclarationTypeClass ||
        target instanceof TSModuleBlockTypeClass ||
        target instanceof TSImportTypeTypeClass ||
        target instanceof TSImportEqualsDeclarationTypeClass ||
        target instanceof TSExternalModuleReferenceTypeClass ||
        target instanceof TSNonNullExpressionTypeClass ||
        target instanceof TSExportAssignmentTypeClass ||
        target instanceof TSNamespaceExportDeclarationTypeClass ||
        target instanceof TSTypeAnnotationTypeClass ||
        target instanceof TSTypeParameterInstantiationTypeClass ||
        target instanceof TSTypeParameterDeclarationTypeClass ||
        target instanceof TSTypeParameterTypeClass
    );
};
