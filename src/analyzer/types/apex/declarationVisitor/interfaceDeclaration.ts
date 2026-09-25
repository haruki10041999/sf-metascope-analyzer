import { InterfaceDeclarationContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { BodyType, BodyVisitor } from '../bodyVisitor';
import { ListType, ListVisitor } from '../listVisitor';

export type InterfaceDeclarationType = {
    type: 'interface';
    interfaceName: Omit<IdType, 'type'>;
    body: Omit<BodyType, 'type'>;
    extends?: Omit<ListType, 'type'>;
};

export const makeInterfaceDeclarationType = (
    ctx: InterfaceDeclarationContext,
): InterfaceDeclarationType => {
    const { type: nameType, ...name } = new IdVisitor().visit(ctx.id());
    const { type: bodyType, ...body } = new BodyVisitor().visit(ctx.interfaceBody());

    const interfaceDeclarationType: InterfaceDeclarationType = {
        type: 'interface',
        interfaceName: name,
        body: body,
    };

    if (ctx.EXTENDS() && ctx.typeList()) {
        const { type: extendsType, ...extendsList } = new ListVisitor().visit(ctx.typeList());
        interfaceDeclarationType.extends = extendsList;
    }

    return interfaceDeclarationType;
};
