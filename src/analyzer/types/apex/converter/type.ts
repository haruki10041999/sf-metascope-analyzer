import {
    ArraySubscriptsTypeClass,
    TypeRefTypeClass,
    isArraySubscriptsType as isArraySubscriptsTypeClass,
    isTypeRefType as isTypeRefTypeClass,
} from '../../apex_IR';

import {
    isCommonType,
    ErrorType,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    assignMultiClass,
    makeErrorAssignRule,
    isTargetTypeClass,
    makeSourceInfo,
    makeNumberAssignRule,
    makeNullAssignRule,
} from './commons';
import { makeTypeNameAssignRule, TypeNameType } from './name';

export type ArraySubscriptsType = CommonType<'arraySubscripts'> & {
    value: number | null;
};

export const isArraySubscriptsType = (value: unknown): value is ArraySubscriptsType => {
    return isCommonType(value) && value.type === 'arraySubscripts';
};

export const makeArraySubscriptsAssignRule: AssignForValueRule<
    ArraySubscriptsTypeClass,
    ArraySubscriptsType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isArraySubscriptsTypeClass),
    construct: (typeTypeClass: ArraySubscriptsTypeClass) => {
        return {
            type: typeTypeClass.getType(),
            sourceInfo: makeSourceInfo(typeTypeClass),
            value: typeTypeClass.getValue(),
        };
    },
};

export type TypeRefType = CommonType<'typeRef'> & {
    value: ValueRuleValue<TypeNameType>[];
    dimension: ValueRuleValue<ArraySubscriptsType>;
};

export const isTypeRefType = (value: unknown): value is TypeRefType => {
    return isCommonType(value) && value.type === 'typeRef';
};

export const makeTypeRefAssignRule: AssignForValueRule<TypeRefTypeClass, TypeRefType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isTypeRefTypeClass),
    construct: (typeTypeClass: TypeRefTypeClass) => {
        const value = typeTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeTypeNameAssignRule, makeErrorAssignRule]));
        const dimension = assignMultiClass(typeTypeClass.getDimension(), [
            makeArraySubscriptsAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: typeTypeClass.getType(),
            sourceInfo: makeSourceInfo(typeTypeClass),
            value,
            dimension,
        };
    },
};
