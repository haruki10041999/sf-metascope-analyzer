import {
    CoordinateValueTypeClass,
    ElementValueTypeClass,
    ErrorTypeClass,
    LocationValueTypeClass,
    NormalValueTypeClass,
    ValueTypeClass,
    WhenLiteralTypeClass,
    WhenValueTypeClass,
    isCoordinateValueType,
    isElementValueType,
    isErrorType,
    isLocationValueType,
    isNormalValueType,
    isWhenLiteralType,
    isWhenValueType,
} from '../../apex_IR';

import {
    ErrorInfo,
    SourceInfoMap,
    AssignForValueRule,
    ValueRuleValue,
    makeEmptySourceInfoMap,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeSourceInfo,
} from './commons';
import { makeBoundExpressionRule } from './expression';
import { makeIdRule } from './id';
import { makeValueListRule } from './list';
import {
    makeLiteralRule,
    makeSignedIntegerRule,
    makeSignedNumberRule,
    makeWhenLiteralRule,
} from './literal';
import { makeFieldNameRule } from './name';
import { makeDateFormulaRule, makeSubQueryRule } from './query';

export const makeCoordinateValueRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<CoordinateValueTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCoordinateValueType),
        construct: (valueTypeClass: CoordinateValueTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(valueTypeClass.getValue(), [
                makeSignedIntegerRule(nestedSourceInfo, errorInfo),
                makeSignedNumberRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[valueTypeClass.getType()] = sourceInfo;
            return value;
        },
    };
};

export const makeElementValueRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ElementValueTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isElementValueType),
        construct: (valueTypeClass: ElementValueTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(valueTypeClass.getValue(), [
                makeLiteralRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[valueTypeClass.getType()] = sourceInfo;
            return value;
        },
    };
};

export const makeLocationValueRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<LocationValueTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isLocationValueType),
        construct: (valueTypeClass: LocationValueTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(valueTypeClass.getValue(), [
                makeFieldNameRule(nestedSourceInfo, errorInfo),
                makeBoundExpressionRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[valueTypeClass.getType()] = sourceInfo;
            return value;
        },
    };
};

export const makeValueRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalValueTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalValueType),
        construct: (valueTypeClass: NormalValueTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(valueTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => {
                        nestedSourceInfo['string'] = value;
                        return value;
                    },
                },
                makeSignedNumberRule(nestedSourceInfo, errorInfo),
                makeDateFormulaRule(nestedSourceInfo, errorInfo),
                makeSubQueryRule(nestedSourceInfo, errorInfo),
                makeValueListRule(nestedSourceInfo, errorInfo),
                makeBoundExpressionRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[valueTypeClass.getType()] = sourceInfo;
            return value;
        },
    };
};

export const makeWhenValueRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhenValueTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhenValueType),
        construct: (valueTypeClass: WhenValueTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(valueTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => {
                        nestedSourceInfo['string'] = value;
                        return value;
                    },
                },
                {
                    isValid: (
                        target: unknown,
                    ): target is (WhenLiteralTypeClass | ErrorTypeClass)[] =>
                        Array.isArray(target) &&
                        target.every(
                            (t) =>
                                isTargetTypeClass(t, isWhenLiteralType) ||
                                isTargetTypeClass(t, isErrorType),
                        ),
                    construct: (values: (WhenLiteralTypeClass | ErrorTypeClass)[]) => {
                        const value = values.forEach((v, index) => {
                            const valueSourceInfo = makeEmptySourceInfoMap();
                            const value = assignMultiClass(v, [
                                makeWhenLiteralRule(valueSourceInfo, errorInfo),
                                makeErrorAssignRule(errorInfo),
                            ]);
                            nestedSourceInfo[`${valueTypeClass.getType()}_${index}`] =
                                valueSourceInfo;
                            return value;
                        });
                        return value;
                    },
                },
                makeIdRule(nestedSourceInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[valueTypeClass.getType()] = sourceInfo;
            return value;
        },
    };
};
