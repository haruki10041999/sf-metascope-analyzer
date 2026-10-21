import typia from 'typia';

import {
    BodyTypeClass,
    ClassBodyTypeClass,
    InterfaceBodyTypeClass,
    isClassBodyType as isClassBodyTypeClass,
    isInterfaceBodyType as isInterfaceBodyTypeClass,
} from '../../apex_IR';

import {
    ErrorInfo,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeSourceInfo,
} from './commons';
import {
    makeClassBodyDeclarationRule,
    makeInterfaceMethodDeclarationRule,
    ClassBodyDeclarationType,
    InterfaceMethodDeclarationType,
} from './declaration';

export type ClassBodyType = CommonType & {
    value: ValueRuleValue<ClassBodyDeclarationType>[];
};

export const isClassBodyType = typia.createIs<ClassBodyType>();

export const makeClassBodyRule = (): AssignForValueRule<ClassBodyTypeClass, ClassBodyType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isClassBodyTypeClass),
        construct: (bodyTypeClass: ClassBodyTypeClass) => {
            const value = bodyTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [makeClassBodyDeclarationRule(), makeErrorAssignRule]),
                );
            return {
                type: bodyTypeClass.getType(),
                sourceInfo: makeSourceInfo(bodyTypeClass),
                value,
            };
        },
    };
};

export type InterfaceBodyType = CommonType & {
    value: ValueRuleValue<InterfaceMethodDeclarationType>[];
};

export const isInterfaceBodyType = typia.createIs<InterfaceBodyType>();

export const makeInterfaceBodyRule = (): AssignForValueRule<
    InterfaceBodyTypeClass,
    InterfaceBodyType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isInterfaceBodyTypeClass),
        construct: (bodyTypeClass: InterfaceBodyTypeClass) => {
            const value = bodyTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [
                        makeInterfaceMethodDeclarationRule(),
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
};

