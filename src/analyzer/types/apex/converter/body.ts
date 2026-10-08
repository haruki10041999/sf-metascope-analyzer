import {
    ErrorTypeClass,
    ClassBodyTypeClass,
    InterfaceBodyTypeClass,
    ClassBodyDeclarationTypeClass,
    isClassBodyDeclarationType,
    InterfaceMethodDeclarationTypeClass,
    isInterfaceMethodDeclarationType,
} from '../../apex_IR';

import { toTypeClass } from './commons';

export const classBodyConvertet = (
    target: ClassBodyTypeClass,
    errorClass: ErrorTypeClass[],
): ClassBodyDeclarationTypeClass[] | null => {
    const value: ClassBodyDeclarationTypeClass[] = [];
    target.getValue().forEach((item) => {
        const converted = toTypeClass(item, isClassBodyDeclarationType, errorClass);
        if (converted) {
            value.push(converted);
        }
    });
    return value.length > 0 ? value : null;
};

export const interfaceBodyConverter = (
    target: InterfaceBodyTypeClass,
    errorClass: ErrorTypeClass[],
): InterfaceMethodDeclarationTypeClass[] | null => {
    const value: InterfaceMethodDeclarationTypeClass[] = [];
    target.getValue().forEach((item) => {
        const converted = toTypeClass(item, isInterfaceMethodDeclarationType, errorClass);
        if (converted) {
            value.push(converted);
        }
    });
    return value.length > 0 ? value : null;
};
