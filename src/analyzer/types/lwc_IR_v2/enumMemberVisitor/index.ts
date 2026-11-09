import { type TypeField } from '../../commons/ir';
import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
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

export const enumMemberVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            enumBooleanMemberTypePair,
            enumNumberMemberTypePair,
            enumStringMemberTypePair,
            enumDefaultedMemberTypePair,
        ] as const,
);

export class EnumMemberVisitor extends LwcCommonVisitor<
    ReturnType<typeof enumMemberVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return enumMemberVisitorEvaluatePairs();
    }
}

export type EnumMemberTypeClass =
    | EnumBooleanMemberTypeClass
    | EnumNumberMemberTypeClass
    | EnumStringMemberTypeClass
    | EnumDefaultedMemberTypeClass;

export const isEnumMemberType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is EnumMemberTypeClass => {
    return (
        target instanceof EnumBooleanMemberTypeClass ||
        target instanceof EnumNumberMemberTypeClass ||
        target instanceof EnumStringMemberTypeClass ||
        target instanceof EnumDefaultedMemberTypeClass
    );
};
