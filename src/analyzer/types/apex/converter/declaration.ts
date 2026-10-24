import {
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
    isAnonymousMemberDeclarationType as isAnonymousMemberDeclarationTypeClass,
    isClassBodyDeclarationType as isClassBodyDeclarationTypeClass,
    isClassDeclarationType as isClassDeclarationTypeClass,
    isConstructorDeclarationType as isConstructorDeclarationTypeClass,
    isEnumConstantsType as isEnumConstantsTypeClass,
    isEnumDeclarationType as isEnumDeclarationTypeClass,
    isFieldDeclarationType as isFieldDeclarationTypeClass,
    isInterfaceDeclarationType as isInterfaceDeclarationTypeClass,
    isInterfaceMethodDeclarationType as isInterfaceMethodDeclarationTypeClass,
    isLocalVariableDeclarationType as isLocalVariableDeclarationTypeClass,
    isMemberDeclarationType as isMemberDeclarationTypeClass,
    isMethodDeclarationType as isMethodDeclarationTypeClass,
    isPropertyDeclarationType as isPropertyDeclarationTypeClass,
    isTriggerMemberDeclarationType as isTriggerMemberDeclarationTypeClass,
    isTypeDeclarationType as isTypeDeclarationTypeClass,
} from '../../apex_IR';

import {
    isCommonType,
    ErrorType,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeStringAssignRule,
    makeNullAssignRule,
    makeLimitedStringAssignRule,
    makeSourceInfo,
} from './commons';
import {
    makeBlockAssignRule,
    makePropertyBlockAssignRule,
    BlockType,
    PropertyBlockType,
} from './block';
import { makeModifierAssignRule, ModifierType } from './modifier';
import { makeTypeRefAssignRule, TypeRefType } from './type';
import { makeTypeListAssignRule, TypeListType } from './list';
import { makeQualifiedNameAssignRule, QualifiedNameType } from './name';
import { makeFormalParametersAssignRule, FormalParametersType } from './parameter';
import { makeIdAssignRule, IdType } from './id';
import { makeVariableDeclaratorsAssignRule, VariableDeclaratorsType } from './variable';
import {
    makeClassBodyAssignRule,
    makeInterfaceBodyAssignRule,
    ClassBodyType,
    InterfaceBodyType,
} from './body';

export type AnonymousMemberDeclarationType = CommonType<'anonymousMemberDeclaration'> & {
    value: ValueRuleValue<
        | MethodDeclarationType
        | InterfaceDeclarationType
        | ClassDeclarationType
        | EnumDeclarationType
        | PropertyDeclarationType
        | FieldDeclarationType
    >;
};

export const isAnonymousMemberDeclarationType = (
    value: unknown,
): value is AnonymousMemberDeclarationType => {
    return isCommonType(value) && value.type === 'anonymousMemberDeclaration';
};

export const makeAnonymousMemberDeclarationAssignRule: AssignForValueRule<
    AnonymousMemberDeclarationTypeClass,
    AnonymousMemberDeclarationType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isAnonymousMemberDeclarationTypeClass),
    construct: (declarationTypeClass: AnonymousMemberDeclarationTypeClass) => {
        const value = assignMultiClass(declarationTypeClass.getValue(), [
            makeMethodDeclarationAssignRule,
            makeInterfaceDeclarationAssignRule,
            makeClassDeclarationAssignRule,
            makeEnumDeclarationAssignRule,
            makePropertyDeclarationAssignRule,
            makeFieldDeclarationAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: declarationTypeClass.getType(),
            sourceInfo: makeSourceInfo(declarationTypeClass),
            value,
        };
    },
};

export type ClassBodyDeclarationType = CommonType<'classBodyDeclaration'> & {
    value: ValueRuleValue<MemberDeclarationType | BlockType | null>;
    modifier: ValueRuleValue<ModifierType>[];
    isStatic: boolean;
};

export const isClassBodyDeclarationType = (value: unknown): value is ClassBodyDeclarationType => {
    return isCommonType(value) && value.type === 'classBodyDeclaration';
};

