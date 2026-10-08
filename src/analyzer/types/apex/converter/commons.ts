import { CommonTypeClass, ErrorTypeClass, isErrorType } from '../../apex_IR';

export const toPrimitiveValue = <T>(
    target: any,
    isValid: (target: any) => target is T,
    errorClass: ErrorTypeClass[],
): T | null => {
    if (isValid(target)) {
        return target;
    }

    if (target instanceof CommonTypeClass && isErrorType(target)) {
        errorClass.push(target);
    }

    return null;
};

export const toTypeClass = <T extends CommonTypeClass>(
    target: CommonTypeClass,
    isValidType: (target: CommonTypeClass) => target is T,
    errorClasses: ErrorTypeClass[],
): T | null => {
    if (isValidType(target)) {
        return target;
    }

    if (isErrorType(target)) {
        errorClasses.push(target);
    }

    return null;
};

