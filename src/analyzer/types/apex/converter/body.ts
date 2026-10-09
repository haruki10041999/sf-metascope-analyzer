import {
    ErrorTypeClass,
    ClassBodyTypeClass,
    InterfaceBodyTypeClass,
    isClassBodyDeclarationType,
    isInterfaceMethodDeclarationType,
} from '../../apex_IR';

import { toTypeClass } from './commons';
import {
    ClassBodyDeclaration,
    classBodyDeclarationConvert,
    InterfaceMethodDeclaration,
    interfaceMethodDeclarationConvert,
} from './declaration';

export type ClassBody = ClassBodyDeclaration[] | undefined;

export const classBodyConvert = (
    target: ClassBodyTypeClass,
    errorClass: ErrorTypeClass[],
): ClassBody => {
    const value: ClassBodyDeclaration[] = [];
    target.getValue().forEach((item) => {
        const converted = toTypeClass(item, isClassBodyDeclarationType, errorClass);
        if (converted) {
            value.push(classBodyDeclarationConvert(converted, errorClass));
        }
    });
    return value.length > 0 ? value : undefined;
};

export type InterfaceBody = InterfaceMethodDeclaration[] | undefined;

export const interfaceBodyConvert = (
    target: InterfaceBodyTypeClass,
    errorClass: ErrorTypeClass[],
): InterfaceBody => {
    const value: InterfaceMethodDeclaration[] = [];
    target.getValue().forEach((item) => {
        const converted = toTypeClass(item, isInterfaceMethodDeclarationType, errorClass);
        if (converted) {
            value.push(interfaceMethodDeclarationConvert(converted, errorClass));
        }
    });
    return value.length > 0 ? value : undefined;
};
