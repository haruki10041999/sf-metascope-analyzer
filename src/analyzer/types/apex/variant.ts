import {
    VariableDeclaratorsContext,
    VariableDeclaratorContext,
    ExpressionContext,
} from '@apexdevtools/apex-parser';

export type VariantField = {
    variant: string;
    initialValue?: string;
};

export const makeVariantList = (ctx: VariableDeclaratorsContext) => {
    const variantFields: VariantField[] = [];

    const variableDeclaratorCtxs = ctx.variableDeclarator_list();
    variableDeclaratorCtxs.forEach((variableDeclaratorCtx) => {
        const variantField: VariantField = {
            variant: variableDeclaratorCtx.id().getText(),
        };

        if (variableDeclaratorCtx.ASSIGN()) {
            variantField.initialValue = variableDeclaratorCtx.expression().getText();
        }

        variantFields.push(variantField);
    });

    return variantFields;
};
