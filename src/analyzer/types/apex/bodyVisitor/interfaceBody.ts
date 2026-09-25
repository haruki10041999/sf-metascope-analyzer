import { InterfaceBodyContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '../declarationVisitor';

export type InterfaceBodyType = {
    type: 'interfaceBody';
    declarations: Omit<DeclarationType, 'type'>[];
};

export const makeInterfaceBodyType = (ctx: InterfaceBodyContext): InterfaceBodyType => {
    const declarations = ctx.interfaceMethodDeclaration_list().map((decl) => {
        const { type, ...declaration } = new DeclarationVisitor().visit(decl);
        return declaration;
    });

    return {
        type: 'interfaceBody',
        declarations: declarations,
    };
};
