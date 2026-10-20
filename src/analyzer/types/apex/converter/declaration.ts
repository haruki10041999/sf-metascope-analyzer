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
    SourceSlot,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeSourceNode,
    sourceField,
    sourceList,
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

export type AnonymousMemberDeclarationType = {
    type: string;
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

export const makeAnonymousMemberDeclarationRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<AnonymousMemberDeclarationTypeClass, AnonymousMemberDeclarationType> => {
    return {
        isValid: (target: unknown) =>
            isTargetTypeClass(target, isAnonymousMemberDeclarationTypeClass),
        construct: (declarationTypeClass: AnonymousMemberDeclarationTypeClass) => {
            const node = makeSourceNode(declarationTypeClass);
            const valueSource = sourceField(node, 'value');
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeMethodDeclarationRule(valueSource, errorInfo),
                makeInterfaceDeclarationRule(valueSource, errorInfo),
                makeClassDeclarationRule(valueSource, errorInfo),
                makeEnumDeclarationRule(valueSource, errorInfo),
                makePropertyDeclarationRule(valueSource, errorInfo),
                makeFieldDeclarationRule(valueSource, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: declarationTypeClass.getType(), value };
        },
    };
};

export type ClassBodyDeclarationType = {
    type: string;
    value: ValueRuleValue<MemberDeclarationType | BlockType>;
    modifier: ValueRuleValue<ModifierType>[];
    isStatic: boolean;
};

export const isClassBodyDeclarationType = typia.createIs<ClassBodyDeclarationType>();

export const makeClassBodyDeclarationRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ClassBodyDeclarationTypeClass, ClassBodyDeclarationType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isClassBodyDeclarationTypeClass),
        construct: (declarationTypeClass: ClassBodyDeclarationTypeClass) => {
            const node = makeSourceNode(declarationTypeClass);
            const valueSource = sourceField(node, 'value');
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeMemberDeclarationRule(valueSource, errorInfo),
                makeBlockRule(valueSource, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const modifierSource = sourceList(node, 'modifier');
            const modifier = declarationTypeClass
                .getModifier()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeModifierRule(modifierSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            const isStatic = declarationTypeClass.getIsStatic();

            slot(node);
            return { type: declarationTypeClass.getType(), value, modifier, isStatic };
        },
    };
};

export type ClassDeclarationType = {
    type: string;
    value: ValueRuleValue<IdType>;
    body: ValueRuleValue<ClassBodyType>;
    extend: ValueRuleValue<TypeRefType>;
    implement: ValueRuleValue<TypeListType>;
};

export const isClassDeclarationType = typia.createIs<ClassDeclarationType>();

