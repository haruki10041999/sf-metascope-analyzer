import { FieldDeclarationContext } from '@apexdevtools/apex-parser';

import { VariantField, makeVariantList } from './variant';
import { TypeField, makeTypeField } from './type';

export type FieldField = {
    type: TypeField;
    variant: VariantField[];
};

export const makeFieldField = (ctx: FieldDeclarationContext): FieldField => {
    return {
        type: makeTypeField(ctx.typeRef()),
        variant: makeVariantList(ctx.variableDeclarators()),
    };
};
