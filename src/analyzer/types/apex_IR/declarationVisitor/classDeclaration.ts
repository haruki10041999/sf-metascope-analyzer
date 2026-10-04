import { ClassDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor } from '../idVisitor';
import { BodyType, BodyVisitor } from '../bodyVisitor';
import { ListType, ListVisitor } from '../listVisitor';
import { TypeType, TypeVisitor } from '../typeVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class ClassDeclarationTypeClass extends DeclarationTypeClass<NormalIdTypeClass> {}

export const isClassDeclarationType = (
    target: CommonTypeClass,
): target is ClassDeclarationTypeClass => {
    return target instanceof ClassDeclarationTypeClass;
};

export type ClassDeclarationType = {
    type: 'classDeclaration';
    declaration: {
        name: IdType;
        body: BodyType;
        extends?: TypeType;
        implements?: ListType;
    };
};

export function makeClassDeclarationType(ctx: ClassDeclarationContext): ClassDeclarationType {
    if (!ctx.id() || !ctx.classBody()) {
        throw new Error('値が異常です。ClassDeclarationContext: ' + ctx.getText());
    }

    const name = new IdVisitor().visit(ctx.id());
    const body = new BodyVisitor().visit(ctx.classBody());

    const classDeclarationType: ClassDeclarationType = {
        type: 'classDeclaration',
        declaration: {
            name: name,
            body: body,
        },
    };

    if (ctx.EXTENDS() && ctx.typeRef()) {
        const extendsRef = new TypeVisitor().visit(ctx.typeRef());
        classDeclarationType.declaration.extends = extendsRef;
    }

    if (ctx.IMPLEMENTS() && ctx.typeList()) {
        const implementsList = new ListVisitor().visit(ctx.typeList());
        classDeclarationType.declaration.implements = implementsList;
    }

    return classDeclarationType;
}
