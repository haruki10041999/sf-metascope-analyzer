import {
    CommonTypeClass,
    ErrorTypeClass,
    AnonymousMemberDeclarationTypeClass,
    ClassBodyDeclarationTypeClass,
    ClassDeclarationTypeClass,
    ConstructorDeclarationTypeClass,
    EnumConstantsTypeClass,
    EnumDeclarationTypeClass,
    FieldDeclarationTypeClass,
    InterfaceDeclarationTypeClass,
    InterfaceMethodDeclarationTypeClass,
    LocalVariableDeclarationTypeClass,
    MemberDeclarationTypeClass,
    MethodDeclarationTypeClass,
    PropertyDeclarationTypeClass,
    TriggerMemberDeclarationTypeClass,
    TypeDeclarationTypeClass,
    NormalBlockTypeClass,
    TypeRefTypeClass,
    isClassBodyType,
    isClassDeclarationType,
    isConstructorDeclarationType,
    isEnumConstantsType,
    isEnumDeclarationType,
    isFieldDeclarationType,
    isFormalParametersType,
    isInterfaceBodyType,
    isInterfaceDeclarationType,
    isMemberDeclarationType,
    isMethodDeclarationType,
    isNormalBlockType,
    isNormalIdType,
    isPropertyBlockType,
    isPropertyDeclarationType,
    isQualifiedNameType,
    isTypeListType,
    isTypeRefType,
    isVariableDeclaratorsType,
} from '../../apex_IR';

import { toTypeClass } from './commons';
import { NormalId, normalIdConvert } from './id';
import { QualifiedName, qualifiedNameConvert } from './name';
import { TypeRef, typeRefConvert } from './type';
import { TypeList, typeListConvert } from './list';
import { NormalBlock, normalBlockConvert, PropertyBlock, propertyBlockConvert } from './block';
import { ClassBody, classBodyConvert, InterfaceBody, interfaceBodyConvert } from './body';
import { NormalModifier, normalModifierListConvert } from './modifier';
import { FormalParameters, formalParametersConvert } from './parameter';
import { VariableDeclarators, variableDeclaratorsConvert } from './variable';

const normalIdOrUndefinedConvert = (
    target: CommonTypeClass,
    errorClass: ErrorTypeClass[],
): NormalId | undefined => {
    const typeClass = toTypeClass(target, isNormalIdType, errorClass);
    return typeClass ? normalIdConvert(typeClass) : undefined;
};

const typeRefOrUndefinedConvert = (
    target: CommonTypeClass,
    errorClass: ErrorTypeClass[],
): TypeRef | undefined => {
    const typeClass = toTypeClass(target, isTypeRefType, errorClass);
    return typeClass ? typeRefConvert(typeClass, errorClass) : undefined;
};

const returnTypeConvert = (
    target: TypeRefTypeClass | 'void' | ErrorTypeClass,
    errorClass: ErrorTypeClass[],
): TypeRef | 'void' | undefined => {
    return target === 'void' ? target : typeRefOrUndefinedConvert(target, errorClass);
};

const formalParametersOrUndefinedConvert = (
    target: CommonTypeClass | null | undefined,
    errorClass: ErrorTypeClass[],
): FormalParameters => {
    const typeClass = target ? toTypeClass(target, isFormalParametersType, errorClass) : undefined;
    return typeClass ? formalParametersConvert(typeClass, errorClass) : undefined;
};

const normalBlockOrUndefinedConvert = (
    target: CommonTypeClass | null | undefined,
    errorClass: ErrorTypeClass[],
): NormalBlock => {
    const typeClass = target ? toTypeClass(target, isNormalBlockType, errorClass) : undefined;
    return typeClass ? normalBlockConvert(typeClass, errorClass) : undefined;
};

export type MemberDeclarationValue =
    | {
          type: string;
          member:
              | MethodDeclaration
              | ConstructorDeclaration
              | InterfaceDeclaration
              | ClassDeclaration
              | EnumDeclaration
              | PropertyDeclaration
              | FieldDeclaration;
      }
    | undefined;

