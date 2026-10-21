import typia from 'typia';

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
    ErrorInfo,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeStringAssignRule,
    makeNullAssignRule,
    makeSourceInfo,
} from './commons';
import { makeBlockRule, makePropertyBlockRule, BlockType, PropertyBlockType } from './block';
import { makeModifierRule, ModifierType } from './modifier';
import { makeTypeRefRule, TypeRefType } from './type';
import { makeTypeListRule, TypeListType } from './list';
import { makeQualifiedNameRule, QualifiedNameType } from './name';
import { makeFormalParametersRule, FormalParametersType } from './parameter';
import { makeIdRule, IdType } from './id';
import { makeVariableDeclaratorsRule, VariableDeclaratorsType } from './variable';
import { makeClassBodyRule, makeInterfaceBodyRule, ClassBodyType, InterfaceBodyType } from './body';

export type AnonymousMemberDeclarationType = CommonType & {
    value: ValueRuleValue<
        | MethodDeclarationType
        | InterfaceDeclarationType
        | ClassDeclarationType
        | EnumDeclarationType
        | PropertyDeclarationType
        | FieldDeclarationType
    >;
};

export const isAnonymousMemberDeclarationType = typia.createIs<AnonymousMemberDeclarationType>();

export const makeAnonymousMemberDeclarationRule = (): AssignForValueRule<
    AnonymousMemberDeclarationTypeClass,
    AnonymousMemberDeclarationType
> => {
    return {
        isValid: (target: unknown) =>
            isTargetTypeClass(target, isAnonymousMemberDeclarationTypeClass),
        construct: (declarationTypeClass: AnonymousMemberDeclarationTypeClass) => {
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeMethodDeclarationRule(),
                makeInterfaceDeclarationRule(),
                makeClassDeclarationRule(),
                makeEnumDeclarationRule(),
                makePropertyDeclarationRule(),
                makeFieldDeclarationRule(),
                makeErrorAssignRule,
            ]);
            return {
                type: declarationTypeClass.getType(),
                sourceInfo: makeSourceInfo(declarationTypeClass),
                value,
            };
        },
    };
};

export type ClassBodyDeclarationType = CommonType & {
    value: ValueRuleValue<MemberDeclarationType | BlockType | null>;
    modifier: ValueRuleValue<ModifierType>[];
    isStatic: boolean;
};

export const isClassBodyDeclarationType = typia.createIs<ClassBodyDeclarationType>();

export const makeClassBodyDeclarationRule = (): AssignForValueRule<
    ClassBodyDeclarationTypeClass,
    ClassBodyDeclarationType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isClassBodyDeclarationTypeClass),
        construct: (declarationTypeClass: ClassBodyDeclarationTypeClass) => {
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeMemberDeclarationRule(),
                makeBlockRule(),
                makeErrorAssignRule,
                makeNullAssignRule,
            ]);
            const modifier = declarationTypeClass
                .getModifier()
                .map((v) => assignMultiClass(v, [makeModifierRule(), makeErrorAssignRule]));
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
};

export type ClassDeclarationType = CommonType & {
    value: ValueRuleValue<IdType>;
    body: ValueRuleValue<ClassBodyType>;
    extend: ValueRuleValue<TypeRefType | null>;
    implement: ValueRuleValue<TypeListType | null>;
};

export const isClassDeclarationType = typia.createIs<ClassDeclarationType>();

