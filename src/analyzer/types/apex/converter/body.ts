import {
    ErrorTypeClass,
    ClassBodyTypeClass,
    InterfaceBodyTypeClass,
    isClassBodyDeclarationType,
    isInterfaceMethodDeclarationType,
} from '../../apex_IR';

import { toTypeClass } from './commons';
import {
    ClassBodyDeclarationClass,
    InterfaceMethodDeclarationClass,
    classBodyDeclarationConvert,
    interfaceMethodDeclarationConvert,
} from './declaration';

export const classBodyConvert = (
    target: ClassBodyTypeClass,
    errorClass: ErrorTypeClass[],
): ClassBodyDeclarationClass[] => {
    const values: ClassBodyDeclarationClass[] = [];

    target.getValue().forEach((item) => {
        const converted = toTypeClass(item, isClassBodyDeclarationType, errorClass);
        if (converted) {
            values.push(classBodyDeclarationConvert(converted, errorClass));
        }
    });

    return values;
};

export const interfaceBodyConvert = (
    target: InterfaceBodyTypeClass,
    errorClass: ErrorTypeClass[],
): InterfaceMethodDeclarationClass[] => {
    const values: InterfaceMethodDeclarationClass[] = [];

    target.getValue().forEach((item) => {
        const converted = toTypeClass(item, isInterfaceMethodDeclarationType, errorClass);
        if (converted) {
            values.push(interfaceMethodDeclarationConvert(converted, errorClass));
        }
    });

    return values;
};
