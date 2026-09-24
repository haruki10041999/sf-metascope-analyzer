import { LocalVariableDeclarationStatementContext } from '@apexdevtools/apex-parser';

import { ModifierField, makeModifierField } from '../modifer';
import { VariantField, makeVariantList } from '../variant';
import { TypeField, makeTypeField } from '../type';

export type LocalVariantStatementType = {
    type: 'localVariant';
    variantType: TypeField;
    variant: VariantField[];
    modifier?: ModifierField[];
};

export const makeLocalVariantStatementType = (
    ctx: LocalVariableDeclarationStatementContext,
): LocalVariantStatementType => {
    const localVariantField: LocalVariantStatementType = {
        type: 'localVariant',
        variantType: makeTypeField(ctx.localVariableDeclaration().typeRef()),
        variant: makeVariantList(ctx.localVariableDeclaration().variableDeclarators()),
    };

    if (
        ctx.localVariableDeclaration().modifier_list() &&
        ctx.localVariableDeclaration().modifier_list().length > 0
    ) {
        localVariantField.modifier = ctx
            .localVariableDeclaration()
            .modifier_list()
            .map((modifierCtx) => {
                return makeModifierField(modifierCtx);
            });
    }

    return localVariantField;
};
