import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import {
    AnyTypeAnnotationTypeClass,
    anyTypeAnnotationTypePair,
} from '../commons/anyTypeAnnotation';
import {
    BooleanTypeAnnotationTypeClass,
    booleanTypeAnnotationTypePair,
} from '../commons/booleanTypeAnnotation';
import {
    NullLiteralTypeAnnotationTypeClass,
    nullLiteralTypeAnnotationTypePair,
} from '../commons/nullLiteralTypeAnnotation';
import {
    MixedTypeAnnotationTypeClass,
    mixedTypeAnnotationTypePair,
} from '../commons/mixedTypeAnnotation';
import {
    EmptyTypeAnnotationTypeClass,
    emptyTypeAnnotationTypePair,
} from '../commons/emptyTypeAnnotation';
import {
    NumberTypeAnnotationTypeClass,
    numberTypeAnnotationTypePair,
} from '../commons/numberTypeAnnotation';
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
    VoidTypeAnnotationTypeClass,
    voidTypeAnnotationTypePair,
} from '../commons/voidTypeAnnotation';

export {
    AnyTypeAnnotationTypeClass,
    anyTypeAnnotationTypePair,
    isAnyTypeAnnotationType,
} from '../commons/anyTypeAnnotation';
export {
    BooleanTypeAnnotationTypeClass,
    booleanTypeAnnotationTypePair,
    isBooleanTypeAnnotationType,
} from '../commons/booleanTypeAnnotation';
export {
    NullLiteralTypeAnnotationTypeClass,
    nullLiteralTypeAnnotationTypePair,
    isNullLiteralTypeAnnotationType,
} from '../commons/nullLiteralTypeAnnotation';
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
    NumberTypeAnnotationTypeClass,
    numberTypeAnnotationTypePair,
    isNumberTypeAnnotationType,
} from '../commons/numberTypeAnnotation';
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
    VoidTypeAnnotationTypeClass,
    voidTypeAnnotationTypePair,
    isVoidTypeAnnotationType,
} from '../commons/voidTypeAnnotation';

export const flowBaseAnnotationVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            anyTypeAnnotationTypePair,
            booleanTypeAnnotationTypePair,
            nullLiteralTypeAnnotationTypePair,
            mixedTypeAnnotationTypePair,
            emptyTypeAnnotationTypePair,
            numberTypeAnnotationTypePair,
            stringTypeAnnotationTypePair,
            symbolTypeAnnotationTypePair,
            thisTypeAnnotationTypePair,
            voidTypeAnnotationTypePair,
        ] as const,
);

export class FlowBaseAnnotationVisitor extends LwcCommonVisitor<
    ReturnType<typeof flowBaseAnnotationVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return flowBaseAnnotationVisitorEvaluatePairs();
    }
}

export type FlowBaseAnnotationTypeClass =
    | AnyTypeAnnotationTypeClass
    | BooleanTypeAnnotationTypeClass
    | NullLiteralTypeAnnotationTypeClass
    | MixedTypeAnnotationTypeClass
    | EmptyTypeAnnotationTypeClass
    | NumberTypeAnnotationTypeClass
    | StringTypeAnnotationTypeClass
    | SymbolTypeAnnotationTypeClass
    | ThisTypeAnnotationTypeClass
    | VoidTypeAnnotationTypeClass;

export const isFlowBaseAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is FlowBaseAnnotationTypeClass => {
    return (
        target instanceof AnyTypeAnnotationTypeClass ||
        target instanceof BooleanTypeAnnotationTypeClass ||
        target instanceof NullLiteralTypeAnnotationTypeClass ||
        target instanceof MixedTypeAnnotationTypeClass ||
        target instanceof EmptyTypeAnnotationTypeClass ||
        target instanceof NumberTypeAnnotationTypeClass ||
        target instanceof StringTypeAnnotationTypeClass ||
        target instanceof SymbolTypeAnnotationTypeClass ||
        target instanceof ThisTypeAnnotationTypeClass ||
        target instanceof VoidTypeAnnotationTypeClass
    );
};
