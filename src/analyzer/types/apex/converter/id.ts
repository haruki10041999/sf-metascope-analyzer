import {
    NormalIdTypeClass,
    AnyIdTypeClass,
    SoqlIdTypeClass,
    SoslIdTypeClass,
    isNormalIdType,
    isAnyIdType,
    isSoqlIdType,
    isSoslIdType,
} from '../../apex_IR';

import {
    ErrorInfo,
    SourceInfoMap,
    assignMultiClass,
    isErrorInfo,
    isTargetTypeClass,
    makeErrorAssignRule,
    makeErrorInfo,
    makeSourceInfo,
    makeEmptySourceInfoMap,
    makeSingleSourceInfoMap,
    makeArraySourceInfoMap,
} from './commons';

export const makeIdRule = (sourceInfo: SourceInfoMap) => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalIdType),
        construct: (idTypeClass: NormalIdTypeClass) => {
            sourceInfo[idTypeClass.getType()] = makeSourceInfo(idTypeClass);
            return idTypeClass.getValue();
        },
    };
};

export const makeAnyIdRule = (sourceInfo: SourceInfoMap) => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAnyIdType),
        construct: (anyIdTypeClass: AnyIdTypeClass) => {
            sourceInfo[anyIdTypeClass.getType()] = makeSourceInfo(anyIdTypeClass);
            return anyIdTypeClass.getValue();
        },
    };
};

export const makeSoqlIdRule = (sourceInfo: SourceInfoMap, errorInfo: ErrorInfo[]) => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoqlIdType),
        construct: (soqlIdTypeClass: SoqlIdTypeClass) => {
            const soqlIdType = soqlIdTypeClass.getType();
            const soqlIdSourceInfo = makeEmptySourceInfoMap();
            const soqlId = assignMultiClass(soqlIdTypeClass, [
                makeIdRule(soqlIdSourceInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[soqlIdType] = soqlIdSourceInfo;
            return soqlId;
        },
    };
};

export const makeSoslIdRule = (sourceInfo: SourceInfoMap, errorInfo: ErrorInfo[]) => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslIdType),
        construct: (soslIdTypeClass: SoslIdTypeClass) => {
            const soslIdType = soslIdTypeClass.getType();
            const soslIdSourceInfo = makeEmptySourceInfoMap();
            const soslId = soslIdTypeClass
                .getValue()
                .map((value, index) => {
                    const id = assignMultiClass(value, [
                        makeIdRule(soslIdSourceInfo),
                        makeErrorAssignRule(errorInfo),
                    ]);
                    soslIdSourceInfo[`${value.getType()}_${index}`] = makeSourceInfo(value);
                    return id;
                })
                .filter((id) => id != null);
            sourceInfo[soslIdType] = soslIdSourceInfo;
            return soslId;
        },
    };
};
