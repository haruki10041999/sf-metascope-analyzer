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
    SourceSlot,
    AssignForValueRule,
    ValueRuleValue,
    assignMultiClass,
    isTargetTypeClass,
    makeErrorAssignRule,
    makeSourceNode,
    sourceList,
    sourceField,
} from './commons';

export type AnyIdType = {
    type: string;
    value: string;
};

export const isAnyIdType = typia.createIs<AnyIdType>();

export const makeAnyIdRule = (slot: SourceSlot): AssignForValueRule<AnyIdTypeClass, AnyIdType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isAnyIdTypeClass),
    construct: (idTypeClass: AnyIdTypeClass) => {
        slot(makeSourceNode(idTypeClass));
        return { type: idTypeClass.getType(), value: idTypeClass.getValue() };
    },
});

export type IdType = {
    type: string;
    value: string;
};

export const isIdType = typia.createIs<IdType>();

export const makeIdRule = (slot: SourceSlot): AssignForValueRule<NormalIdTypeClass, IdType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isNormalIdType),
    construct: (idTypeClass: NormalIdTypeClass) => {
        slot(makeSourceNode(idTypeClass));
        return { type: idTypeClass.getType(), value: idTypeClass.getValue() };
    },
});

export type SoqlIdType = {
    type: string;
    value: ValueRuleValue<IdType>;
};

export const isSoqlIdType = typia.createIs<SoqlIdType>();

export const makeSoqlIdRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoqlIdTypeClass, SoqlIdType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isSoqlIdTypeClass),
    construct: (idTypeClass: SoqlIdTypeClass) => {
        const node = makeSourceNode(idTypeClass);
        const id = assignMultiClass(idTypeClass.getValue(), [
            makeIdRule(sourceField(node, 'value')),
            makeErrorAssignRule(errorInfo),
        ]);
        slot(node);
        return {
            type: idTypeClass.getType(),
            value: id,
        };
    },
});

export type SoslIdType = {
    type: string;
    value: ValueRuleValue<IdType>[];
};

export const isSoslIdType = typia.createIs<SoslIdType>();

export const makeSoslIdRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoslIdTypeClass, SoslIdType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isSoslIdTypeClass),
    construct: (idTypeClass: SoslIdTypeClass) => {
        const node = makeSourceNode(idTypeClass);
        const idSource = sourceList(node, 'value');
        const value = idTypeClass
            .getValue()
            .map((v, index) =>
                assignMultiClass(v, [makeIdRule(idSource(index)), makeErrorAssignRule(errorInfo)]),
            );
        slot(node);
        return { type: idTypeClass.getType(), value };
    },
});
