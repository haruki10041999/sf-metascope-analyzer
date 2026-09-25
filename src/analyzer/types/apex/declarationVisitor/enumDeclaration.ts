import { EnumDeclarationContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';

import { EnumConstantsType, makeEnumConstantsType } from '../enumConstants';

export type EnumDeclarationType = {
    type: 'enumDeclaration';
    enumName: Omit<IdType, 'type'>;
    constants: Omit<EnumConstantsType, 'type'>;
};

export const makeEnumDeclarationType = (ctx: EnumDeclarationContext): EnumDeclarationType => {
    const { type: nameType, ...name } = new IdVisitor().visit(ctx.id());
    const { type: constantsType, ...constants } = makeEnumConstantsType(ctx.enumConstants());

    return {
        type: 'enumDeclaration',
        enumName: name,
        constants: constants,
    };
};
