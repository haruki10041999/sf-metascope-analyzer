import {
    BodyTypeClass,
    ClassBodyTypeClass,
    InterfaceBodyTypeClass,
    isClassBodyType,
    isInterfaceBodyType,
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
} from './commons';
import { makeClassBodyDeclarationRule, makeInterfaceMethodDeclarationRule } from './declaration';

export const makeClassBodyRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ClassBodyTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isClassBodyType),
        construct: (bodyTypeClass: ClassBodyTypeClass) => {
            const body = bodyTypeClass.getValue().map((v, index) => {
                const nestedSourceInfo = makeEmptySourceInfoMap();
                const value = assignMultiClass(v, [
                    makeClassBodyDeclarationRule(nestedSourceInfo, errorInfo),
                    makeErrorAssignRule(errorInfo),
                ]);
                sourceInfo[`${bodyTypeClass.getType}_${index}`] = nestedSourceInfo;
                return value;
            });
            return body;
        },
    };
};

export const makeInterfaceBodyRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<InterfaceBodyTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isInterfaceBodyType),
        construct: (bodyTypeClass: InterfaceBodyTypeClass) => {
            const body = bodyTypeClass.getValue().map((v, index) => {
                const nestedSourceInfo = makeEmptySourceInfoMap();
                const value = assignMultiClass(v, [
                    makeInterfaceMethodDeclarationRule(nestedSourceInfo, errorInfo),
                    makeErrorAssignRule(errorInfo),
                ]);
                sourceInfo[`${bodyTypeClass.getType}_${index}`] = nestedSourceInfo;
                return value;
            });
            return body;
        },
    };
};
