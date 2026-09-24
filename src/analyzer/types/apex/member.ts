import { MemberDeclarationContext } from '@apexdevtools/apex-parser';

import { MemberType, MemberVisitor } from './memberVisitor';

export const makeMemberField = (ctx: MemberDeclarationContext): MemberType => {
    if (ctx.classDeclaration()) {
        return new MemberVisitor().visit(ctx.classDeclaration());
    }

    if (ctx.interfaceDeclaration()) {
        return new MemberVisitor().visit(ctx.interfaceDeclaration());
    }

    if (ctx.enumDeclaration()) {
        return new MemberVisitor().visit(ctx.enumDeclaration());
    }

    if (ctx.methodDeclaration()) {
        return new MemberVisitor().visit(ctx.methodDeclaration());
    }

    if (ctx.constructorDeclaration()) {
        return new MemberVisitor().visit(ctx.constructorDeclaration());
    }

    if (ctx.propertyDeclaration()) {
        return new MemberVisitor().visit(ctx.propertyDeclaration());
    }

    if (ctx.fieldDeclaration()) {
        return new MemberVisitor().visit(ctx.fieldDeclaration());
    }

    throw new Error('値が異常です。: ' + ctx.getText());
};