const memberDeclarationValueConvert = (
    target: CommonTypeClass,
    errorClass: ErrorTypeClass[],
): MemberDeclarationValue => {
    const valueTypeClass = toTypeClass(
        target,
        (
            target,
        ): target is
            | MethodDeclarationTypeClass
            | ConstructorDeclarationTypeClass
            | InterfaceDeclarationTypeClass
            | ClassDeclarationTypeClass
            | EnumDeclarationTypeClass
            | PropertyDeclarationTypeClass
            | FieldDeclarationTypeClass =>
            isMethodDeclarationType(target) ||
            isConstructorDeclarationType(target) ||
            isInterfaceDeclarationType(target) ||
            isClassDeclarationType(target) ||
            isEnumDeclarationType(target) ||
            isPropertyDeclarationType(target) ||
            isFieldDeclarationType(target),
        errorClass,
    );

    if (!valueTypeClass) {
        return undefined;
    }
    if (isMethodDeclarationType(valueTypeClass)) {
        return {
            type: 'method',
            member: methodDeclarationConvert(valueTypeClass, errorClass),
        };
    }
    if (isConstructorDeclarationType(valueTypeClass)) {
        return {
            type: 'constructor',
            member: constructorDeclarationConvert(valueTypeClass, errorClass),
        };
    }
    if (isInterfaceDeclarationType(valueTypeClass)) {
        return {
            type: 'interface',
            member: interfaceDeclarationConvert(valueTypeClass, errorClass),
        };
    }
    if (isClassDeclarationType(valueTypeClass)) {
        return {
            type: 'class',
            member: classDeclarationConvert(valueTypeClass, errorClass),
        };
    }
    if (isEnumDeclarationType(valueTypeClass)) {
        return {
            type: 'enum',
            member: enumDeclarationConvert(valueTypeClass, errorClass),
        };
    }
    if (isPropertyDeclarationType(valueTypeClass)) {
        return {
            type: 'property',
            member: propertyDeclarationConvert(valueTypeClass, errorClass),
        };
    }
    if (isFieldDeclarationType(valueTypeClass)) {
        return {
            type: 'field',
            member: fieldDeclarationConvert(valueTypeClass, errorClass),
        };
    }

    return undefined;
};

export type AnonymousMemberDeclaration = MemberDeclarationValue;

export const anonymousMemberDeclarationConvert = (
    target: AnonymousMemberDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): AnonymousMemberDeclaration => {
    return memberDeclarationValueConvert(target.getValue(), errorClass);
};

export type MemberDeclaration = MemberDeclarationValue;

export const memberDeclarationConvert = (
    target: MemberDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): MemberDeclaration => {
    return memberDeclarationValueConvert(target.getValue(), errorClass);
};

export type TriggerMemberDeclaration = MemberDeclarationValue;

export const triggerMemberDeclarationConvert = (
    target: TriggerMemberDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): TriggerMemberDeclaration => {
    return memberDeclarationValueConvert(target.getValue(), errorClass);
};

export type ClassBodyDeclaration = {
    value: MemberDeclaration | NormalBlock;
    modifier: NormalModifier[] | undefined;
    isStatic: boolean | undefined;
};

export const classBodyDeclarationConvert = (
    target: ClassBodyDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): ClassBodyDeclaration => {
    const valueValue = target.getValue();

    let value: ClassBodyDeclaration['value'] = undefined;
    if (valueValue) {
        const valueTypeClass = toTypeClass(
            valueValue,
            (target): target is MemberDeclarationTypeClass | NormalBlockTypeClass =>
                isMemberDeclarationType(target) || isNormalBlockType(target),
            errorClass,
        );
        if (valueTypeClass) {
            if (isMemberDeclarationType(valueTypeClass)) {
                value = memberDeclarationConvert(valueTypeClass, errorClass);
            }
            if (isNormalBlockType(valueTypeClass)) {
                value = normalBlockConvert(valueTypeClass, errorClass);
            }
        }
    }

    return {
        value: value,
        modifier: normalModifierListConvert(target.getModifier(), errorClass),
        isStatic: valueValue && isNormalBlockType(valueValue) ? target.getIsStatic() : undefined,
    };
};

