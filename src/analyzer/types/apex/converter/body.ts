import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { ClassBodyDeclarationType, InterfaceMethodDeclarationType } from './declaration';

export type ClassBodyType = CommonType<'classBody'> & {
    value: ValueRuleValue<ClassBodyDeclarationType>[];
};

export const isClassBodyType = (value: unknown): value is ClassBodyType => {
    return isCommonType(value) && value.type === 'classBody';
};

export type InterfaceBodyType = CommonType<'interfaceBody'> & {
    value: ValueRuleValue<InterfaceMethodDeclarationType>[];
};

export const isInterfaceBodyType = (value: unknown): value is InterfaceBodyType => {
    return isCommonType(value) && value.type === 'interfaceBody';
};
