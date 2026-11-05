import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { TypeNameType } from './name';

export type ArraySubscriptsType = CommonType<'arraySubscripts'> & {
    value: number | null;
};

export const isArraySubscriptsType = (value: unknown): value is ArraySubscriptsType => {
    return isCommonType(value) && value.type === 'arraySubscripts';
};

export type TypeRefType = CommonType<'typeRef'> & {
    value: ValueRuleValue<TypeNameType>[];
    dimension: ValueRuleValue<ArraySubscriptsType>;
};

export const isTypeRefType = (value: unknown): value is TypeRefType => {
    return isCommonType(value) && value.type === 'typeRef';
};
