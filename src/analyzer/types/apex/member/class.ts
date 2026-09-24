import {
    ClassDeclarationContext,
    ClassBodyContext,
    ClassBodyDeclarationContext,
} from '@apexdevtools/apex-parser';

import { MemberField, makeMemberField } from '.';

import { ModifierField, makeModifierField } from '../modifer';
import { TypeField, makeTypeField } from '../type';
import { StatementField, makeStatementField } from '../statement';

export type ClassMemberType = {
    type: 'class';
    name: string;
    members: {
        member: MemberField;
        modifier?: ModifierField[];
    }[];
    extends?: TypeField;
    implements?: TypeField[];
    initializerBlockStatement?: { statements: StatementField[]; isStatic: boolean };
};

export const makeClassMemberType = (ctx: ClassDeclarationContext): ClassMemberType => {
    const name = ctx.id().getText();

    const members: {
        member: MemberField;
        modifier?: ModifierField[];
    }[] = [];

    const classMemberType: ClassMemberType = {
        type: 'class',
        name,
        members,
    };

    ctx.classBody()
        .classBodyDeclaration_list()
        .forEach((classBodyDeclarationCtx: ClassBodyDeclarationContext) => {
            const memberField = makeMemberField(classBodyDeclarationCtx.memberDeclaration());

            if (classBodyDeclarationCtx.block()) {
                const initializerBlockStatement: {
                    statements: StatementField[];
                    isStatic: boolean;
                } = {
                    statements: classBodyDeclarationCtx
                        .block()
                        .statement_list()
                        .map((statementCtx) => makeStatementField(statementCtx)),
                    isStatic: classBodyDeclarationCtx.STATIC() !== undefined,
                };

                classMemberType.initializerBlockStatement = initializerBlockStatement;
                return;
            }

            const member: {
                member: MemberField;
                modifier?: ModifierField[];
            } = {
                member: memberField,
            };

            if (
                classBodyDeclarationCtx.modifier_list() &&
                classBodyDeclarationCtx.modifier_list().length > 0
            ) {
                member.modifier = classBodyDeclarationCtx
                    .modifier_list()
                    .map((modifierCtx) => makeModifierField(modifierCtx));
            }

            classMemberType.members.push(member);
        });

    if (ctx.EXTENDS() && ctx.typeRef()) {
        classMemberType.extends = makeTypeField(ctx.typeRef());
    }

    if (ctx.IMPLEMENTS() && ctx.typeList()) {
        classMemberType.implements = ctx
            .typeList()
            .typeRef_list()
            .map((typeRefCtx) => makeTypeField(typeRefCtx));
    }

    return classMemberType;
};