export const makeClassBodyDeclarationAssignRule: AssignForValueRule<
    ClassBodyDeclarationTypeClass,
    ClassBodyDeclarationType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isClassBodyDeclarationTypeClass),
    construct: (declarationTypeClass: ClassBodyDeclarationTypeClass) => {
        const value = assignMultiClass(declarationTypeClass.getValue(), [
            makeMemberDeclarationAssignRule,
            makeBlockAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const modifier = declarationTypeClass
            .getModifier()
            .map((v) => assignMultiClass(v, [makeModifierAssignRule, makeErrorAssignRule]));
        const isStatic = declarationTypeClass.getIsStatic();

        return {
            type: declarationTypeClass.getType(),
            sourceInfo: makeSourceInfo(declarationTypeClass),
            value,
            modifier,
            isStatic,
        };
    },
};

export type ClassDeclarationType = CommonType<'classDeclaration'> & {
    value: ValueRuleValue<IdType>;
    body: ValueRuleValue<ClassBodyType>;
    extend: ValueRuleValue<TypeRefType | null>;
    implement: ValueRuleValue<TypeListType | null>;
};

export const isClassDeclarationType = (value: unknown): value is ClassDeclarationType => {
    return isCommonType(value) && value.type === 'classDeclaration';
};

export const makeClassDeclarationAssignRule: AssignForValueRule<
    ClassDeclarationTypeClass,
    ClassDeclarationType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isClassDeclarationTypeClass),
    construct: (declarationTypeClass: ClassDeclarationTypeClass) => {
        const value = assignMultiClass(declarationTypeClass.getValue(), [
            makeIdAssignRule,
            makeErrorAssignRule,
        ]);

        const body = assignMultiClass(declarationTypeClass.getBody(), [
            makeClassBodyAssignRule,
            makeErrorAssignRule,
        ]);

        const extend = assignMultiClass(declarationTypeClass.getExtend(), [
            makeTypeRefAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);

        const implement = assignMultiClass(declarationTypeClass.getImplement(), [
            makeTypeListAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);

        return {
            type: declarationTypeClass.getType(),
            sourceInfo: makeSourceInfo(declarationTypeClass),
            value,
            body,
            extend,
            implement,
        };
    },
};

export type ConstructorDeclarationType = CommonType<'constructorDeclaration'> & {
    value: ValueRuleValue<QualifiedNameType>;
    param: ValueRuleValue<FormalParametersType | null>;
    block: ValueRuleValue<BlockType>;
};

export const isConstructorDeclarationType = (
    value: unknown,
): value is ConstructorDeclarationType => {
    return isCommonType(value) && value.type === 'constructorDeclaration';
};

export const makeConstructorDeclarationAssignRule: AssignForValueRule<
    ConstructorDeclarationTypeClass,
    ConstructorDeclarationType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isConstructorDeclarationTypeClass),
    construct: (declarationTypeClass: ConstructorDeclarationTypeClass) => {
        const value = assignMultiClass(declarationTypeClass.getValue(), [
            makeQualifiedNameAssignRule,
            makeErrorAssignRule,
        ]);

        const param = assignMultiClass(declarationTypeClass.getParam(), [
            makeFormalParametersAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);

        const block = assignMultiClass(declarationTypeClass.getBlock(), [
            makeBlockAssignRule,
            makeErrorAssignRule,
        ]);

        return {
            type: declarationTypeClass.getType(),
            sourceInfo: makeSourceInfo(declarationTypeClass),
            value,
            param,
            block,
        };
    },
};

export type EnumConstantsType = CommonType<'enumConstants'> & {
    value: ValueRuleValue<IdType>[];
};

export const isEnumConstantsType = (value: unknown): value is EnumConstantsType => {
    return isCommonType(value) && value.type === 'enumConstants';
};

export const makeEnumConstantsAssignRule: AssignForValueRule<
    EnumConstantsTypeClass,
    EnumConstantsType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isEnumConstantsTypeClass),
    construct: (declarationTypeClass: EnumConstantsTypeClass) => {
        const value = declarationTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeIdAssignRule, makeErrorAssignRule]));
        return {
            type: declarationTypeClass.getType(),
            sourceInfo: makeSourceInfo(declarationTypeClass),
            value,
        };
    },
};

export type EnumDeclarationType = CommonType<'enumDeclaration'> & {
    value: ValueRuleValue<IdType>;
    constant: ValueRuleValue<EnumConstantsType | null>;
};

