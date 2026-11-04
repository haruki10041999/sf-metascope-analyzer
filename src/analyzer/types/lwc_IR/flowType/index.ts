import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
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
import {
    ExistsTypeAnnotationTypeClass,
    existsTypeAnnotationTypePair,
} from '../commons/existsTypeAnnotation';
import {
    FunctionTypeAnnotationTypeClass,
    functionTypeAnnotationTypePair,
} from '../commons/functionTypeAnnotation';
import {
    GenericTypeAnnotationTypeClass,
    genericTypeAnnotationTypePair,
} from '../commons/genericTypeAnnotation';
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
import {
    UnionTypeAnnotationTypeClass,
    unionTypeAnnotationTypePair,
} from '../commons/unionTypeAnnotation';
import {
    VoidTypeAnnotationTypeClass,
    voidTypeAnnotationTypePair,
} from '../commons/voidTypeAnnotation';
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
    GenericTypeAnnotationTypeClass,
    genericTypeAnnotationTypePair,
    isGenericTypeAnnotationType,
} from '../commons/genericTypeAnnotation';
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
export {
    UnionTypeAnnotationTypeClass,
    unionTypeAnnotationTypePair,
    isUnionTypeAnnotationType,
} from '../commons/unionTypeAnnotation';
export {
    VoidTypeAnnotationTypeClass,
    voidTypeAnnotationTypePair,
    isVoidTypeAnnotationType,
} from '../commons/voidTypeAnnotation';
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

const flowTypeVisitorEvaluatePairs = [
    anyTypeAnnotationTypePair,
    arrayTypeAnnotationTypePair,
    booleanTypeAnnotationTypePair,
    booleanLiteralTypeAnnotationTypePair,
    nullLiteralTypeAnnotationTypePair,
    existsTypeAnnotationTypePair,
    functionTypeAnnotationTypePair,
    genericTypeAnnotationTypePair,
    interfaceTypeAnnotationTypePair,
    intersectionTypeAnnotationTypePair,
    mixedTypeAnnotationTypePair,
    emptyTypeAnnotationTypePair,
    nullableTypeAnnotationTypePair,
    numberLiteralTypeAnnotationTypePair,
    bigIntLiteralTypeAnnotationTypePair,
    numberTypeAnnotationTypePair,
    objectTypeAnnotationTypePair,
    stringLiteralTypeAnnotationTypePair,
    stringTypeAnnotationTypePair,
    symbolTypeAnnotationTypePair,
    thisTypeAnnotationTypePair,
    tupleTypeAnnotationTypePair,
    typeofTypeAnnotationTypePair,
    unionTypeAnnotationTypePair,
    voidTypeAnnotationTypePair,
    indexedAccessTypeTypePair,
    optionalIndexedAccessTypeTypePair,
] as const;

export class FlowTypeVisitor extends LwcCommonVisitor<
    (typeof flowTypeVisitorEvaluatePairs)[number]
> {
    readonly evaluatePair = flowTypeVisitorEvaluatePairs;
}

export type FlowTypeTypeClass =
    | AnyTypeAnnotationTypeClass
    | ArrayTypeAnnotationTypeClass
    | BooleanTypeAnnotationTypeClass
    | BooleanLiteralTypeAnnotationTypeClass
    | NullLiteralTypeAnnotationTypeClass
    | ExistsTypeAnnotationTypeClass
    | FunctionTypeAnnotationTypeClass
    | GenericTypeAnnotationTypeClass
    | InterfaceTypeAnnotationTypeClass
    | IntersectionTypeAnnotationTypeClass
    | MixedTypeAnnotationTypeClass
    | EmptyTypeAnnotationTypeClass
    | NullableTypeAnnotationTypeClass
    | NumberLiteralTypeAnnotationTypeClass
    | BigIntLiteralTypeAnnotationTypeClass
    | NumberTypeAnnotationTypeClass
    | ObjectTypeAnnotationTypeClass
    | StringLiteralTypeAnnotationTypeClass
    | StringTypeAnnotationTypeClass
    | SymbolTypeAnnotationTypeClass
    | ThisTypeAnnotationTypeClass
    | TupleTypeAnnotationTypeClass
    | TypeofTypeAnnotationTypeClass
    | UnionTypeAnnotationTypeClass
    | VoidTypeAnnotationTypeClass
    | IndexedAccessTypeTypeClass
    | OptionalIndexedAccessTypeTypeClass;

export const isFlowTypeType = (target: LwcCommonTypeClass<string>): target is FlowTypeTypeClass => {
    return (
        target instanceof AnyTypeAnnotationTypeClass ||
        target instanceof ArrayTypeAnnotationTypeClass ||
        target instanceof BooleanTypeAnnotationTypeClass ||
        target instanceof BooleanLiteralTypeAnnotationTypeClass ||
        target instanceof NullLiteralTypeAnnotationTypeClass ||
        target instanceof ExistsTypeAnnotationTypeClass ||
        target instanceof FunctionTypeAnnotationTypeClass ||
        target instanceof GenericTypeAnnotationTypeClass ||
        target instanceof InterfaceTypeAnnotationTypeClass ||
        target instanceof IntersectionTypeAnnotationTypeClass ||
        target instanceof MixedTypeAnnotationTypeClass ||
        target instanceof EmptyTypeAnnotationTypeClass ||
        target instanceof NullableTypeAnnotationTypeClass ||
        target instanceof NumberLiteralTypeAnnotationTypeClass ||
        target instanceof BigIntLiteralTypeAnnotationTypeClass ||
        target instanceof NumberTypeAnnotationTypeClass ||
        target instanceof ObjectTypeAnnotationTypeClass ||
        target instanceof StringLiteralTypeAnnotationTypeClass ||
        target instanceof StringTypeAnnotationTypeClass ||
        target instanceof SymbolTypeAnnotationTypeClass ||
        target instanceof ThisTypeAnnotationTypeClass ||
        target instanceof TupleTypeAnnotationTypeClass ||
        target instanceof TypeofTypeAnnotationTypeClass ||
        target instanceof UnionTypeAnnotationTypeClass ||
        target instanceof VoidTypeAnnotationTypeClass ||
        target instanceof IndexedAccessTypeTypeClass ||
        target instanceof OptionalIndexedAccessTypeTypeClass
    );
};
