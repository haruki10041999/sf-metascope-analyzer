import { ClassDeclarationContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { BodyType, BodyVisitor } from '../bodyVisitor';
import { ListType, ListVisitor } from '../listVisitor';
import { TypeType, TypeVisitor } from '../typeVisitor';

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