export const isEnumDeclarationType = (value: unknown): value is EnumDeclarationType => {
    return isCommonType(value) && value.type === 'enumDeclaration';
};

export const makeEnumDeclarationAssignRule: AssignForValueRule<
    EnumDeclarationTypeClass,
    EnumDeclarationType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isEnumDeclarationTypeClass),
    construct: (declarationTypeClass: EnumDeclarationTypeClass) => {
        const value = assignMultiClass(declarationTypeClass.getValue(), [
            makeIdAssignRule,
            makeErrorAssignRule,
        ]);
        const constant = assignMultiClass(declarationTypeClass.getConstant(), [
            makeEnumConstantsAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        return {
            type: declarationTypeClass.getType(),
            sourceInfo: makeSourceInfo(declarationTypeClass),
            value,
            constant,
        };
    },
};

export type FieldDeclarationType = CommonType<'fieldDeclaration'> & {
    value: ValueRuleValue<VariableDeclaratorsType>;
    valueType: ValueRuleValue<TypeRefType>;
};

export const isFieldDeclarationType = (value: unknown): value is FieldDeclarationType => {
    return isCommonType(value) && value.type === 'fieldDeclaration';
};

export const makeFieldDeclarationAssignRule: AssignForValueRule<
    FieldDeclarationTypeClass,
    FieldDeclarationType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isFieldDeclarationTypeClass),
    construct: (declarationTypeClass: FieldDeclarationTypeClass) => {
        const value = assignMultiClass(declarationTypeClass.getValue(), [
            makeVariableDeclaratorsAssignRule,
            makeErrorAssignRule,
        ]);

        const valueType = assignMultiClass(declarationTypeClass.getValueType(), [
            makeTypeRefAssignRule,
            makeErrorAssignRule,
        ]);

        return {
            type: declarationTypeClass.getType(),
            sourceInfo: makeSourceInfo(declarationTypeClass),
            value,
            valueType,
        };
    },
};

export type InterfaceDeclarationType = CommonType<'interfaceDeclaration'> & {
    value: ValueRuleValue<IdType>;
    body: ValueRuleValue<InterfaceBodyType>;
    extend: ValueRuleValue<TypeListType | null>;
};

export const isInterfaceDeclarationType = (value: unknown): value is InterfaceDeclarationType => {
    return isCommonType(value) && value.type === 'interfaceDeclaration';
};

export const makeInterfaceDeclarationAssignRule: AssignForValueRule<
    InterfaceDeclarationTypeClass,
    InterfaceDeclarationType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isInterfaceDeclarationTypeClass),
    construct: (declarationTypeClass: InterfaceDeclarationTypeClass) => {
        const value = assignMultiClass(declarationTypeClass.getValue(), [
            makeIdAssignRule,
            makeErrorAssignRule,
        ]);

        const body = assignMultiClass(declarationTypeClass.getBody(), [
            makeInterfaceBodyAssignRule,
            makeErrorAssignRule,
        ]);

        const extend = assignMultiClass(declarationTypeClass.getExtend(), [
            makeTypeListAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);

        return {
            type: declarationTypeClass.getType(),
            sourceInfo: makeSourceInfo(declarationTypeClass),
            value,
            body,
            extend,
        };
    },
};

export type InterfaceMethodDeclarationType = CommonType<'interfaceMethodDeclaration'> & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<'void' | TypeRefType>;
    param: ValueRuleValue<FormalParametersType | null>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isInterfaceMethodDeclarationType = (
    value: unknown,
): value is InterfaceMethodDeclarationType => {
    return isCommonType(value) && value.type === 'interfaceMethodDeclaration';
};

