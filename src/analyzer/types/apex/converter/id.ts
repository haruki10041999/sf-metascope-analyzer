import {
    AnyIdTypeClass,
    IdListTypeClass,
    IdTypeClass,
    IdValueTypeClass,
    NormalIdTypeClass,
    SoqlIdTypeClass,
    SoslIdTypeClass,
    isAnyIdType,
    isNormalIdType,
    isSoqlIdType,
    isSoslIdType,
} from '../../apex_IR';

import {
    ErrorInfo,
    SourceInfoMap,
    AssignForValueRule,
    ValueRuleValue,
    assignMultiClass,
    isTargetTypeClass,
    makeErrorAssignRule,
    makeSourceInfo,
    makeEmptySourceInfoMap,
} from './commons';

export const makeAnyIdRule = (
    sourceInfo: SourceInfoMap,
): AssignForValueRule<AnyIdTypeClass, ValueRuleValue<string>> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isAnyIdType),
    construct: (idTypeClass: AnyIdTypeClass) => {
        sourceInfo[idTypeClass.getType()] = makeSourceInfo(idTypeClass);
        return idTypeClass.getValue();
    },
});

export const makeIdRule = (
    sourceInfo: SourceInfoMap,
): AssignForValueRule<NormalIdTypeClass, string> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isNormalIdType),
    construct: (idTypeClass: NormalIdTypeClass) => {
        sourceInfo[idTypeClass.getType()] = makeSourceInfo(idTypeClass);
        return idTypeClass.getValue();
    },
});

export const makeSoqlIdRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoqlIdTypeClass, ValueRuleValue<string>> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isSoqlIdType),
    construct: (idTypeClass: SoqlIdTypeClass) => {
        const nestedSourceInfo = makeEmptySourceInfoMap();
        const id = assignMultiClass(idTypeClass.getValue(), [
            makeIdRule(nestedSourceInfo),
            makeErrorAssignRule(errorInfo),
        ]);
        sourceInfo[idTypeClass.getType()] = nestedSourceInfo;
        return id;
    },
});

export const makeSoslIdRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoslIdTypeClass, ValueRuleValue<string>[]> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isSoslIdType),
    construct: (idTypeClass: SoslIdTypeClass) => {
        const nestedSourceInfo = makeEmptySourceInfoMap();
        const ids = idTypeClass.getValue().map((value, index) => {
            const id = assignMultiClass(value, [
                makeIdRule(nestedSourceInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[`${value.getType()}_${index}`] = makeSourceInfo(value);
            return id;
        });
        return ids;
    },
});
