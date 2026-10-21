import typia from 'typia';

import {
    ArraySubscriptsTypeClass,
    TypeRefTypeClass,
    isArraySubscriptsType as isArraySubscriptsTypeClass,
    isTypeRefType as isTypeRefTypeClass,
} from '../../apex_IR';

import {
    ErrorInfo,
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
import { makeTypeNameRule, TypeNameType } from './name';

export type ArraySubscriptsType = CommonType & {
    value: ValueRuleValue<number | null>;
};

export const isArraySubscriptsType = typia.createIs<ArraySubscriptsType>();

export const makeArraySubscriptsRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<ArraySubscriptsTypeClass, ArraySubscriptsType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isArraySubscriptsTypeClass),
        construct: (typeTypeClass: ArraySubscriptsTypeClass) => {
            const value = assignMultiClass(typeTypeClass.getValue(), [
                makeNumberAssignRule,
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: typeTypeClass.getType(),
                sourceInfo: makeSourceInfo(typeTypeClass),
                value,
            };
        },
    };
};

export type TypeRefType = CommonType & {
    value: ValueRuleValue<TypeNameType>[];
    dimension: ValueRuleValue<ArraySubscriptsType>;
};

export const isTypeRefType = typia.createIs<TypeRefType>();

export const makeTypeRefRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<TypeRefTypeClass, TypeRefType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeRefTypeClass),
        construct: (typeTypeClass: TypeRefTypeClass) => {
            const value = typeTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [
                        makeTypeNameRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            const dimension = assignMultiClass(typeTypeClass.getDimension(), [
                makeArraySubscriptsRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: typeTypeClass.getType(),
                sourceInfo: makeSourceInfo(typeTypeClass),
                value,
                dimension,
            };
        },
    };
};

