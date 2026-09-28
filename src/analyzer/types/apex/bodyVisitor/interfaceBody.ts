import { InterfaceBodyContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '../declarationVisitor';

export type InterfaceBodyType = {
    type: 'interfaceBody';
    body: DeclarationType[];
};

export const makeInterfaceBodyType = (ctx: InterfaceBodyContext): InterfaceBodyType => {
    const body = ctx.interfaceMethodDeclaration_list().map((decl) => {
        const declaration = new DeclarationVisitor().visit(decl);
        return declaration;
    });

    return {
        type: 'interfaceBody',
        body: body,
    };
};
