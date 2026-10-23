import {
    BodyTypeClass,
    ClassBodyTypeClass,
    InterfaceBodyTypeClass,
    isClassBodyType as isClassBodyTypeClass,
    isInterfaceBodyType as isInterfaceBodyTypeClass,
} from '../../apex_IR';

import {
    isCommonType,
    ErrorType,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeSourceInfo,
} from './commons';
import {
    makeClassBodyDeclarationAssignRule,
    makeInterfaceMethodDeclarationAssignRule,
    ClassBodyDeclarationType,
    InterfaceMethodDeclarationType,
} from './declaration';

export type ClassBodyType = CommonType<'classBody'> & {
    value: ValueRuleValue<ClassBodyDeclarationType>[];
};

export const isClassBodyType = (value: unknown): value is ClassBodyType => {
    return isCommonType(value) && value.type === 'classBody';
};

export const makeClassBodyAssignRule: AssignForValueRule<ClassBodyTypeClass, ClassBodyType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isClassBodyTypeClass),
    construct: (bodyTypeClass: ClassBodyTypeClass) => {
        const value = bodyTypeClass
            .getValue()
            .map((v) =>
                assignMultiClass(v, [makeClassBodyDeclarationAssignRule, makeErrorAssignRule]),
            );
        return {
            type: bodyTypeClass.getType(),
            sourceInfo: makeSourceInfo(bodyTypeClass),
            value,
        };
    },
};

export type InterfaceBodyType = CommonType<'interfaceBody'> & {
    value: ValueRuleValue<InterfaceMethodDeclarationType>[];
};

export const isInterfaceBodyType = (value: unknown): value is InterfaceBodyType => {
    return isCommonType(value) && value.type === 'interfaceBody';
};

export const makeInterfaceBodyAssignRule: AssignForValueRule<
    InterfaceBodyTypeClass,
    InterfaceBodyType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isInterfaceBodyTypeClass),
    construct: (bodyTypeClass: InterfaceBodyTypeClass) => {
        const value = bodyTypeClass
            .getValue()
            .map((v) =>
                assignMultiClass(v, [
                    makeInterfaceMethodDeclarationAssignRule,
                    makeErrorAssignRule,
                ]),
            );
        return {
            type: bodyTypeClass.getType(),
            sourceInfo: makeSourceInfo(bodyTypeClass),
            value,
        };
    },
};
