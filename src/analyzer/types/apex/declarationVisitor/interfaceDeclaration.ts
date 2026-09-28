import { InterfaceDeclarationContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { BodyType, BodyVisitor } from '../bodyVisitor';
import { ListType, ListVisitor } from '../listVisitor';

export type InterfaceDeclarationType = {
    type: 'interface';
    declaration: {
        name: IdType;
        body: BodyType;
        extends?: ListType;
    };
};

export const makeInterfaceDeclarationType = (
    ctx: InterfaceDeclarationContext,
): InterfaceDeclarationType => {
    const name = new IdVisitor().visit(ctx.id());
    const body = new BodyVisitor().visit(ctx.interfaceBody());

    const interfaceDeclarationType: InterfaceDeclarationType = {
        type: 'interface',
        declaration: {
            name: name,
            body: body,
        },
    };

    if (ctx.EXTENDS() && ctx.typeList()) {
        const extendsList = new ListVisitor().visit(ctx.typeList());
        interfaceDeclarationType.declaration.extends = extendsList;
    }

    return interfaceDeclarationType;
};
