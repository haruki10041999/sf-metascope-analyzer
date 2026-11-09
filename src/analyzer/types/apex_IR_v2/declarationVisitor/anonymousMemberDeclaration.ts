import { AnonymousMemberDeclarationContext } from '@apexdevtools/apex-parser';

import { MethodDeclarationTypeClass } from './methodDeclaration';
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

export type AnonymousMemberDeclarationClassType =
    | MethodDeclarationTypeClass
    | InterfaceDeclarationTypeClass
    | ClassDeclarationTypeClass
    | EnumDeclarationTypeClass
    | PropertyDeclarationTypeClass
    | FieldDeclarationTypeClass;

export type AnonymousMemberDeclarationType = TypeField<'anonymousMemberDeclaration'> & {
    declaration: AnonymousMemberDeclarationClassType;
};

export class AnonymousMemberDeclarationTypeClass extends ApexCommonTypeClass<
    'anonymousMemberDeclaration',
    AnonymousMemberDeclarationType
> {
    private constructor(fields: FieldsOf<AnonymousMemberDeclarationType>, sourceSpan: SourceSpan) {
        super('anonymousMemberDeclaration', fields, sourceSpan);
    }

    static create(ctx: AnonymousMemberDeclarationContext): AnonymousMemberDeclarationTypeClass {
        let declaration: AnonymousMemberDeclarationType['declaration'];
        if (ctx.methodDeclaration()) {
            declaration = createNode(
                ctx.methodDeclaration(),
                (c) => MethodDeclarationTypeClass.create(c),
                'methodDeclaration',
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

        return new AnonymousMemberDeclarationTypeClass({ declaration }, getSourceSpan(ctx));
    }

    getDeclaration(): AnonymousMemberDeclarationType['declaration'] {
        return this.getFields().declaration;
    }
}

export const isAnonymousMemberDeclarationType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is AnonymousMemberDeclarationTypeClass => {
    return isSpicifyApexCommonTypeClass('anonymousMemberDeclaration', target);
};
