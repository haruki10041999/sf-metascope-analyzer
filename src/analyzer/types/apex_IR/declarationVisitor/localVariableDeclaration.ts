import { LocalVariableDeclarationContext } from '@apexdevtools/apex-parser';

import { ModifierType, ModifierVisitor } from '../modifierVisitor';
import { VariableType, VariableVisitor } from '../variableVisitor';
import { TypeType, TypeVisitor } from '../typeVisitor';

export type LocalVariableDeclarationType = {
    type: 'localVariableDeclaration';
    declaration: {
        type: TypeType;
        name: VariableType;
        modifier?: ModifierType[];
    };
};

export const makeLocalVariableDeclarationType = (
    ctx: LocalVariableDeclarationContext,
): LocalVariableDeclarationType => {
    if (!ctx.typeRef() || !ctx.variableDeclarators()) {
        throw new Error('値が異常です。LocalVariableDeclarationContext: ' + ctx.getText());
    }

    const variantType = new TypeVisitor().visit(ctx.typeRef());
    const variants = new VariableVisitor().visit(ctx.variableDeclarators());

    const localVariableDeclarationType: LocalVariableDeclarationType = {
        type: 'localVariableDeclaration',
        declaration: {
            type: variantType,
            name: variants,
        },
    };

    if (ctx.modifier_list() && ctx.modifier_list().length > 0) {
        localVariableDeclarationType.declaration.modifier = ctx
            .modifier_list()
            .map((modifierCtx) => {
                const modifier = new ModifierVisitor().visit(modifierCtx);
                return modifier;
            });
    }

    return localVariableDeclarationType;
};