export const makeInterfaceMethodDeclarationAssignRule: AssignForValueRule<
    InterfaceMethodDeclarationTypeClass,
    InterfaceMethodDeclarationType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isInterfaceMethodDeclarationTypeClass),
    construct: (declarationTypeClass: InterfaceMethodDeclarationTypeClass) => {
        const value = assignMultiClass(declarationTypeClass.getValue(), [
            makeIdAssignRule,
            makeErrorAssignRule,
        ]);

        const valueType = assignMultiClass(declarationTypeClass.getValueType(), [
            makeLimitedStringAssignRule(['void']),
            makeTypeRefAssignRule,
            makeErrorAssignRule,
        ]);

        const param = assignMultiClass(declarationTypeClass.getParam(), [
            makeFormalParametersAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);

        const modifier = declarationTypeClass
            .getModifier()
            .map((v) => assignMultiClass(v, [makeModifierAssignRule, makeErrorAssignRule]));

        return {
            type: declarationTypeClass.getType(),
            sourceInfo: makeSourceInfo(declarationTypeClass),
            value,
            valueType,
            param,
            modifier,
        };
    },
};

export type LocalVariableDeclarationType = CommonType<'localVariableDeclaration'> & {
    value: ValueRuleValue<VariableDeclaratorsType>;
    valueType: ValueRuleValue<TypeRefType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isLocalVariableDeclarationType = (
    value: unknown,
): value is LocalVariableDeclarationType => {
    return isCommonType(value) && value.type === 'localVariableDeclaration';
};

export const makeLocalVariableDeclarationAssignRule: AssignForValueRule<
    LocalVariableDeclarationTypeClass,
    LocalVariableDeclarationType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isLocalVariableDeclarationTypeClass),
    construct: (declarationTypeClass: LocalVariableDeclarationTypeClass) => {
        const value = assignMultiClass(declarationTypeClass.getValue(), [
            makeVariableDeclaratorsAssignRule,
            makeErrorAssignRule,
        ]);

        const valueType = assignMultiClass(declarationTypeClass.getValueType(), [
            makeTypeRefAssignRule,
            makeErrorAssignRule,
        ]);

        const modifier = declarationTypeClass
            .getModifier()
            .map((v) => assignMultiClass(v, [makeModifierAssignRule, makeErrorAssignRule]));

        return {
            type: declarationTypeClass.getType(),
            sourceInfo: makeSourceInfo(declarationTypeClass),
            value,
            valueType,
            modifier,
        };
    },
};

export type MemberDeclarationType = CommonType<'memberDeclaration'> & {
    value: ValueRuleValue<
        | MethodDeclarationType
        | ConstructorDeclarationType
        | InterfaceDeclarationType
        | ClassDeclarationType
        | EnumDeclarationType
        | PropertyDeclarationType
        | FieldDeclarationType
    >;
};

export const isMemberDeclarationType = (value: unknown): value is MemberDeclarationType => {
    return isCommonType(value) && value.type === 'memberDeclaration';
};

export const makeMemberDeclarationAssignRule: AssignForValueRule<
    MemberDeclarationTypeClass,
    MemberDeclarationType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isMemberDeclarationTypeClass),
    construct: (declarationTypeClass: MemberDeclarationTypeClass) => {
        const value = assignMultiClass(declarationTypeClass.getValue(), [
            makeMethodDeclarationAssignRule,
            makeConstructorDeclarationAssignRule,
            makeInterfaceDeclarationAssignRule,
            makeClassDeclarationAssignRule,
            makeEnumDeclarationAssignRule,
            makePropertyDeclarationAssignRule,
            makeFieldDeclarationAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: declarationTypeClass.getType(),
            sourceInfo: makeSourceInfo(declarationTypeClass),
            value,
        };
    },
};

export type MethodDeclarationType = CommonType<'methodDeclaration'> & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<'void' | TypeRefType>;
    param: ValueRuleValue<FormalParametersType | null>;
    block: ValueRuleValue<BlockType | null>;
};

export const isMethodDeclarationType = (value: unknown): value is MethodDeclarationType => {
    return isCommonType(value) && value.type === 'methodDeclaration';
};