export type ClassDeclaration = {
    value: NormalId | undefined;
    body: ClassBody;
    extend: TypeRef | undefined;
    implement: TypeList | undefined;
};

export const classDeclarationConvert = (
    target: ClassDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): ClassDeclaration => {
    const bodyTypeClass = toTypeClass(target.getBody(), isClassBodyType, errorClass);

    const extendValue = target.getExtend();
    const implementValue = target.getImplement();
    const implementTypeClass = implementValue
        ? toTypeClass(implementValue, isTypeListType, errorClass)
        : undefined;

    return {
        value: normalIdOrUndefinedConvert(target.getValue(), errorClass),
        body: bodyTypeClass ? classBodyConvert(bodyTypeClass, errorClass) : undefined,
        extend: extendValue ? typeRefOrUndefinedConvert(extendValue, errorClass) : undefined,
        implement: implementTypeClass ? typeListConvert(implementTypeClass, errorClass) : undefined,
    };
};

export type ConstructorDeclaration = {
    value: QualifiedName;
    param: FormalParameters;
    block: NormalBlock;
};

export const constructorDeclarationConvert = (
    target: ConstructorDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): ConstructorDeclaration => {
    const valueTypeClass = toTypeClass(target.getValue(), isQualifiedNameType, errorClass);

    return {
        value: valueTypeClass ? qualifiedNameConvert(valueTypeClass, errorClass) : undefined,
        param: formalParametersOrUndefinedConvert(target.getParam(), errorClass),
        block: normalBlockOrUndefinedConvert(target.getBlock(), errorClass),
    };
};

export type EnumConstants = NormalId[] | undefined;

export const enumConstantsConvert = (
    target: EnumConstantsTypeClass,
    errorClass: ErrorTypeClass[],
): EnumConstants => {
    const values: NormalId[] = [];
    target.getValue().forEach((item) => {
        const value = normalIdOrUndefinedConvert(item, errorClass);
        if (value) {
            values.push(value);
        }
    });
    return values.length > 0 ? values : undefined;
};

export type EnumDeclaration = {
    value: NormalId | undefined;
    constant: EnumConstants;
};

export const enumDeclarationConvert = (
    target: EnumDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): EnumDeclaration => {
    const constantValue = target.getConstant();
    const constantTypeClass = constantValue
        ? toTypeClass(constantValue, isEnumConstantsType, errorClass)
        : undefined;

    return {
        value: normalIdOrUndefinedConvert(target.getValue(), errorClass),
        constant: constantTypeClass
            ? enumConstantsConvert(constantTypeClass, errorClass)
            : undefined,
    };
};

export type FieldDeclaration = {
    value: VariableDeclarators;
    valueType: TypeRef | undefined;
};

export const fieldDeclarationConvert = (
    target: FieldDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): FieldDeclaration => {
    const valueTypeClass = toTypeClass(target.getValue(), isVariableDeclaratorsType, errorClass);

    return {
        value: valueTypeClass ? variableDeclaratorsConvert(valueTypeClass, errorClass) : undefined,
        valueType: typeRefOrUndefinedConvert(target.getValueType(), errorClass),
    };
};

export type InterfaceDeclaration = {
    value: NormalId | undefined;
    body: InterfaceBody;
    extend: TypeList | undefined;
};

export const interfaceDeclarationConvert = (
    target: InterfaceDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): InterfaceDeclaration => {
    const bodyTypeClass = toTypeClass(target.getBody(), isInterfaceBodyType, errorClass);

    const extendValue = target.getExtend();
    const extendTypeClass = extendValue
        ? toTypeClass(extendValue, isTypeListType, errorClass)
        : undefined;

    return {
        value: normalIdOrUndefinedConvert(target.getValue(), errorClass),
        body: bodyTypeClass ? interfaceBodyConvert(bodyTypeClass, errorClass) : undefined,
        extend: extendTypeClass ? typeListConvert(extendTypeClass, errorClass) : undefined,
    };
};

