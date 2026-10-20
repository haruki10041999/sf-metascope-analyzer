import typia from 'typia';

import {
    ArraySubscriptsTypeClass,
    TypeRefTypeClass,
    isArraySubscriptsType as isArraySubscriptsTypeClass,
    isTypeRefType as isTypeRefTypeClass,
} from '../../apex_IR';

import {
    ErrorInfo,
    SourceSlot,
    AssignForValueRule,
    ValueRuleValue,
    assignMultiClass,
    makeErrorAssignRule,
    isTargetTypeClass,
    makeSourceNode,
    sourceField,
    sourceList,
} from './commons';
import { makeTypeNameRule, TypeNameType } from './name';

export type ArraySubscriptsType = {
    type: string;
    value: ValueRuleValue<number>;
};

export const isArraySubscriptsType = typia.createIs<ArraySubscriptsType>();

export const makeArraySubscriptsRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ArraySubscriptsTypeClass, ArraySubscriptsType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isArraySubscriptsTypeClass),
        construct: (typeTypeClass: ArraySubscriptsTypeClass) => {
            const value = assignMultiClass(typeTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is number => typeof target === 'number',
                    construct: (value: number) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(makeSourceNode(typeTypeClass));
            return { type: typeTypeClass.getType(), value };
        },
    };
};

export type TypeRefType = {
    type: string;
    value: ValueRuleValue<TypeNameType>[];
    dimension: ValueRuleValue<unknown>;
};

export const isTypeRefType = typia.createIs<TypeRefType>();

export const makeTypeRefRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TypeRefTypeClass, TypeRefType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeRefTypeClass),
        construct: (typeTypeClass: TypeRefTypeClass) => {
            const node = makeSourceNode(typeTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = typeTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeTypeNameRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            const dimension = assignMultiClass(typeTypeClass.getDimension(), [
                makeArraySubscriptsRule(sourceField(node, 'dimension'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: typeTypeClass.getType(), value, dimension };
        },
    };
};