export const makeMethodDeclarationAssignRule: AssignForValueRule<
    MethodDeclarationTypeClass,
    MethodDeclarationType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isMethodDeclarationTypeClass),
    construct: (declarationTypeClass: MethodDeclarationTypeClass) => {
        const value = assignMultiClass(declarationTypeClass.getValue(), [
            makeIdAssignRule,
            makeErrorAssignRule,
        ]);

        const valueType = assignMultiClass(declarationTypeClass.getValueType(), [
            makeLimitedStringAssignRule(['void']),
            makeTypeRefAssignRule,
            makeErrorAssignRule,
        ]);

        const param = assignMultiClass(declarationTypeClass.getParam(), [
            makeFormalParametersAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);

        const block = assignMultiClass(declarationTypeClass.getBlock(), [
            makeBlockAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);

        return {
            type: declarationTypeClass.getType(),
            sourceInfo: makeSourceInfo(declarationTypeClass),
            value,
            valueType,
            param,
            block,
        };
    },
};

export type PropertyDeclarationType = CommonType<'propertyDeclaration'> & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<TypeRefType>;
    block: ValueRuleValue<PropertyBlockType>[];
};

export const isPropertyDeclarationType = (value: unknown): value is PropertyDeclarationType => {
    return isCommonType(value) && value.type === 'propertyDeclaration';
};

export const makePropertyDeclarationAssignRule: AssignForValueRule<
    PropertyDeclarationTypeClass,
    PropertyDeclarationType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isPropertyDeclarationTypeClass),
    construct: (declarationTypeClass: PropertyDeclarationTypeClass) => {
        const value = assignMultiClass(declarationTypeClass.getValue(), [
            makeIdAssignRule,
            makeErrorAssignRule,
        ]);

        const valueType = assignMultiClass(declarationTypeClass.getValueType(), [
            makeTypeRefAssignRule,
            makeErrorAssignRule,
        ]);

        const block = declarationTypeClass
            .getBlock()
            .map((v) => assignMultiClass(v, [makePropertyBlockAssignRule, makeErrorAssignRule]));

        return {
            type: declarationTypeClass.getType(),
            sourceInfo: makeSourceInfo(declarationTypeClass),
            value,
            valueType,
            block,
        };
    },
};

export type TriggerMemberDeclarationType = CommonType<'triggerMemberDeclaration'> & {
    value: ValueRuleValue<
        | MethodDeclarationType
        | InterfaceDeclarationType
        | ClassDeclarationType
        | EnumDeclarationType
        | PropertyDeclarationType
        | FieldDeclarationType
    >;
};

export const isTriggerMemberDeclarationType = (
    value: unknown,
): value is TriggerMemberDeclarationType => {
    return isCommonType(value) && value.type === 'triggerMemberDeclaration';
};

export const makeTriggerMemberDeclarationAssignRule: AssignForValueRule<
    TriggerMemberDeclarationTypeClass,
    TriggerMemberDeclarationType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isTriggerMemberDeclarationTypeClass),
    construct: (declarationTypeClass: TriggerMemberDeclarationTypeClass) => {
        const value = assignMultiClass(declarationTypeClass.getValue(), [
            makeMethodDeclarationAssignRule,
            makeInterfaceDeclarationAssignRule,
            makeClassDeclarationAssignRule,
            makeEnumDeclarationAssignRule,
            makePropertyDeclarationAssignRule,
            makeFieldDeclarationAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: declarationTypeClass.getType(),
            sourceInfo: makeSourceInfo(declarationTypeClass),
            value,
        };
    },
};

export type TypeDeclarationType = CommonType<'typeDeclaration'> & {
    value: ValueRuleValue<InterfaceDeclarationType | ClassDeclarationType | EnumDeclarationType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isTypeDeclarationType = (value: unknown): value is TypeDeclarationType => {
    return isCommonType(value) && value.type === 'typeDeclaration';
};

export const makeTypeDeclarationAssignRule: AssignForValueRule<
    TypeDeclarationTypeClass,
    TypeDeclarationType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isTypeDeclarationTypeClass),
    construct: (declarationTypeClass: TypeDeclarationTypeClass) => {
        const value = assignMultiClass(declarationTypeClass.getValue(), [
            makeInterfaceDeclarationAssignRule,
            makeClassDeclarationAssignRule,
            makeEnumDeclarationAssignRule,
            makeErrorAssignRule,
        ]);

        const modifier = declarationTypeClass
            .getModifier()
            .map((v) => assignMultiClass(v, [makeModifierAssignRule, makeErrorAssignRule]));

        return {
            type: declarationTypeClass.getType(),
            sourceInfo: makeSourceInfo(declarationTypeClass),
            value,
            modifier,
        };
    },
};
