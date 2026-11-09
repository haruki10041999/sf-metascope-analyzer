import { type TypeField } from '../../commons/ir';
import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
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
import { TSImportTypeTypeClass, tSImportTypeTypePair } from '../commons/tSImportType';

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
    TSImportTypeTypeClass,
    tSImportTypeTypePair,
    isTSImportTypeType,
} from '../commons/tSImportType';

/**
 * 型の位置 (型注釈・型引数・制約・union の要素など) に書ける型。
 * 決まった位置にしか出てこない型は含めない (下の別の pair・型を使う)。
 * - TSTypePredicate: 関数の戻り値の型注釈だけ (TSReturnTypeTypeClass)
 * - TSOptionalType・TSRestType・TSNamedTupleMember: タプルの要素だけ (TSTupleElementTypeClass)
 * - TSClassImplements・TSInterfaceHeritage: implements・extends だけ (それぞれのノードの pair を使う)
 */
export const tSTypeVisitorEvaluatePairs = lazyPairs(
    () =>
        [
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
            tSTypeQueryTypePair,
            tSTypeLiteralTypePair,
            tSArrayTypeTypePair,
            tSTupleTypeTypePair,
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
            tSImportTypeTypePair,
        ] as const,
);

export class TSTypeVisitor extends LwcCommonVisitor<
    ReturnType<typeof tSTypeVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return tSTypeVisitorEvaluatePairs();
    }
}

export type TSTypeTypeClass =
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
    | TSTypeQueryTypeClass
    | TSTypeLiteralTypeClass
    | TSArrayTypeTypeClass
    | TSTupleTypeTypeClass
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
    | TSImportTypeTypeClass;

export const isTSTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSTypeTypeClass => {
    return (
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
        target instanceof TSTypeQueryTypeClass ||
        target instanceof TSTypeLiteralTypeClass ||
        target instanceof TSArrayTypeTypeClass ||
        target instanceof TSTupleTypeTypeClass ||
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
        target instanceof TSImportTypeTypeClass
    );
};

/** 戻り値の型注釈に書ける型 (`(x): x is T`・`asserts x` を含む) */
export const tSReturnTypeVisitorEvaluatePairs = lazyPairs(
    () => [...tSTypeVisitorEvaluatePairs(), tSTypePredicateTypePair] as const,
);

export type TSReturnTypeTypeClass = TSTypeTypeClass | TSTypePredicateTypeClass;

export const isTSReturnTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSReturnTypeTypeClass =>
    isTSTypeType(target) || target instanceof TSTypePredicateTypeClass;

/** タプルの要素に書ける型 (`[a?: T, ...rest: U[]]` の `a?: T`・`...rest: U[]` など) */
export const tSTupleElementVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            ...tSTypeVisitorEvaluatePairs(),
            tSOptionalTypeTypePair,
            tSRestTypeTypePair,
            tSNamedTupleMemberTypePair,
        ] as const,
);

export type TSTupleElementTypeClass =
    TSTypeTypeClass | TSOptionalTypeTypeClass | TSRestTypeTypeClass | TSNamedTupleMemberTypeClass;

export const isTSTupleElementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSTupleElementTypeClass =>
    isTSTypeType(target) ||
    target instanceof TSOptionalTypeTypeClass ||
    target instanceof TSRestTypeTypeClass ||
    target instanceof TSNamedTupleMemberTypeClass;
