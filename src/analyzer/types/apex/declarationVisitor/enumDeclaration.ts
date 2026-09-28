import { EnumDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '.';

import { IdType, IdVisitor } from '../idVisitor';

export type EnumDeclarationType = {
    type: 'enumDeclaration';
    declaration: {
        name: IdType;
        constants: DeclarationType | null;
    };
};

export const makeEnumDeclarationType = (ctx: EnumDeclarationContext): EnumDeclarationType => {
    const name = new IdVisitor().visit(ctx.id());

    return {
        type: 'enumDeclaration',
        declaration: {
            name: name,
            constants: ctx.enumConstants()
                ? new DeclarationVisitor().visit(ctx.enumConstants())
                : null,
        },
    };
};
