import { FieldDeclarationContext } from '@apexdevtools/apex-parser';

import { VariantField, makeVariantList } from '../variant';
import { TypeField, makeTypeField } from '../type';

export type FieldMemberType = {
    type: 'field';
    variantType: TypeField;
    variant: VariantField[];
};

export const makeFieldMemberType = (ctx: FieldDeclarationContext): FieldMemberType => {
    return {
        type: 'field',
        variantType: makeTypeField(ctx.typeRef()),
        variant: makeVariantList(ctx.variableDeclarators()),
    };
};

