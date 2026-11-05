import { ArgumentsType } from './arguments';

import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { BaseExpressionType } from './expression';
import { CreatedNameType } from './name';
import { MapCreatorRestPairType } from './pair';
import { ArrayInitializerType } from './variable';

export type ArrayCreatorRestType = CommonType<'arrayCreatorRest'> & {
    value: ValueRuleValue<ArrayInitializerType | null>;
    size: ValueRuleValue<BaseExpressionType | null>;
};

export const isArrayCreatorRestType = (value: unknown): value is ArrayCreatorRestType => {
    return isCommonType(value) && value.type === 'arrayCreatorRest';
};

export type ClassCreatorRestType = CommonType<'classCreatorRest'> & {
    value: ValueRuleValue<ArgumentsType>;
};

export const isClassCreatorRestType = (value: unknown): value is ClassCreatorRestType => {
    return isCommonType(value) && value.type === 'classCreatorRest';
};

export type MapCreatorRestType = CommonType<'mapCreatorRest'> & {
    value: ValueRuleValue<MapCreatorRestPairType>[];
};

export const isMapCreatorRestType = (value: unknown): value is MapCreatorRestType => {
    return isCommonType(value) && value.type === 'mapCreatorRest';
};

export type NoRestType = CommonType<'noRest'> & {
    value: string;
};

export const isNoRestType = (value: unknown): value is NoRestType => {
    return isCommonType(value) && value.type === 'noRest';
};

export type SetCreatorRestType = CommonType<'setCreatorRest'> & {
    value: ValueRuleValue<BaseExpressionType>[];
};

export const isSetCreatorRestType = (value: unknown): value is SetCreatorRestType => {
    return isCommonType(value) && value.type === 'setCreatorRest';
};

export type CreatorType = CommonType<'creator'> & {
    value: ValueRuleValue<CreatedNameType>;
    rest: ValueRuleValue<
        | ArrayCreatorRestType
        | ClassCreatorRestType
        | MapCreatorRestType
        | NoRestType
        | SetCreatorRestType
    >;
};

export const isCreatorType = (value: unknown): value is CreatorType => {
    return isCommonType(value) && value.type === 'creator';
};
