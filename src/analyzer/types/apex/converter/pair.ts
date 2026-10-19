import {
    ElementValuePairsTypeClass,
    ElementValuePairTypeClass,
    IdCreatedNamePairTypeClass,
    MapCreatorRestPairTypeClass,
    PairListTypeClass,
    PairTypeClass,
    isElementValuePairsType,
    isElementValuePairType,
    isIdCreatedNamePairType,
    isMapCreatorRestPairType,
} from '../../apex_IR';

import {
    ErrorInfo,
    SourceInfoMap,
    AssignForValueRule,
    ValueRuleValue,
    makeEmptySourceInfoMap,
    isTargetTypeClass,
} from './commons';

export const makeElementValuePairsRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ElementValuePairsTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isElementValuePairsType),
        construct: (_typeClass: ElementValuePairsTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeElementValuePairRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ElementValuePairTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isElementValuePairType),
        construct: (_typeClass: ElementValuePairTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeIdCreatedNamePairRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<IdCreatedNamePairTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isIdCreatedNamePairType),
        construct: (_typeClass: IdCreatedNamePairTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeMapCreatorRestPairRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<MapCreatorRestPairTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMapCreatorRestPairType),
        construct: (_typeClass: MapCreatorRestPairTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};
