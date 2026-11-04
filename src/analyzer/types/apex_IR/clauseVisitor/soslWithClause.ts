import { SoslWithClauseContext } from '@apexdevtools/apex-parser';

import { ClauseValueTypeClass } from '.';

import {
    BoundExpressionTypeClass,
    FilteringExpressionTypeClass,
    ExpressionVisitor,
    isBoundExpressionType,
    isFilteringExpressionType,
} from '../expressionVisitor';
import { NetworkListTypeClass, ListVisitor, isNetworkListType } from '../listVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

type SoslWithClauseValueType =
    | 'DIVISION'
    | 'PRICEBOOKID'
    | 'DATA_CATEGORY'
    | 'SNIPPET'
    | 'SPELL_CORRECTION'
    | 'NETWORK'
    | 'METADATA'
    | 'HIGHLIGHT'
    | 'SYSTEM_MODE'
    | 'USER_MODE';

type SoslWithClauseContent =
    string | BoundExpressionTypeClass | FilteringExpressionTypeClass | NetworkListTypeClass;

export class SoslWithClauseTypeClass extends ClauseValueTypeClass<
    'soslWithClause',
    SoslWithClauseValueType
> {
    private content: SoslWithClauseContent | ApexErrorTypeClass | null = null;

    private constructor(
        value: SoslWithClauseValueType,
        content: SoslWithClauseContent | ApexErrorTypeClass | null,
    ) {
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

        let value: SoslWithClauseValueType;
        let content: SoslWithClauseContent | ApexErrorTypeClass | null = null;

        if (ctx.DIVISION() || ctx.PRICEBOOKID()) {
            value = ctx.DIVISION() ? 'DIVISION' : 'PRICEBOOKID';
            content = ctx.StringLiteral()
                ? ctx.StringLiteral().getText()
                : ctx.MultilineStringLiteral()
                  ? ctx.MultilineStringLiteral().getText()
                  : isApexValidClass(
                        new ExpressionVisitor().visit(ctx.boundExpression()),
                        isBoundExpressionType,
                        'boundExpression',
                    );
        } else if (ctx.DATA() && ctx.CATEGORY()) {
            value = 'DATA_CATEGORY';
            content = isApexValidClass(
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
                ? isApexValidClass(
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

    getContent(): SoslWithClauseContent | ApexErrorTypeClass | null {
        return this.content;
    }
}

export const isSoslWithClauseType = (
    target: ApexCommonTypeClass<string>,
): target is SoslWithClauseTypeClass => {
    return target instanceof SoslWithClauseTypeClass;
};