export const makeClassDeclarationRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ClassDeclarationTypeClass, ClassDeclarationType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isClassDeclarationTypeClass),
        construct: (declarationTypeClass: ClassDeclarationTypeClass) => {
            const node = makeSourceNode(declarationTypeClass);
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeIdRule(sourceField(node, 'value')),
                makeErrorAssignRule(errorInfo),
            ]);

            const body = assignMultiClass(declarationTypeClass.getBody(), [
                makeClassBodyRule(sourceField(node, 'body'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const extend = assignMultiClass(declarationTypeClass.getExtend(), [
                makeTypeRefRule(sourceField(node, 'extend'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const implement = assignMultiClass(declarationTypeClass.getImplement(), [
                makeTypeListRule(sourceField(node, 'implement'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return { type: declarationTypeClass.getType(), value, body, extend, implement };
        },
    };
};

export type ConstructorDeclarationType = {
    type: string;
    value: ValueRuleValue<QualifiedNameType>;
    param: ValueRuleValue<FormalParametersType>;
    block: ValueRuleValue<BlockType>;
};

export const isConstructorDeclarationType = typia.createIs<ConstructorDeclarationType>();

export const makeConstructorDeclarationRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ConstructorDeclarationTypeClass, ConstructorDeclarationType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isConstructorDeclarationTypeClass),
        construct: (declarationTypeClass: ConstructorDeclarationTypeClass) => {
            const node = makeSourceNode(declarationTypeClass);
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeQualifiedNameRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const param = assignMultiClass(declarationTypeClass.getParam(), [
                makeFormalParametersRule(sourceField(node, 'param'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const block = assignMultiClass(declarationTypeClass.getBlock(), [
                makeBlockRule(sourceField(node, 'block'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return { type: declarationTypeClass.getType(), value, param, block };
        },
    };
};

export type EnumConstantsType = {
    type: string;
    value: ValueRuleValue<IdType>[];
};

export const isEnumConstantsType = typia.createIs<EnumConstantsType>();

export const makeEnumConstantsRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<EnumConstantsTypeClass, EnumConstantsType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isEnumConstantsTypeClass),
        construct: (declarationTypeClass: EnumConstantsTypeClass) => {
            const node = makeSourceNode(declarationTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = declarationTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeIdRule(valueSource(index)),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: declarationTypeClass.getType(), value };
        },
    };
};

export type EnumDeclarationType = {
    type: string;
    value: ValueRuleValue<IdType>;
    constant: ValueRuleValue<EnumConstantsType>;
};

export const isEnumDeclarationType = typia.createIs<EnumDeclarationType>();

export const makeEnumDeclarationRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<EnumDeclarationTypeClass, EnumDeclarationType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isEnumDeclarationTypeClass),
        construct: (declarationTypeClass: EnumDeclarationTypeClass) => {
            const node = makeSourceNode(declarationTypeClass);
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeIdRule(sourceField(node, 'value')),
                makeErrorAssignRule(errorInfo),
            ]);
            const constant = assignMultiClass(declarationTypeClass.getConstant(), [
                makeEnumConstantsRule(sourceField(node, 'constant'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: declarationTypeClass.getType(), value, constant };
        },
    };
};

export type FieldDeclarationType = {
    type: string;
    value: ValueRuleValue<VariableDeclaratorsType>;
    valueType: ValueRuleValue<TypeRefType>;
};

export const isFieldDeclarationType = typia.createIs<FieldDeclarationType>();

export const makeFieldDeclarationRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldDeclarationTypeClass, FieldDeclarationType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldDeclarationTypeClass),
        construct: (declarationTypeClass: FieldDeclarationTypeClass) => {
            const node = makeSourceNode(declarationTypeClass);
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeVariableDeclaratorsRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const valueType = assignMultiClass(declarationTypeClass.getValueType(), [
                makeTypeRefRule(sourceField(node, 'valueType'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return { type: declarationTypeClass.getType(), value, valueType };
        },
    };
};

export type InterfaceDeclarationType = {
    type: string;
    value: ValueRuleValue<IdType>;
    body: ValueRuleValue<InterfaceBodyType>;
    extend: ValueRuleValue<TypeListType>;
};

export const isInterfaceDeclarationType = typia.createIs<InterfaceDeclarationType>();

export const makeInterfaceDeclarationRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<InterfaceDeclarationTypeClass, InterfaceDeclarationType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isInterfaceDeclarationTypeClass),
        construct: (declarationTypeClass: InterfaceDeclarationTypeClass) => {
            const node = makeSourceNode(declarationTypeClass);
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeIdRule(sourceField(node, 'value')),
                makeErrorAssignRule(errorInfo),
            ]);

            const body = assignMultiClass(declarationTypeClass.getBody(), [
                makeInterfaceBodyRule(sourceField(node, 'body'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const extend = assignMultiClass(declarationTypeClass.getExtend(), [
                makeTypeListRule(sourceField(node, 'extend'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return { type: declarationTypeClass.getType(), value, body, extend };
        },
    };
};

export type InterfaceMethodDeclarationType = {
    type: string;
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<string | TypeRefType>;
    param: ValueRuleValue<FormalParametersType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isInterfaceMethodDeclarationType = typia.createIs<InterfaceMethodDeclarationType>();

export const makeInterfaceMethodDeclarationRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<InterfaceMethodDeclarationTypeClass, InterfaceMethodDeclarationType> => {
    return {
        isValid: (target: unknown) =>
            isTargetTypeClass(target, isInterfaceMethodDeclarationTypeClass),
        construct: (declarationTypeClass: InterfaceMethodDeclarationTypeClass) => {
            const node = makeSourceNode(declarationTypeClass);

            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeIdRule(sourceField(node, 'value')),
                makeErrorAssignRule(errorInfo),
            ]);

            const valueType = assignMultiClass(declarationTypeClass.getValueType(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeTypeRefRule(sourceField(node, 'valueType'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const param = assignMultiClass(declarationTypeClass.getParam(), [
                makeFormalParametersRule(sourceField(node, 'param'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const modifierSource = sourceList(node, 'modifier');
            const modifier = declarationTypeClass
                .getModifier()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeModifierRule(modifierSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );

            slot(node);
            return { type: declarationTypeClass.getType(), value, valueType, param, modifier };
        },
    };
};

export type LocalVariableDeclarationType = {
    type: string;
    value: ValueRuleValue<VariableDeclaratorsType>;
    valueType: ValueRuleValue<TypeRefType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isLocalVariableDeclarationType = typia.createIs<LocalVariableDeclarationType>();

export const makeLocalVariableDeclarationRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<LocalVariableDeclarationTypeClass, LocalVariableDeclarationType> => {
    return {
        isValid: (target: unknown) =>
            isTargetTypeClass(target, isLocalVariableDeclarationTypeClass),
        construct: (declarationTypeClass: LocalVariableDeclarationTypeClass) => {
            const node = makeSourceNode(declarationTypeClass);
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeVariableDeclaratorsRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const valueType = assignMultiClass(declarationTypeClass.getValueType(), [
                makeTypeRefRule(sourceField(node, 'valueType'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const modifierSource = sourceList(node, 'modifier');
            const modifier = declarationTypeClass
                .getModifier()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeModifierRule(modifierSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );

            slot(node);
            return { type: declarationTypeClass.getType(), value, valueType, modifier };
        },
    };
};

export type MemberDeclarationType = {
    type: string;
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

export const makeMemberDeclarationRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<MemberDeclarationTypeClass, MemberDeclarationType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMemberDeclarationTypeClass),
        construct: (declarationTypeClass: MemberDeclarationTypeClass) => {
            const node = makeSourceNode(declarationTypeClass);
            const valueSource = sourceField(node, 'value');
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeMethodDeclarationRule(valueSource, errorInfo),
                makeConstructorDeclarationRule(valueSource, errorInfo),
                makeInterfaceDeclarationRule(valueSource, errorInfo),
                makeClassDeclarationRule(valueSource, errorInfo),
                makeEnumDeclarationRule(valueSource, errorInfo),
                makePropertyDeclarationRule(valueSource, errorInfo),
                makeFieldDeclarationRule(valueSource, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: declarationTypeClass.getType(), value };
        },
    };
};

export type MethodDeclarationType = {
    type: string;
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<string | TypeRefType>;
    param: ValueRuleValue<FormalParametersType>;
    block: ValueRuleValue<BlockType>;
};

export const isMethodDeclarationType = typia.createIs<MethodDeclarationType>();

export const makeMethodDeclarationRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<MethodDeclarationTypeClass, MethodDeclarationType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMethodDeclarationTypeClass),
        construct: (declarationTypeClass: MethodDeclarationTypeClass) => {
            const node = makeSourceNode(declarationTypeClass);

            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeIdRule(sourceField(node, 'value')),
                makeErrorAssignRule(errorInfo),
            ]);

            const valueType = assignMultiClass(declarationTypeClass.getValueType(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeTypeRefRule(sourceField(node, 'valueType'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const param = assignMultiClass(declarationTypeClass.getParam(), [
                makeFormalParametersRule(sourceField(node, 'param'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const block = assignMultiClass(declarationTypeClass.getBlock(), [
                makeBlockRule(sourceField(node, 'block'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return { type: declarationTypeClass.getType(), value, valueType, param, block };
        },
    };
};

export type PropertyDeclarationType = {
    type: string;
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<TypeRefType>;
    block: ValueRuleValue<PropertyBlockType>[];
};

export const isPropertyDeclarationType = typia.createIs<PropertyDeclarationType>();

export const makePropertyDeclarationRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<PropertyDeclarationTypeClass, PropertyDeclarationType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isPropertyDeclarationTypeClass),
        construct: (declarationTypeClass: PropertyDeclarationTypeClass) => {
            const node = makeSourceNode(declarationTypeClass);
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeIdRule(sourceField(node, 'value')),
                makeErrorAssignRule(errorInfo),
            ]);

            const valueType = assignMultiClass(declarationTypeClass.getValueType(), [
                makeTypeRefRule(sourceField(node, 'valueType'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const blockSource = sourceList(node, 'block');
            const block = declarationTypeClass
                .getBlock()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makePropertyBlockRule(blockSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );

            slot(node);
            return { type: declarationTypeClass.getType(), value, valueType, block };
        },
    };
};

export type TriggerMemberDeclarationType = {
    type: string;
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

export const makeTriggerMemberDeclarationRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TriggerMemberDeclarationTypeClass, TriggerMemberDeclarationType> => {
    return {
        isValid: (target: unknown) =>
            isTargetTypeClass(target, isTriggerMemberDeclarationTypeClass),
        construct: (declarationTypeClass: TriggerMemberDeclarationTypeClass) => {
            const node = makeSourceNode(declarationTypeClass);
            const valueSource = sourceField(node, 'value');
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeMethodDeclarationRule(valueSource, errorInfo),
                makeInterfaceDeclarationRule(valueSource, errorInfo),
                makeClassDeclarationRule(valueSource, errorInfo),
                makeEnumDeclarationRule(valueSource, errorInfo),
                makePropertyDeclarationRule(valueSource, errorInfo),
                makeFieldDeclarationRule(valueSource, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: declarationTypeClass.getType(), value };
        },
    };
};

export type TypeDeclarationType = {
    type: string;
    value: ValueRuleValue<InterfaceDeclarationType | ClassDeclarationType | EnumDeclarationType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isTypeDeclarationType = typia.createIs<TypeDeclarationType>();

export const makeTypeDeclarationRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TypeDeclarationTypeClass, TypeDeclarationType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeDeclarationTypeClass),
        construct: (declarationTypeClass: TypeDeclarationTypeClass) => {
            const node = makeSourceNode(declarationTypeClass);
            const valueSource = sourceField(node, 'value');
            const value = assignMultiClass(declarationTypeClass.getValue(), [
                makeInterfaceDeclarationRule(valueSource, errorInfo),
                makeClassDeclarationRule(valueSource, errorInfo),
                makeEnumDeclarationRule(valueSource, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const modifierSource = sourceList(node, 'modifier');
            const modifier = declarationTypeClass
                .getModifier()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeModifierRule(modifierSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );

            slot(node);
            return { type: declarationTypeClass.getType(), value, modifier };
        },
    };
};

