import { CommonTypeClass, ErrorTypeClass, isErrorType } from '../../apex_IR';

import { isExpressionClass, ExpressionClass } from './expression';
import { isTypeRefClass, TypeRefClass } from './type';
import { isNormalStatementClass, NormalStatementClass } from './statement';
import {
    isClassBodyDeclarationClass,
    isInterfaceMethodDeclarationClass,
    ClassBodyDeclarationClass,
    InterfaceMethodDeclarationClass,
} from './declaration';
import { isVariableDeclaratorClass, VariableDeclaratorClass } from './variable';
import { isSignedLiteralClass, SignedLiteralClass } from './literal';
import { isNormalValueClass, NormalValueClass } from './value';
import { isWhenLiteralClass, WhenLiteralClass } from './literal';
import {
    isAnonymousBlockMemberClass,
    isTriggerBlockMemberClass,
    AnonymousBlockMemberClass,
    TriggerBlockMemberClass,
} from './member';
import { isTriggerCaseClass, TriggerCaseClass } from './unit';
import { isWhenControlClass, WhenControlClass } from './control';
import { isCatchClauseClass, isFieldOrderClass, CatchClauseClass, FieldOrderClass } from './clause';
import { isSoslFieldClass, SoslFieldClass } from './list';
import { isEntryClass, EntryClass } from './entry';

export const isString = (target: any): target is string => {
    return typeof target === 'string';
};

export const isNumber = (target: any): target is number => {
    return typeof target === 'number';
};

export const isCoordinateValue = (target: any): target is SignedLiteralClass | ExpressionClass => {
    return isSignedLiteralClass(target) || isExpressionClass(target);
};

export const isLocationValue = (
    target: any,
): target is (SignedLiteralClass | ExpressionClass)[] | string[] | ExpressionClass => {
    return (
        (Array.isArray(target) &&
            (target.every(
                (t) =>
                    t instanceof CommonClass && (isSignedLiteralClass(t) || isExpressionClass(t)),
            ) ||
                target.every((t) => typeof t === 'string'))) ||
        isExpressionClass(target)
    );
};

export const isDistanceValue = (
    target: any,
): target is string | (SignedLiteralClass | ExpressionClass)[] | string[] | ExpressionClass => {
    return (
        isString(target) ||
        isLocationValue(target) ||
        isStringArray(target) ||
        isExpressionClass(target)
    );
};

export const isDistanceValueArray = (
    target: any,
): target is (string | (SignedLiteralClass | ExpressionClass)[] | string[] | ExpressionClass)[] => {
    return Array.isArray(target) && target.every((t) => isDistanceValue(t));
};

export const isStringArray = (target: any): target is string[] => {
    return Array.isArray(target) && target.every((t) => typeof t === 'string');
};

export const isExpressionClassArray = (target: any): target is ExpressionClass[] => {
    return (
        Array.isArray(target) &&
        target.every((t) => t instanceof CommonClass && isExpressionClass(t))
    );
};

export const isTypeRefClassArray = (target: any): target is TypeRefClass[] => {
    return (
        Array.isArray(target) && target.every((t) => t instanceof CommonClass && isTypeRefClass(t))
    );
};

export const isNormalStatementClassArray = (target: any): target is NormalStatementClass[] => {
    return (
        Array.isArray(target) &&
        target.every((t) => t instanceof CommonClass && isNormalStatementClass(t))
    );
};

export const isClassBodyDeclarationClassArray = (
    target: any,
): target is ClassBodyDeclarationClass[] => {
    return (
        Array.isArray(target) &&
        target.every((t) => t instanceof CommonClass && isClassBodyDeclarationClass(t))
    );
};

export const isInterfaceMethodDeclarationClassArray = (
    target: any,
): target is InterfaceMethodDeclarationClass[] => {
    return (
        Array.isArray(target) &&
        target.every((t) => t instanceof CommonClass && isInterfaceMethodDeclarationClass(t))
    );
};

export const isVariableDeclaratorClassArray = (
    target: any,
): target is VariableDeclaratorClass[] => {
    return (
        Array.isArray(target) &&
        target.every((t) => t instanceof CommonClass && isVariableDeclaratorClass(t))
    );
};

export const isNormalValueClassArray = (target: any): target is NormalValueClass[] => {
    return (
        Array.isArray(target) &&
        target.every((t) => t instanceof CommonClass && isNormalValueClass(t))
    );
};

export const isWhenLiteralClassArray = (target: any): target is WhenLiteralClass[] => {
    return (
        Array.isArray(target) &&
        target.every((t) => t instanceof CommonClass && isWhenLiteralClass(t))
    );
};

export const isAnonymousBlockMemberClassArray = (
    target: any,
): target is AnonymousBlockMemberClass[] => {
    return (
        Array.isArray(target) &&
        target.every((t) => t instanceof CommonClass && isAnonymousBlockMemberClass(t))
    );
};

export const isTriggerBlockMemberClassArray = (
    target: any,
): target is TriggerBlockMemberClass[] => {
    return (
        Array.isArray(target) &&
        target.every((t) => t instanceof CommonClass && isTriggerBlockMemberClass(t))
    );
};

export const isWhenControlClassArray = (target: any): target is WhenControlClass[] => {
    return (
        Array.isArray(target) &&
        target.every((t) => t instanceof CommonClass && isWhenControlClass(t))
    );
};

export const isTriggerCaseClassArray = (target: any): target is TriggerCaseClass[] => {
    return (
        Array.isArray(target) &&
        target.every((t) => t instanceof CommonClass && isTriggerCaseClass(t))
    );
};

export const isCatchClauseClassArray = (target: any): target is CatchClauseClass[] => {
    return (
        Array.isArray(target) &&
        target.every((t) => t instanceof CommonClass && isCatchClauseClass(t))
    );
};

export const isSoslFieldClassArray = (target: any): target is SoslFieldClass[] => {
    return (
        Array.isArray(target) &&
        target.every((t) => t instanceof CommonClass && isSoslFieldClass(t))
    );
};

export const isFieldOrderClassArray = (target: any): target is FieldOrderClass[] => {
    return (
        Array.isArray(target) &&
        target.every((t) => t instanceof CommonClass && isFieldOrderClass(t))
    );
};

export const isEntryClassArray = (target: any): target is EntryClass[] => {
    return (
        Array.isArray(target) && target.every((t) => t instanceof CommonClass && isEntryClass(t))
    );
};

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

export abstract class CommonClass {}

export const isCommonClass = <T extends CommonClass>(
    target: CommonClass,
    classType: abstract new (...args: any) => T,
): target is T => {
    return target instanceof classType;
};
