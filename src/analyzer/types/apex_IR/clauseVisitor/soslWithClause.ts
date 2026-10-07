import { SoslWithClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import {
    BoundExpressionTypeClass,
    FilteringExpressionTypeClass,
    ExpressionVisitor,
    isBoundExpressionType,
    isFilteringExpressionType,
} from '../expressionVisitor';
import { NetworkListTypeClass, ListVisitor, isNetworkListType } from '../listVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

type SoslWithClauseContent =
    string | BoundExpressionTypeClass | FilteringExpressionTypeClass | NetworkListTypeClass;

export class SoslWithClauseTypeClass extends ClauseTypeClass<string> {
    private content: SoslWithClauseContent | ErrorTypeClass | null = null;

    private constructor(value: string, content: SoslWithClauseContent | ErrorTypeClass | null) {
        super('soslWithClause', value);
        this.content = content;
    }

    static create(ctx: SoslWithClauseContext): SoslWithClauseTypeClass {
        if (
            !ctx.DIVISION() &&
            !ctx.PRICEBOOKID() &&
            !ctx.DATA() &&
            !ctx.CATEGORY() &&
            !ctx.SNIPPET() &&
            !ctx.SPELL_CORRECTION() &&
            !ctx.NETWORK() &&
            !ctx.METADATA() &&
            !ctx.HIGHLIGHT() &&
            !ctx.SYSTEM_MODE() &&
            !ctx.USER_MODE()
        ) {
            throw new Error('値が異常です。SoslWithClauseContext: ' + ctx.getText());
        }

        let value: string;
        let content: SoslWithClauseContent | ErrorTypeClass | null = null;

        if (ctx.DIVISION() || ctx.PRICEBOOKID()) {
            value = ctx.DIVISION() ? 'DIVISION' : 'PRICEBOOKID';
            content = ctx.StringLiteral()
                ? ctx.StringLiteral().getText()
                : ctx.MultilineStringLiteral()
                  ? ctx.MultilineStringLiteral().getText()
                  : isValidClass(
                        new ExpressionVisitor().visit(ctx.boundExpression()),
                        isBoundExpressionType,
                        'boundExpression',
                    );
        } else if (ctx.DATA() && ctx.CATEGORY()) {
            value = 'DATA_CATEGORY';
            content = isValidClass(
                new ExpressionVisitor().visit(ctx.filteringExpression()),
                isFilteringExpressionType,
                'filteringExpression',
            );
        } else if (ctx.SNIPPET()) {
            value = 'SNIPPET';
            // `(target_length = n)` は任意
            content = ctx.IntegerLiteral() ? ctx.IntegerLiteral().getText() : null;
        } else if (ctx.SPELL_CORRECTION()) {
            value = 'SPELL_CORRECTION';
            content = ctx.BooleanLiteral().getText();
        } else if (ctx.NETWORK()) {
            value = 'NETWORK';
            // `NETWORK IN (...)` と `NETWORK = '...'` の 2 形式がある
            content = ctx.networkList()
                ? isValidClass(
                      new ListVisitor().visit(ctx.networkList()),
                      isNetworkListType,
                      'networkList',
                  )
                : ctx.StringLiteral().getText();
        } else if (ctx.METADATA()) {
            value = 'METADATA';
            content = ctx.StringLiteral() ? ctx.StringLiteral().getText() : null;
        } else if (ctx.HIGHLIGHT()) {
            value = 'HIGHLIGHT';
        } else if (ctx.SYSTEM_MODE()) {
            value = 'SYSTEM_MODE';
        } else {
            value = 'USER_MODE';
        }

        return new SoslWithClauseTypeClass(value, content);
    }

    getContent(): SoslWithClauseContent | ErrorTypeClass | null {
        return this.content;
    }
}

export const isSoslWithClauseType = (
    target: CommonTypeClass,
): target is SoslWithClauseTypeClass => {
    return target instanceof SoslWithClauseTypeClass;
};

