import { EnumDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '.';

import { IdType, IdVisitor } from '../idVisitor';

export type EnumDeclarationType = {
    type: 'enumDeclaration';
    declaration: {
        name: IdType;
        constants: DeclarationType;
    };
};

export const makeEnumDeclarationType = (ctx: EnumDeclarationContext): EnumDeclarationType => {
    if (!ctx.id() || !ctx.enumConstants()) {
        throw new Error('値が異常です。EnumDeclarationContext: ' + ctx.getText());
    }

    const name = new IdVisitor().visit(ctx.id());

    return {
        type: 'enumDeclaration',
        declaration: {
            name: name,
            constants: new DeclarationVisitor().visit(ctx.enumConstants()),
        },
    };
};
