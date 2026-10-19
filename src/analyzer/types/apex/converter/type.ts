import {
    ArraySubscriptsTypeClass,
    TypeListBaseTypeClass,
    TypeRefTypeClass,
    TypeTypeClass,
    isArraySubscriptsType,
    isTypeRefType,
} from '../../apex_IR';

import {
    ErrorInfo,
    SourceInfoMap,
    AssignForValueRule,
    ValueRuleValue,
    makeEmptySourceInfoMap,
    assignMultiClass,
    makeErrorAssignRule,
    makeSourceInfo,
    isTargetTypeClass,
} from './commons';
import { makeTypeNameRule } from './name';

export const makeArraySubscriptsRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ArraySubscriptsTypeClass, ValueRuleValue<number>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isArraySubscriptsType),
        construct: (typeTypeClass: ArraySubscriptsTypeClass) => {
            const value = assignMultiClass(typeTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is number => typeof target === 'number',
                    construct: (value: number) => {
                        sourceInfo[typeTypeClass.getType()] = makeSourceInfo(typeTypeClass);
                        return value;
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
            return value;
        },
    };
};

export const makeTypeRefRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TypeRefTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeRefType),
        construct: (typeTypeClass: TypeRefTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const type = typeTypeClass.getValue().map((v) => {
                const value = assignMultiClass(v, [
                    makeTypeNameRule(nestedSourceInfo, errorInfo),
                    makeErrorAssignRule(errorInfo),
                ]);
                return value;
            });
            const arrayDimention = assignMultiClass(typeTypeClass.getDimension(), [
                makeArraySubscriptsRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[typeTypeClass.getType()] = nestedSourceInfo;
            return { type, arrayDimention };
        },
    };
};
