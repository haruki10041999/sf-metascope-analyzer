import { FieldDeclarationContext } from '@apexdevtools/apex-parser';

import { TypeRefType, makeTypeRefType } from '../typeRef';
import { VariableDeclaratorsType, makeVariableDeclaratorsType } from '../variableDeclarators';

export type FieldDeclarationType = {
    type: 'fieldDeclaration';
    variantType: Omit<TypeRefType, 'type'>;
    variant: Omit<VariableDeclaratorsType, 'type'>;
};

export const makeFieldDeclarationType = (ctx: FieldDeclarationContext): FieldDeclarationType => {
    const { type: _, ...variantType } = makeTypeRefType(ctx.typeRef());
    const { type: __, ...variant } = makeVariableDeclaratorsType(ctx.variableDeclarators());
    return {
        type: 'fieldDeclaration',
        variantType: variantType,
        variant: variant,
    };
};