export const makeClassDeclarationRule = (): AssignForValueRule<
    ClassDeclarationTypeClass,
    ClassDeclarationType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isClassDeclarationTypeClass),
        construct: (declarationTypeClass: ClassDeclarationTypeClass) => {
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeIdRule(),
                makeErrorAssignRule,
            ]);

            const body = assignMultiClass(declarationTypeClass.getBody(), [
                makeClassBodyRule(),
                makeErrorAssignRule,
            ]);

            const extend = assignMultiClass(declarationTypeClass.getExtend(), [
                makeTypeRefRule(),
                makeErrorAssignRule,
                makeNullAssignRule,
            ]);

            const implement = assignMultiClass(declarationTypeClass.getImplement(), [
                makeTypeListRule(),
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
};

export type ConstructorDeclarationType = CommonType & {
    value: ValueRuleValue<QualifiedNameType>;
    param: ValueRuleValue<FormalParametersType | null>;
    block: ValueRuleValue<BlockType>;
};

export const isConstructorDeclarationType = typia.createIs<ConstructorDeclarationType>();

export const makeConstructorDeclarationRule = (): AssignForValueRule<
    ConstructorDeclarationTypeClass,
    ConstructorDeclarationType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isConstructorDeclarationTypeClass),
        construct: (declarationTypeClass: ConstructorDeclarationTypeClass) => {
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeQualifiedNameRule(),
                makeErrorAssignRule,
            ]);

            const param = assignMultiClass(declarationTypeClass.getParam(), [
                makeFormalParametersRule(),
                makeErrorAssignRule,
                makeNullAssignRule,
            ]);

            const block = assignMultiClass(declarationTypeClass.getBlock(), [
                makeBlockRule(),
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
};

export type EnumConstantsType = CommonType & {
    value: ValueRuleValue<IdType>[];
};

export const isEnumConstantsType = typia.createIs<EnumConstantsType>();

export const makeEnumConstantsRule = (): AssignForValueRule<
    EnumConstantsTypeClass,
    EnumConstantsType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isEnumConstantsTypeClass),
        construct: (declarationTypeClass: EnumConstantsTypeClass) => {
            const value = declarationTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeIdRule(), makeErrorAssignRule]));
            return {
                type: declarationTypeClass.getType(),
                sourceInfo: makeSourceInfo(declarationTypeClass),
                value,
            };
        },
    };
};

export type EnumDeclarationType = CommonType & {
    value: ValueRuleValue<IdType>;
    constant: ValueRuleValue<EnumConstantsType | null>;
};

export const isEnumDeclarationType = typia.createIs<EnumDeclarationType>();

