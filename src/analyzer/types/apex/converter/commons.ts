import { CommonTypeClass, ErrorTypeClass, isErrorType } from '../../apex_IR';

export const toPrimitiveValue = <T>(
    target: any,
    isValid: (target: any) => target is T,
    errorClass: ErrorTypeClass[],
): T | undefined => {
    if (isValid(target)) {
        return target;
    }

    if (target instanceof CommonTypeClass && isErrorType(target)) {
        errorClass.push(target);
    }

    return undefined;
};

export const toTypeClass = <T extends CommonTypeClass>(
    target: CommonTypeClass,
    isValidType: (target: CommonTypeClass) => target is T,
    errorClasses: ErrorTypeClass[],
): T | undefined => {
    if (isValidType(target)) {
        return target;
    }

    if (isErrorType(target)) {
        errorClasses.push(target);
    }

    return undefined;
};

export abstract class CommonClass {}

export const isCommonClass = <T extends CommonClass>(
    target: CommonClass,
    classType: abstract new (...args: any[]) => T,
): target is T => {
    return target instanceof classType;
};
