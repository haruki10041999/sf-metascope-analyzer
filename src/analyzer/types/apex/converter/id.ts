import {
    AnyIdTypeClass,
    IdListTypeClass,
    IdTypeClass,
    IdValueTypeClass,
    NormalIdTypeClass,
    SoqlIdTypeClass,
    SoslIdTypeClass,
    isAnyIdType as isAnyIdTypeClass,
    isNormalIdType,
    isSoqlIdType as isSoqlIdTypeClass,
    isSoslIdType as isSoslIdTypeClass,
} from '../../apex_IR';

import {
    isCommonType,
    ErrorType,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    assignMultiClass,
    isTargetTypeClass,
    makeErrorAssignRule,
    makeSourceInfo,
} from './commons';

export type AnyIdType = CommonType<'anyId'> & {
    value: string;
};

export const isAnyIdType = (value: unknown): value is AnyIdType => {
    return isCommonType(value) && value.type === 'anyId';
};

export const makeAnyIdAssignRule: AssignForValueRule<AnyIdTypeClass, AnyIdType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isAnyIdTypeClass),
    construct: (idTypeClass: AnyIdTypeClass) => {
        return {
            type: idTypeClass.getType(),
            sourceInfo: makeSourceInfo(idTypeClass),
            value: idTypeClass.getValue(),
        };
    },
};

export type IdType = CommonType<'id'> & {
    value: string;
};

export const isIdType = (value: unknown): value is IdType => {
    return isCommonType(value) && value.type === 'id';
};

export const makeIdAssignRule: AssignForValueRule<NormalIdTypeClass, IdType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isNormalIdType),
    construct: (idTypeClass: NormalIdTypeClass) => {
        return {
            type: idTypeClass.getType(),
            sourceInfo: makeSourceInfo(idTypeClass),
            value: idTypeClass.getValue(),
        };
    },
};

export type SoqlIdType = CommonType<'soqlId'> & {
    value: ValueRuleValue<IdType>;
};

export const isSoqlIdType = (value: unknown): value is SoqlIdType => {
    return isCommonType(value) && value.type === 'soqlId';
};

export const makeSoqlIdAssignRule: AssignForValueRule<SoqlIdTypeClass, SoqlIdType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isSoqlIdTypeClass),
    construct: (idTypeClass: SoqlIdTypeClass) => {
        const id = assignMultiClass(idTypeClass.getValue(), [
            makeIdAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: idTypeClass.getType(),
            sourceInfo: makeSourceInfo(idTypeClass),
            value: id,
        };
    },
};

export type SoslIdType = CommonType<'soslId'> & {
    value: ValueRuleValue<IdType>[];
};

export const isSoslIdType = (value: unknown): value is SoslIdType => {
    return isCommonType(value) && value.type === 'soslId';
};

export const makeSoslIdAssignRule: AssignForValueRule<SoslIdTypeClass, SoslIdType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isSoslIdTypeClass),
    construct: (idTypeClass: SoslIdTypeClass) => {
        const value = idTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeIdAssignRule, makeErrorAssignRule]));
        return { type: idTypeClass.getType(), sourceInfo: makeSourceInfo(idTypeClass), value };
    },
};
