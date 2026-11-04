import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
import { EnumBooleanBodyTypeClass, enumBooleanBodyTypePair } from '../commons/enumBooleanBody';
import { EnumNumberBodyTypeClass, enumNumberBodyTypePair } from '../commons/enumNumberBody';
import { EnumStringBodyTypeClass, enumStringBodyTypePair } from '../commons/enumStringBody';
import { EnumSymbolBodyTypeClass, enumSymbolBodyTypePair } from '../commons/enumSymbolBody';

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

const enumBodyVisitorEvaluatePairs = [
    enumBooleanBodyTypePair,
    enumNumberBodyTypePair,
    enumStringBodyTypePair,
    enumSymbolBodyTypePair,
] as const;

export class EnumBodyVisitor extends LwcCommonVisitor<
    (typeof enumBodyVisitorEvaluatePairs)[number]
> {
    readonly evaluatePair = enumBodyVisitorEvaluatePairs;
}

export type EnumBodyTypeClass =
    | EnumBooleanBodyTypeClass
    | EnumNumberBodyTypeClass
    | EnumStringBodyTypeClass
    | EnumSymbolBodyTypeClass;

export const isEnumBodyType = (target: LwcCommonTypeClass<string>): target is EnumBodyTypeClass => {
    return (
        target instanceof EnumBooleanBodyTypeClass ||
        target instanceof EnumNumberBodyTypeClass ||
        target instanceof EnumStringBodyTypeClass ||
        target instanceof EnumSymbolBodyTypeClass
    );
};
