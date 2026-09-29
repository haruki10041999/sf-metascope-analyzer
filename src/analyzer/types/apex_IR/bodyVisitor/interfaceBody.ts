import { InterfaceBodyContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '../declarationVisitor';

export type InterfaceBodyType = {
    type: 'interfaceBody';
    body: DeclarationType[];
};

export const makeInterfaceBodyType = (ctx: InterfaceBodyContext): InterfaceBodyType => {
    if (!ctx.interfaceMethodDeclaration_list()) {
        throw new Error('値が異常です。InterfaceBodyContext: ' + ctx.getText());
    }

    const body = ctx.interfaceMethodDeclaration_list().map((decl) => {
        const declaration = new DeclarationVisitor().visit(decl);
        return declaration;
    });

    return {
        type: 'interfaceBody',
        body: body,
    };
};
