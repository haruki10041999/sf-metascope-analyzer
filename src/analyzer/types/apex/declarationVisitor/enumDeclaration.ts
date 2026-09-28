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
    const name = new IdVisitor().visit(ctx.id());
    const constants = new DeclarationVisitor().visit(ctx.enumConstants());

    return {
        type: 'enumDeclaration',
        declaration: {
            name: name,
            constants: constants,
        },
    };
};
