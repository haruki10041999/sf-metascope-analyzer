import typia from 'typia';

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
    ErrorInfo,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    assignMultiClass,
    isTargetTypeClass,
    makeErrorAssignRule,
    makeSourceInfo,
} from './commons';

export type AnyIdType = CommonType & {
    value: string;
};

export const isAnyIdType = typia.createIs<AnyIdType>();

export const makeAnyIdRule = (): AssignForValueRule<AnyIdTypeClass, AnyIdType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isAnyIdTypeClass),
    construct: (idTypeClass: AnyIdTypeClass) => {
        return {
            type: idTypeClass.getType(),
            sourceInfo: makeSourceInfo(idTypeClass),
            value: idTypeClass.getValue(),
        };
    },
});

export type IdType = CommonType & {
    value: string;
};

export const isIdType = typia.createIs<IdType>();

export const makeIdRule = (): AssignForValueRule<NormalIdTypeClass, IdType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isNormalIdType),
    construct: (idTypeClass: NormalIdTypeClass) => {
        return {
            type: idTypeClass.getType(),
            sourceInfo: makeSourceInfo(idTypeClass),
            value: idTypeClass.getValue(),
        };
    },
});

export type SoqlIdType = CommonType & {
    value: ValueRuleValue<IdType>;
};

export const isSoqlIdType = typia.createIs<SoqlIdType>();

export const makeSoqlIdRule = (): AssignForValueRule<SoqlIdTypeClass, SoqlIdType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isSoqlIdTypeClass),
    construct: (idTypeClass: SoqlIdTypeClass) => {
        const id = assignMultiClass(idTypeClass.getValue(), [makeIdRule(), makeErrorAssignRule]);
        return {
            type: idTypeClass.getType(),
            sourceInfo: makeSourceInfo(idTypeClass),
            value: id,
        };
    },
});

export type SoslIdType = CommonType & {
    value: ValueRuleValue<IdType>[];
};

export const isSoslIdType = typia.createIs<SoslIdType>();

export const makeSoslIdRule = (): AssignForValueRule<SoslIdTypeClass, SoslIdType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isSoslIdTypeClass),
    construct: (idTypeClass: SoslIdTypeClass) => {
        const value = idTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeIdRule(), makeErrorAssignRule]));
        return { type: idTypeClass.getType(), sourceInfo: makeSourceInfo(idTypeClass), value };
    },
});
