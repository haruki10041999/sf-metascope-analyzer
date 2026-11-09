import { MemberDeclarationContext } from '@apexdevtools/apex-parser';

import { MethodDeclarationTypeClass } from './methodDeclaration';
import { ConstructorDeclarationTypeClass } from './constructorDeclaration';
import { InterfaceDeclarationTypeClass } from './interfaceDeclaration';
import { ClassDeclarationTypeClass } from './classDeclaration';
import { EnumDeclarationTypeClass } from './enumDeclaration';
import { PropertyDeclarationTypeClass } from './propertyDeclaration';
import { FieldDeclarationTypeClass } from './fieldDeclaration';

import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type MemberDeclarationClassType =
    | MethodDeclarationTypeClass
    | ConstructorDeclarationTypeClass
    | InterfaceDeclarationTypeClass
    | ClassDeclarationTypeClass
    | EnumDeclarationTypeClass
    | PropertyDeclarationTypeClass
    | FieldDeclarationTypeClass;

export type MemberDeclarationType = TypeField<'memberDeclaration'> & {
    declaration: MemberDeclarationClassType;
};

export class MemberDeclarationTypeClass extends ApexCommonTypeClass<
    'memberDeclaration',
    MemberDeclarationType
> {
    private constructor(fields: FieldsOf<MemberDeclarationType>, sourceSpan: SourceSpan) {
        super('memberDeclaration', fields, sourceSpan);
    }

    static create(ctx: MemberDeclarationContext): MemberDeclarationTypeClass {
        let declaration: MemberDeclarationType['declaration'];
        if (ctx.methodDeclaration()) {
            declaration = createNode(
                ctx.methodDeclaration(),
                (c) => MethodDeclarationTypeClass.create(c),
                'methodDeclaration',
            );
        } else if (ctx.constructorDeclaration()) {
            declaration = createNode(
                ctx.constructorDeclaration(),
                (c) => ConstructorDeclarationTypeClass.create(c),
                'constructorDeclaration',
            );
        } else if (ctx.interfaceDeclaration()) {
            declaration = createNode(
                ctx.interfaceDeclaration(),
                (c) => InterfaceDeclarationTypeClass.create(c),
                'interfaceDeclaration',
            );
        } else if (ctx.classDeclaration()) {
            declaration = createNode(
                ctx.classDeclaration(),
                (c) => ClassDeclarationTypeClass.create(c),
                'classDeclaration',
            );
        } else if (ctx.enumDeclaration()) {
            declaration = createNode(
                ctx.enumDeclaration(),
                (c) => EnumDeclarationTypeClass.create(c),
                'enumDeclaration',
            );
        } else if (ctx.propertyDeclaration()) {
            declaration = createNode(
                ctx.propertyDeclaration(),
                (c) => PropertyDeclarationTypeClass.create(c),
                'propertyDeclaration',
            );
        } else {
            declaration = createNode(
                ctx.fieldDeclaration(),
                (c) => FieldDeclarationTypeClass.create(c),
                'fieldDeclaration',
            );
        }

        return new MemberDeclarationTypeClass({ declaration }, getSourceSpan(ctx));
    }

    getDeclaration(): MemberDeclarationType['declaration'] {
        return this.getFields().declaration;
    }
}

export const isMemberDeclarationType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is MemberDeclarationTypeClass => {
    return isSpicifyApexCommonTypeClass('memberDeclaration', target);
};
