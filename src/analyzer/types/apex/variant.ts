import {
    VariableDeclaratorsContext,
    VariableDeclaratorContext,
    ExpressionContext,
} from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from './expression';

export type VariantField = {
    variant: string;
    initialValue?: ExpressionField;
};

export const makeVariantList = (ctx: VariableDeclaratorsContext) => {
    const variantFields: VariantField[] = [];

    const variableDeclaratorCtxs = ctx.variableDeclarator_list();
    variableDeclaratorCtxs.forEach((variableDeclaratorCtx) => {
        const variantField: VariantField = {
            variant: variableDeclaratorCtx.id().getText(),
        };

        if (variableDeclaratorCtx.ASSIGN()) {
            variantField.initialValue = new ExpressionVisitor().visit(
                variableDeclaratorCtx.expression() as ExpressionContext,
            );
        }

        variantFields.push(variantField);
    });

    return variantFields;
};

