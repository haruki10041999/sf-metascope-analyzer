import { ClassBodyContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '../declarationVisitor';

export type ClassBodyType = {
    type: 'classBody';
    body: DeclarationType[];
};

export const makeClassBodyType = (ctx: ClassBodyContext): ClassBodyType => {
    if (!ctx.classBodyDeclaration_list()) {
        throw new Error('値が異常です。ClassBodyContext: ' + ctx.getText());
    }

    const declarations = ctx.classBodyDeclaration_list().map((clasBodyDeclarationCtx) => {
        const declaration = new DeclarationVisitor().visit(clasBodyDeclarationCtx);
        return declaration;
    });

    return {
        type: 'classBody',
        body: declarations,
    };
};