export const makeEnumDeclarationRule = (): AssignForValueRule<
    EnumDeclarationTypeClass,
    EnumDeclarationType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isEnumDeclarationTypeClass),
        construct: (declarationTypeClass: EnumDeclarationTypeClass) => {
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeIdRule(),
                makeErrorAssignRule,
            ]);
            const constant = assignMultiClass(declarationTypeClass.getConstant(), [
                makeEnumConstantsRule(),
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
};

export type FieldDeclarationType = CommonType & {
    value: ValueRuleValue<VariableDeclaratorsType>;
    valueType: ValueRuleValue<TypeRefType>;
};

export const isFieldDeclarationType = typia.createIs<FieldDeclarationType>();

export const makeFieldDeclarationRule = (): AssignForValueRule<
    FieldDeclarationTypeClass,
    FieldDeclarationType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldDeclarationTypeClass),
        construct: (declarationTypeClass: FieldDeclarationTypeClass) => {
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeVariableDeclaratorsRule(),
                makeErrorAssignRule,
            ]);

            const valueType = assignMultiClass(declarationTypeClass.getValueType(), [
                makeTypeRefRule(),
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
};

export type InterfaceDeclarationType = CommonType & {
    value: ValueRuleValue<IdType>;
    body: ValueRuleValue<InterfaceBodyType>;
    extend: ValueRuleValue<TypeListType | null>;
};

export const isInterfaceDeclarationType = typia.createIs<InterfaceDeclarationType>();

export const makeInterfaceDeclarationRule = (): AssignForValueRule<
    InterfaceDeclarationTypeClass,
    InterfaceDeclarationType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isInterfaceDeclarationTypeClass),
        construct: (declarationTypeClass: InterfaceDeclarationTypeClass) => {
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeIdRule(),
                makeErrorAssignRule,
            ]);

            const body = assignMultiClass(declarationTypeClass.getBody(), [
                makeInterfaceBodyRule(),
                makeErrorAssignRule,
            ]);

            const extend = assignMultiClass(declarationTypeClass.getExtend(), [
                makeTypeListRule(),
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
};

export type InterfaceMethodDeclarationType = CommonType & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<string | TypeRefType>;
    param: ValueRuleValue<FormalParametersType | null>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isInterfaceMethodDeclarationType = typia.createIs<InterfaceMethodDeclarationType>();

export const makeInterfaceMethodDeclarationRule = (): AssignForValueRule<
    InterfaceMethodDeclarationTypeClass,
    InterfaceMethodDeclarationType
> => {
    return {
        isValid: (target: unknown) =>
            isTargetTypeClass(target, isInterfaceMethodDeclarationTypeClass),
        construct: (declarationTypeClass: InterfaceMethodDeclarationTypeClass) => {
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeIdRule(),
                makeErrorAssignRule,
            ]);

            const valueType = assignMultiClass(declarationTypeClass.getValueType(), [
                makeStringAssignRule,
                makeTypeRefRule(),
                makeErrorAssignRule,
            ]);

            const param = assignMultiClass(declarationTypeClass.getParam(), [
                makeFormalParametersRule(),
                makeErrorAssignRule,
                makeNullAssignRule,
            ]);

            const modifier = declarationTypeClass
                .getModifier()
                .map((v) => assignMultiClass(v, [makeModifierRule(), makeErrorAssignRule]));

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
};

export type LocalVariableDeclarationType = CommonType & {
    value: ValueRuleValue<VariableDeclaratorsType>;
    valueType: ValueRuleValue<TypeRefType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isLocalVariableDeclarationType = typia.createIs<LocalVariableDeclarationType>();

export const makeLocalVariableDeclarationRule = (): AssignForValueRule<
    LocalVariableDeclarationTypeClass,
    LocalVariableDeclarationType
> => {
    return {
        isValid: (target: unknown) =>
            isTargetTypeClass(target, isLocalVariableDeclarationTypeClass),
        construct: (declarationTypeClass: LocalVariableDeclarationTypeClass) => {
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeVariableDeclaratorsRule(),
                makeErrorAssignRule,
            ]);

            const valueType = assignMultiClass(declarationTypeClass.getValueType(), [
                makeTypeRefRule(),
                makeErrorAssignRule,
            ]);

            const modifier = declarationTypeClass
                .getModifier()
                .map((v) => assignMultiClass(v, [makeModifierRule(), makeErrorAssignRule]));

            return {
                type: declarationTypeClass.getType(),
                sourceInfo: makeSourceInfo(declarationTypeClass),
                value,
                valueType,
                modifier,
            };
        },
    };
};

export type MemberDeclarationType = CommonType & {
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

export const isMemberDeclarationType = typia.createIs<MemberDeclarationType>();

export const makeMemberDeclarationRule = (): AssignForValueRule<
    MemberDeclarationTypeClass,
    MemberDeclarationType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMemberDeclarationTypeClass),
        construct: (declarationTypeClass: MemberDeclarationTypeClass) => {
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeMethodDeclarationRule(),
                makeConstructorDeclarationRule(),
                makeInterfaceDeclarationRule(),
                makeClassDeclarationRule(),
                makeEnumDeclarationRule(),
                makePropertyDeclarationRule(),
                makeFieldDeclarationRule(),
                makeErrorAssignRule,
            ]);
            return {
                type: declarationTypeClass.getType(),
                sourceInfo: makeSourceInfo(declarationTypeClass),
                value,
            };
        },
    };
};

export type MethodDeclarationType = CommonType & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<string | TypeRefType>;
    param: ValueRuleValue<FormalParametersType | null>;
    block: ValueRuleValue<BlockType | null>;
};

export const isMethodDeclarationType = typia.createIs<MethodDeclarationType>();

