import { LocalVariableDeclarationContext } from '@apexdevtools/apex-parser';

import { TypeRefType, makeTypeRefType } from '../typeRef';
import { VariableDeclaratorsType, makeVariableDeclaratorsType } from '../variableDeclarators';
import { ModifierType, makeModifierType } from '../modifier';

export type LocalVariableDeclarationType = {
    type: 'localVariableDeclaration';
    variantType: Omit<TypeRefType, 'type'>;
    variants: Omit<VariableDeclaratorsType, 'type'>;
    modifier?: Omit<ModifierType, 'type'>[];
};

export const makeLocalVariableDeclarationType = (
    ctx: LocalVariableDeclarationContext,
): LocalVariableDeclarationType => {
    const { type: variantTypeType, ...variantType } = makeTypeRefType(ctx.typeRef());
    const { type: variantsType, ...variants } = makeVariableDeclaratorsType(
        ctx.variableDeclarators(),
    );

    const localVariableDeclarationType: LocalVariableDeclarationType = {
        type: 'localVariableDeclaration',
        variantType: variantType,
        variants: variants,
    };

    if (ctx.modifier_list() && ctx.modifier_list().length > 0) {
        localVariableDeclarationType.modifier = ctx.modifier_list().map((modifierCtx) => {
            const { type: modifierType, ...modifier } = makeModifierType(modifierCtx);
            return modifier;
        });
    }

    return localVariableDeclarationType;
};
