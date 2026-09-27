import { SoslWithClauseContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';
import { ListType, ListVisitor } from '../listVisitor';

export type SoslWithClauseType = {
    type: 'soslWithClause';
} & (
    | {
          withType: 'DIVISION' | 'DATA_CATEGORY' | 'PRICEBOOKID';
          value: string | Omit<ExpressionType, 'type'>;
      }
    | {
          withType: 'SNIPPET' | 'SPELL_CORRECTION';
          value?: string;
      }
    | {
          withType: 'NETWORK';
          value: Omit<ListType, 'type'>;
      }
    | {
          withType: 'METADATA' | 'HIGHLIGHT' | 'SYSETM_MODE' | 'USER_MODE' | string;
      }
);

export const makeSoslWithClauseType = (ctx: SoslWithClauseContext): SoslWithClauseType => {
    if (ctx.DIVISION() || ctx.PRICEBOOKID()) {
        const withType = ctx.DIVISION() !== undefined ? 'DIVISION' : 'PRICEBOOKID';

        if (ctx.StringLiteral()) {
            return {
                type: 'soslWithClause',
                withType: withType,
                value: ctx.StringLiteral().getText(),
            };
        }

        if (ctx.MultilineStringLiteral()) {
            return {
                type: 'soslWithClause',
                withType: withType,
                value: ctx.MultilineStringLiteral().getText(),
            };
        }

        if (ctx.boundExpression()) {
            const { type, ...value } = new ExpressionVisitor().visit(ctx.boundExpression());
            return {
                type: 'soslWithClause',
                withType: withType,
                value: value,
            };
        }
    }

    if (ctx.DATA() && ctx.CATEGORY() && ctx.filteringExpression()) {
        const { type, ...value } = new ExpressionVisitor().visit(ctx.filteringExpression());
        return {
            type: 'soslWithClause',
            withType: 'DATA_CATEGORY',
            value: value,
        };
    }

    if (ctx.SNIPPET()) {
        if (ctx.TARGET_LENGTH() && ctx.IntegerLiteral()) {
            return {
                type: 'soslWithClause',
                withType: 'SNIPPET',
                value: ctx.IntegerLiteral().getText(),
            };
        }

        return {
            type: 'soslWithClause',
            withType: 'SNIPPET',
        };
    }

    if (ctx.SPELL_CORRECTION()) {
        if (ctx.BooleanLiteral()) {
            return {
                type: 'soslWithClause',
                withType: 'SPELL_CORRECTION',
                value: ctx.BooleanLiteral().getText(),
            };
        }

        return {
            type: 'soslWithClause',
            withType: 'SPELL_CORRECTION',
        };
    }

    if (ctx.NETWORK() && ctx.networkList()) {
        const value = new ListVisitor().visit(ctx.networkList());
        return {
            type: 'soslWithClause',
            withType: 'NETWORK',
            value: value,
        };
    }

    if (ctx.METADATA()) {
        return {
            type: 'soslWithClause',
            withType: 'METADATA',
        };
    }

    if (ctx.HIGHLIGHT()) {
        return {
            type: 'soslWithClause',
            withType: 'HIGHLIGHT',
        };
    }

    if (ctx.USER_MODE()) {
        return {
            type: 'soslWithClause',
            withType: 'USER_MODE',
        };
    }

    if (ctx.SYSTEM_MODE()) {
        return {
            type: 'soslWithClause',
            withType: 'SYSTEM_MODE',
        };
    }

    throw new Error('値が異常です。SoslWIthClauseContext: ' + ctx.getText());
};
