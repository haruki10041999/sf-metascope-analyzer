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
    SourceSlot,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeSourceNode,
    sourceList,
} from './commons';
import {
    makeClassBodyDeclarationRule,
    makeInterfaceMethodDeclarationRule,
    ClassBodyDeclarationType,
    InterfaceMethodDeclarationType,
} from './declaration';

export type ClassBodyType = {
    type: string;
    value: ValueRuleValue<ClassBodyDeclarationType>[];
};

export const isClassBodyType = typia.createIs<ClassBodyType>();

export const makeClassBodyRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ClassBodyTypeClass, ClassBodyType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isClassBodyTypeClass),
        construct: (bodyTypeClass: ClassBodyTypeClass) => {
            const node = makeSourceNode(bodyTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = bodyTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeClassBodyDeclarationRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: bodyTypeClass.getType(), value };
        },
    };
};

export type InterfaceBodyType = {
    type: string;
    value: ValueRuleValue<InterfaceMethodDeclarationType>[];
};

export const isInterfaceBodyType = typia.createIs<InterfaceBodyType>();

export const makeInterfaceBodyRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<InterfaceBodyTypeClass, InterfaceBodyType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isInterfaceBodyTypeClass),
        construct: (bodyTypeClass: InterfaceBodyTypeClass) => {
            const node = makeSourceNode(bodyTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = bodyTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeInterfaceMethodDeclarationRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: bodyTypeClass.getType(), value };
        },
    };
};

