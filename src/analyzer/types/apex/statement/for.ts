import {
    ForStatementContext,
    ForControlContext,
    EnhancedForControlContext,
    ForInitContext,
    LocalVariableDeclarationContext,
    ForUpdateContext,
    ExpressionListContext,
} from '@apexdevtools/apex-parser';

import { StatementField, makeStatementField } from '.';
import { VariantField, makeVariantList } from '../variant';
import { ModifierField, makeModifierField } from '../modifer';
import { TypeField, makeTypeField } from '../type';

export type ForStatementType = {
    type: 'for';
    statement: StatementField;
} & (
    | {
          init:
              | {
                    variantType: TypeField;
                    variant: VariantField[];
                    modifier?: ModifierField[];
                }
              | string;
          condition: string;
          update: string;
      }
    | {
          variant: string;
          variantType: TypeField;
          list: string;
      }
);

export const makeForStatementType = (ctx: ForStatementContext): ForStatementType => {
    const statement = makeStatementField(ctx.statement());

    const forControlCtx = ctx.forControl();

    if (forControlCtx.enhancedForControl()) {
        const enhancedForControlCtx = forControlCtx.enhancedForControl();
        const variantType = makeTypeField(enhancedForControlCtx.typeRef());
        return {
            type: 'for',
            statement: statement,
            variant: enhancedForControlCtx.id().getText(),
            variantType: variantType,
            list: enhancedForControlCtx.expression().getText(),
        };
    }

    const condition = forControlCtx.expression().getText();

    const forUpdateCtx = forControlCtx.forUpdate();
    const update = forUpdateCtx
        .expressionList()
        .expression_list()
        .map((expressionCtx) => {
            return expressionCtx.getText();
        })
        .join('');

    const forInitCtx = forControlCtx.forInit();
    if (forInitCtx.localVariableDeclaration()) {
        const localVariableDeclarationCtx = forInitCtx.localVariableDeclaration();
        const init: {
            variantType: TypeField;
            variant: VariantField[];
            modifier?: ModifierField[];
        } = {
            variantType: makeTypeField(localVariableDeclarationCtx.typeRef()),
            variant: makeVariantList(localVariableDeclarationCtx.variableDeclarators()),
        };

        if (
            localVariableDeclarationCtx.modifier_list() &&
            localVariableDeclarationCtx.modifier_list().length > 0
        ) {
            init.modifier = localVariableDeclarationCtx.modifier_list().map((modifierCtx) => {
                return makeModifierField(modifierCtx);
            });
        }
        return {
            type: 'for',
            statement: statement,
            init: init,
            condition: condition,
            update: update,
        };
    } else {
        const init = forInitCtx
            .expressionList()
            .expression_list()
            .map((expressionCtx) => {
                return expressionCtx.getText();
            })
            .join('');
        return {
            type: 'for',
            statement: statement,
            init: init,
            condition: condition,
            update: update,
        };
    }
};
