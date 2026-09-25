import { ClassDeclarationContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { BodyType, BodyVisitor } from '../bodyVisitor';
import { ListType, ListVisitor } from '../listVisitor';

import { TypeRefType, makeTypeRefType } from '../typeRef';

export type ClassDeclarationType = {
    type: 'classDeclaration';
    className: Omit<IdType, 'type'>;
    body: Omit<BodyType, 'type'>;
    extends?: Omit<TypeRefType, 'type'>;
    implements?: Omit<ListType, 'type'>;
};

export function makeClassDeclarationType(ctx: ClassDeclarationContext): ClassDeclarationType {
    const { type: nameType, ...name } = new IdVisitor().visit(ctx.id());
    const { type: bodyType, ...body } = new BodyVisitor().visit(ctx.classBody());

    const classDeclarationType: ClassDeclarationType = {
        type: 'classDeclaration',
        className: name,
        body: body,
    };

    if (ctx.EXTENDS() && ctx.typeRef()) {
        const { type: extendsType, ...extendsRef } = makeTypeRefType(ctx.typeRef());
        classDeclarationType.extends = extendsRef;
    }

    if (ctx.IMPLEMENTS() && ctx.typeList()) {
        const { type: implementsType, ...implementsList } = new ListVisitor().visit(ctx.typeList());
        classDeclarationType.implements = implementsList;
    }

    return classDeclarationType;
}
