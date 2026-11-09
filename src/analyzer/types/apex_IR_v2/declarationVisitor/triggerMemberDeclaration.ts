import { TriggerMemberDeclarationContext } from '@apexdevtools/apex-parser';

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

export type TriggerMemberDeclarationClassType =
    | MethodDeclarationTypeClass
    | InterfaceDeclarationTypeClass
    | ClassDeclarationTypeClass
    | EnumDeclarationTypeClass
    | PropertyDeclarationTypeClass
    | FieldDeclarationTypeClass;

export type TriggerMemberDeclarationType = TypeField<'triggerMemberDeclaration'> & {
    declaration: TriggerMemberDeclarationClassType;
};

export class TriggerMemberDeclarationTypeClass extends ApexCommonTypeClass<
    'triggerMemberDeclaration',
    TriggerMemberDeclarationType
> {
    private constructor(fields: FieldsOf<TriggerMemberDeclarationType>, sourceSpan: SourceSpan) {
        super('triggerMemberDeclaration', fields, sourceSpan);
    }

    static create(ctx: TriggerMemberDeclarationContext): TriggerMemberDeclarationTypeClass {
        let declaration: TriggerMemberDeclarationType['declaration'];
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

        return new TriggerMemberDeclarationTypeClass({ declaration }, getSourceSpan(ctx));
    }

    getDeclaration(): TriggerMemberDeclarationType['declaration'] {
        return this.getFields().declaration;
    }
}

export const isTriggerMemberDeclarationType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is TriggerMemberDeclarationTypeClass => {
    return isSpicifyApexCommonTypeClass('triggerMemberDeclaration', target);
};