export const makeMethodDeclarationRule = (): AssignForValueRule<
    MethodDeclarationTypeClass,
    MethodDeclarationType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMethodDeclarationTypeClass),
        construct: (declarationTypeClass: MethodDeclarationTypeClass) => {
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeIdRule(),
                makeErrorAssignRule,
            ]);

            const valueType = assignMultiClass(declarationTypeClass.getValueType(), [
                makeStringAssignRule,
                makeTypeRefRule(),
                makeErrorAssignRule,
            ]);

            const param = assignMultiClass(declarationTypeClass.getParam(), [
                makeFormalParametersRule(),
                makeErrorAssignRule,
                makeNullAssignRule,
            ]);

            const block = assignMultiClass(declarationTypeClass.getBlock(), [
                makeBlockRule(),
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
};

export type PropertyDeclarationType = CommonType & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<TypeRefType>;
    block: ValueRuleValue<PropertyBlockType>[];
};

export const isPropertyDeclarationType = typia.createIs<PropertyDeclarationType>();

export const makePropertyDeclarationRule = (): AssignForValueRule<
    PropertyDeclarationTypeClass,
    PropertyDeclarationType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isPropertyDeclarationTypeClass),
        construct: (declarationTypeClass: PropertyDeclarationTypeClass) => {
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeIdRule(),
                makeErrorAssignRule,
            ]);

            const valueType = assignMultiClass(declarationTypeClass.getValueType(), [
                makeTypeRefRule(),
                makeErrorAssignRule,
            ]);

            const block = declarationTypeClass
                .getBlock()
                .map((v) => assignMultiClass(v, [makePropertyBlockRule(), makeErrorAssignRule]));

            return {
                type: declarationTypeClass.getType(),
                sourceInfo: makeSourceInfo(declarationTypeClass),
                value,
                valueType,
                block,
            };
        },
    };
};

export type TriggerMemberDeclarationType = CommonType & {
    value: ValueRuleValue<
        | MethodDeclarationType
        | InterfaceDeclarationType
        | ClassDeclarationType
        | EnumDeclarationType
        | PropertyDeclarationType
        | FieldDeclarationType
    >;
};

export const isTriggerMemberDeclarationType = typia.createIs<TriggerMemberDeclarationType>();

export const makeTriggerMemberDeclarationRule = (): AssignForValueRule<
    TriggerMemberDeclarationTypeClass,
    TriggerMemberDeclarationType
> => {
    return {
        isValid: (target: unknown) =>
            isTargetTypeClass(target, isTriggerMemberDeclarationTypeClass),
        construct: (declarationTypeClass: TriggerMemberDeclarationTypeClass) => {
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeMethodDeclarationRule(),
                makeInterfaceDeclarationRule(),
                makeClassDeclarationRule(),
                makeEnumDeclarationRule(),
                makePropertyDeclarationRule(),
                makeFieldDeclarationRule(),
                makeErrorAssignRule,
            ]);
            return {
                type: declarationTypeClass.getType(),
                sourceInfo: makeSourceInfo(declarationTypeClass),
                value,
            };
        },
    };
};

export type TypeDeclarationType = CommonType & {
    value: ValueRuleValue<InterfaceDeclarationType | ClassDeclarationType | EnumDeclarationType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isTypeDeclarationType = typia.createIs<TypeDeclarationType>();

export const makeTypeDeclarationRule = (): AssignForValueRule<
    TypeDeclarationTypeClass,
    TypeDeclarationType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeDeclarationTypeClass),
        construct: (declarationTypeClass: TypeDeclarationTypeClass) => {
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeInterfaceDeclarationRule(),
                makeClassDeclarationRule(),
                makeEnumDeclarationRule(),
                makeErrorAssignRule,
            ]);

            const modifier = declarationTypeClass
                .getModifier()
                .map((v) => assignMultiClass(v, [makeModifierRule(), makeErrorAssignRule]));

            return {
                type: declarationTypeClass.getType(),
                sourceInfo: makeSourceInfo(declarationTypeClass),
                value,
                modifier,
            };
        },
    };
};

