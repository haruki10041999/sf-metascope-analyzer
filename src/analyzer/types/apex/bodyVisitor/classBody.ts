import { ClassBodyContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '../declarationVisitor';

export type ClassBodyType = {
    type: 'classBody';
    body: DeclarationType[];
};

export const makeClassBodyType = (ctx: ClassBodyContext): ClassBodyType => {
    const visitor = new DeclarationVisitor();
    const declarations = ctx.classBodyDeclaration_list().map((clasBodyDeclarationCtx) => {
        const declaration = visitor.visit(clasBodyDeclarationCtx);
        return declaration;
    });

    return {
        type: 'classBody',
        body: declarations,
    };
};
