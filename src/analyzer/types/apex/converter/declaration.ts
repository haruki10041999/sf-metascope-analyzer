import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { BlockType, PropertyBlockType } from './block';
import { ModifierType } from './modifier';
import { TypeRefType } from './type';
import { TypeListType } from './list';
import { QualifiedNameType } from './name';
import { FormalParametersType } from './parameter';
import { IdType } from './id';
import { VariableDeclaratorsType } from './variable';
import { ClassBodyType, InterfaceBodyType } from './body';

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

export type ClassBodyDeclarationType = CommonType<'classBodyDeclaration'> & {
    value: ValueRuleValue<MemberDeclarationType | BlockType | null>;
    modifier: ValueRuleValue<ModifierType>[];
    isStatic: boolean;
};

export const isClassBodyDeclarationType = (value: unknown): value is ClassBodyDeclarationType => {
    return isCommonType(value) && value.type === 'classBodyDeclaration';
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

export type EnumConstantsType = CommonType<'enumConstants'> & {
    value: ValueRuleValue<IdType>[];
};

export const isEnumConstantsType = (value: unknown): value is EnumConstantsType => {
    return isCommonType(value) && value.type === 'enumConstants';
};

export type EnumDeclarationType = CommonType<'enumDeclaration'> & {
    value: ValueRuleValue<IdType>;
    constant: ValueRuleValue<EnumConstantsType | null>;
};

export const isEnumDeclarationType = (value: unknown): value is EnumDeclarationType => {
    return isCommonType(value) && value.type === 'enumDeclaration';
};

export type FieldDeclarationType = CommonType<'fieldDeclaration'> & {
    value: ValueRuleValue<VariableDeclaratorsType>;
    valueType: ValueRuleValue<TypeRefType>;
};

export const isFieldDeclarationType = (value: unknown): value is FieldDeclarationType => {
    return isCommonType(value) && value.type === 'fieldDeclaration';
};

export type InterfaceDeclarationType = CommonType<'interfaceDeclaration'> & {
    value: ValueRuleValue<IdType>;
    body: ValueRuleValue<InterfaceBodyType>;
    extend: ValueRuleValue<TypeListType | null>;
};

export const isInterfaceDeclarationType = (value: unknown): value is InterfaceDeclarationType => {
    return isCommonType(value) && value.type === 'interfaceDeclaration';
};

export type InterfaceMethodDeclarationType = CommonType<'interfaceMethodDeclaration'> & {
    value: ValueRuleValue<IdType>;
} & ({ valueType: 'void' } | { valueType: ValueRuleValue<TypeRefType> }) & {
        param: ValueRuleValue<FormalParametersType | null>;
        modifier: ValueRuleValue<ModifierType>[];
    };

export const isInterfaceMethodDeclarationType = (
    value: unknown,
): value is InterfaceMethodDeclarationType => {
    return isCommonType(value) && value.type === 'interfaceMethodDeclaration';
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

export type MethodDeclarationType = CommonType<'methodDeclaration'> & {
    value: ValueRuleValue<IdType>;
} & ({ valueType: 'void' } | { valueType: ValueRuleValue<TypeRefType> }) & {
        param: ValueRuleValue<FormalParametersType | null>;
        block: ValueRuleValue<BlockType | null>;
    };

export const isMethodDeclarationType = (value: unknown): value is MethodDeclarationType => {
    return isCommonType(value) && value.type === 'methodDeclaration';
};

export type PropertyDeclarationType = CommonType<'propertyDeclaration'> & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<TypeRefType>;
    block: ValueRuleValue<PropertyBlockType>[];
};

export const isPropertyDeclarationType = (value: unknown): value is PropertyDeclarationType => {
    return isCommonType(value) && value.type === 'propertyDeclaration';
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

export type TypeDeclarationType = CommonType<'typeDeclaration'> & {
    value: ValueRuleValue<InterfaceDeclarationType | ClassDeclarationType | EnumDeclarationType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isTypeDeclarationType = (value: unknown): value is TypeDeclarationType => {
    return isCommonType(value) && value.type === 'typeDeclaration';
};
