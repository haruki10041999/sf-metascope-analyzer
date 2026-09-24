import {
    ForStatementContext,
    ForControlContext,
    EnhancedForControlContext,
    ForInitContext,
    LocalVariableDeclarationContext,
    ForUpdateContext,
    ExpressionListContext,
} from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from '.';
import { VariantField, makeVariantList } from '../variant';
import { ModifierField, makeModifierField } from '../modifer';
import { TypeField, makeTypeField } from '../type';
import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type ForStatementType = {
    type: 'for';
    statement: StatementType;
} & (
    | {
          init:
              | {
                    variantType: TypeField;
                    variant: VariantField[];
                    modifier?: ModifierField[];
                }
              | ExpressionType[];
          condition: ExpressionType;
          update: ExpressionType[];
      }
    | {
          variant: string;
          variantType: TypeField;
          list: ExpressionType;
      }
);

export const makeForStatementType = (ctx: ForStatementContext): ForStatementType => {
    const statement = new StatementVisitor().visit(ctx.statement());

    const forControlCtx = ctx.forControl();

    if (forControlCtx.enhancedForControl()) {
        const enhancedForControlCtx = forControlCtx.enhancedForControl();
        const variantType = makeTypeField(enhancedForControlCtx.typeRef());
        return {
            type: 'for',
            statement: statement,
            variant: enhancedForControlCtx.id().getText(),
            variantType: variantType,
            list: new ExpressionVisitor().visit(enhancedForControlCtx.expression()),
        };
    }

    const condition: ExpressionType = new ExpressionVisitor().visit(forControlCtx.expression());

    const forUpdateCtx = forControlCtx.forUpdate();
    const update: ExpressionType[] = forUpdateCtx
        .expressionList()
        .expression_list()
        .map((expressionCtx) => {
            return new ExpressionVisitor().visit(expressionCtx);
        });

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
                return new ExpressionVisitor().visit(expressionCtx);
            });

        return {
            type: 'for',
            statement: statement,
            init: init,
            condition: condition,
            update: update,
        };
    }
};
