import typia from 'typia';

import {
    MemberDeclarationClass,
    AnonymousTriggerMemberDeclarationClass,
    TypeDeclarationClass,
    isMethodDeclarationElementClass,
    isPropertyDeclarationElementClass,
    isFieldDeclarationElementClass,
    isEnumDeclarationElementClass,
    isConstructorDeclarationElementClass,
    isInterfaceDeclarationElementClass,
    isClassDeclarationElementClass,
} from '../converter';

import { ModifierType, makeModifierType } from '../modifier';
import { MethodField, makeMethodField } from './method';
import { PropertyField, makePropertyField } from './property';
import { FieldField, makeFieldField } from './field';
import { EnumField, makeEnumField } from './enum';
import { ConstructorField, makeConstructorField } from './constructor';
import { InterfaceField, makeInterfaceField } from './interface';
import { ClassField, makeClassField } from './class';

export type MemberType =
    | MethodField
    | PropertyField
    | FieldField
    | EnumField
    | ConstructorField
    | InterfaceField
    | ClassField;

export const isMemberType = typia.createIs<MemberType>();

export type AnonymousTriggerMemberType =
    MethodField | PropertyField | FieldField | EnumField | InterfaceField | ClassField;

export const isAnonymousTriggerMemberType = typia.createIs<AnonymousTriggerMemberType>();

export type TypeDeclarationType = { modifier?: ModifierType } & (
    EnumField | InterfaceField | ClassField
);
export const isTypeDeclarationType = typia.createIs<TypeDeclarationType>();

export const makeMemberType = (
    memberDeclaration: MemberDeclarationClass,
): MemberType | undefined => {
    const elementClass = memberDeclaration.getValue();

    if (elementClass) {
        if (isMethodDeclarationElementClass(elementClass)) {
            return makeMethodField(elementClass.getDeclaration());
        }

        if (isPropertyDeclarationElementClass(elementClass)) {
            return makePropertyField(elementClass.getDeclaration());
        }

        if (isFieldDeclarationElementClass(elementClass)) {
            return makeFieldField(elementClass.getDeclaration());
        }

        if (isEnumDeclarationElementClass(elementClass)) {
            return makeEnumField(elementClass.getDeclaration());
        }

        if (isConstructorDeclarationElementClass(elementClass)) {
            return makeConstructorField(elementClass.getDeclaration());
        }

        if (isInterfaceDeclarationElementClass(elementClass)) {
            return makeInterfaceField(elementClass.getDeclaration());
        }

        if (isClassDeclarationElementClass(elementClass)) {
            return makeClassField(elementClass.getDeclaration());
        }
    }

    return undefined;
};

export const makeAnonymousTriggerMemberType = (
    anonymousTriggerMember: AnonymousTriggerMemberDeclarationClass,
): AnonymousTriggerMemberType | undefined => {
    const elementClass = anonymousTriggerMember.getValue();

    if (elementClass) {
        if (isMethodDeclarationElementClass(elementClass)) {
            return makeMethodField(elementClass.getDeclaration());
        }

        if (isPropertyDeclarationElementClass(elementClass)) {
            return makePropertyField(elementClass.getDeclaration());
        }

        if (isFieldDeclarationElementClass(elementClass)) {
            return makeFieldField(elementClass.getDeclaration());
        }

        if (isEnumDeclarationElementClass(elementClass)) {
            return makeEnumField(elementClass.getDeclaration());
        }

        if (isInterfaceDeclarationElementClass(elementClass)) {
            return makeInterfaceField(elementClass.getDeclaration());
        }

        if (isClassDeclarationElementClass(elementClass)) {
            return makeClassField(elementClass.getDeclaration());
        }
    }
    return undefined;
};

export const makeTypeDeclarationType = (
    typeDeclaration: TypeDeclarationClass,
): TypeDeclarationType | undefined => {
    const modifier = makeModifierType(typeDeclaration.getModifier());

    const elementClass = typeDeclaration.getValue();

    if (elementClass) {
        if (isEnumDeclarationElementClass(elementClass)) {
            const field = makeEnumField(elementClass.getDeclaration());
            if (field) {
                const typeDeclarationType: TypeDeclarationType = {
                    ...field,
                };

                if (modifier) {
                    typeDeclarationType.modifier = modifier;
                }

                return typeDeclarationType;
            }
        }

        if (isInterfaceDeclarationElementClass(elementClass)) {
            const field = makeInterfaceField(elementClass.getDeclaration());
            if (field) {
                const typeDeclarationType: TypeDeclarationType = {
                    ...field,
                };

                if (modifier) {
                    typeDeclarationType.modifier = modifier;
                }

                return typeDeclarationType;
            }
        }

        if (isClassDeclarationElementClass(elementClass)) {
            const field = makeClassField(elementClass.getDeclaration());
            if (field) {
                const typeDeclarationType: TypeDeclarationType = {
                    ...field,
                };

                if (modifier) {
                    typeDeclarationType.modifier = modifier;
                }

                return typeDeclarationType;
            }
        }
    }

    return undefined;
};