export type InterfaceMethodDeclaration = {
    value: NormalId | undefined;
    valueType: TypeRef | 'void' | undefined;
    param: FormalParameters;
    modifier: NormalModifier[] | undefined;
};

export const interfaceMethodDeclarationConvert = (
    target: InterfaceMethodDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): InterfaceMethodDeclaration => {
    return {
        value: normalIdOrUndefinedConvert(target.getValue(), errorClass),
        valueType: returnTypeConvert(target.getValueType(), errorClass),
        param: formalParametersOrUndefinedConvert(target.getParam(), errorClass),
        modifier: normalModifierListConvert(target.getModifier(), errorClass),
    };
};

export type LocalVariableDeclaration = {
    value: VariableDeclarators;
    valueType: TypeRef | undefined;
    modifier: NormalModifier[] | undefined;
};

export const localVariableDeclarationConvert = (
    target: LocalVariableDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): LocalVariableDeclaration => {
    const valueTypeClass = toTypeClass(target.getValue(), isVariableDeclaratorsType, errorClass);

    return {
        value: valueTypeClass ? variableDeclaratorsConvert(valueTypeClass, errorClass) : undefined,
        valueType: typeRefOrUndefinedConvert(target.getValueType(), errorClass),
        modifier: normalModifierListConvert(target.getModifier(), errorClass),
    };
};

export type MethodDeclaration = {
    value: NormalId | undefined;
    valueType: TypeRef | 'void' | undefined;
    param: FormalParameters;
    block: NormalBlock;
};

export const methodDeclarationConvert = (
    target: MethodDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): MethodDeclaration => {
    return {
        value: normalIdOrUndefinedConvert(target.getValue(), errorClass),
        valueType: returnTypeConvert(target.getValueType(), errorClass),
        param: formalParametersOrUndefinedConvert(target.getParam(), errorClass),
        block: normalBlockOrUndefinedConvert(target.getBlock(), errorClass),
    };
};

export type PropertyDeclaration = {
    value: NormalId | undefined;
    valueType: TypeRef | undefined;
    block: PropertyBlock[] | undefined;
};

export const propertyDeclarationConvert = (
    target: PropertyDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): PropertyDeclaration => {
    const block: PropertyBlock[] = [];
    target.getBlock().forEach((item) => {
        const blockTypeClass = toTypeClass(item, isPropertyBlockType, errorClass);
        if (blockTypeClass) {
            block.push(propertyBlockConvert(blockTypeClass, errorClass));
        }
    });

    return {
        value: normalIdOrUndefinedConvert(target.getValue(), errorClass),
        valueType: typeRefOrUndefinedConvert(target.getValueType(), errorClass),
        block: block.length > 0 ? block : undefined,
    };
};

export type TypeDeclaration =
    | {
          type: string;
          value: ClassDeclaration | EnumDeclaration | InterfaceDeclaration | undefined;
          modifier: NormalModifier[] | undefined;
      }
    | undefined;

export const typeDeclarationConvert = (
    target: TypeDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): TypeDeclaration => {
    const valueTypeClass = toTypeClass(
        target.getValue(),
        (
            target,
        ): target is
            ClassDeclarationTypeClass | EnumDeclarationTypeClass | InterfaceDeclarationTypeClass =>
            isClassDeclarationType(target) ||
            isEnumDeclarationType(target) ||
            isInterfaceDeclarationType(target),
        errorClass,
    );

    const modifier = normalModifierListConvert(target.getModifier(), errorClass);
    if (valueTypeClass) {
        if (isClassDeclarationType(valueTypeClass)) {
            return {
                type: 'class',
                value: classDeclarationConvert(valueTypeClass, errorClass),
                modifier: modifier,
            };
        }
        if (isEnumDeclarationType(valueTypeClass)) {
            return {
                type: 'enum',
                value: enumDeclarationConvert(valueTypeClass, errorClass),
                modifier: modifier,
            };
        }
        if (isInterfaceDeclarationType(valueTypeClass)) {
            return {
                type: 'interface',
                value: interfaceDeclarationConvert(valueTypeClass, errorClass),
                modifier: modifier,
            };
        }
    }

    return undefined;
};
