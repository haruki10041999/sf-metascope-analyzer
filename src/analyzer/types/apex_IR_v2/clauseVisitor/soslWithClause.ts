import { SoslWithClauseContext } from '@apexdevtools/apex-parser';

import { BoundExpressionTypeClass, FilteringExpressionTypeClass } from '../expressionVisitor';
import { NetworkListTypeClass } from '../listVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

/** キーワードごとに中身の形が決まる (判別 union) */
export type SoslWithClauseType = TypeField<'soslWithClause'> &
    (
        | {
              kind: 'DIVISION' | 'PRICEBOOKID';
              /** 文字列リテラル (引用符つき) かバインド式 */
              content:
                  | { kind: 'literal'; text: string }
                  | { kind: 'bind'; expr: BoundExpressionTypeClass };
          }
        | { kind: 'DATA_CATEGORY'; content: FilteringExpressionTypeClass }
        /** `SNIPPET (target_length = n)` の n (整数リテラル)。省略は null */
        | { kind: 'SNIPPET'; targetLength: string | null }
        /** 真偽値リテラル (true / false) */
        | { kind: 'SPELL_CORRECTION'; enabled: string }
        | {
              kind: 'NETWORK';
              /** `NETWORK IN (...)` と `NETWORK = '...'` */
              content: { kind: 'in'; list: NetworkListTypeClass } | { kind: 'eq'; text: string };
          }
        | { kind: 'METADATA'; content: string | null }
        | { kind: 'HIGHLIGHT' | 'SYSTEM_MODE' | 'USER_MODE' }
    );

export class SoslWithClauseTypeClass extends ApexCommonTypeClass<
    'soslWithClause',
    SoslWithClauseType
> {
    private constructor(fields: FieldsOf<SoslWithClauseType>, sourceSpan: SourceSpan) {
        super('soslWithClause', fields, sourceSpan);
    }

    static create(ctx: SoslWithClauseContext): SoslWithClauseTypeClass {
        return new SoslWithClauseTypeClass(
            SoslWithClauseTypeClass.createFields(ctx),
            getSourceSpan(ctx),
        );
    }

    private static createFields(ctx: SoslWithClauseContext): FieldsOf<SoslWithClauseType> {
        if (ctx.DIVISION() || ctx.PRICEBOOKID()) {
            const literal = ctx.StringLiteral() ?? ctx.MultilineStringLiteral();
            return {
                kind: ctx.DIVISION() ? 'DIVISION' : 'PRICEBOOKID',
                content: literal
                    ? { kind: 'literal', text: literal.getText() }
                    : {
                          kind: 'bind',
                          expr: createNode(
                              ctx.boundExpression(),
                              (c) => BoundExpressionTypeClass.create(c),
                              'boundExpression',
                          ),
                      },
            };
        } else if (ctx.DATA() && ctx.CATEGORY()) {
            return {
                kind: 'DATA_CATEGORY',
                content: createNode(
                    ctx.filteringExpression(),
                    (c) => FilteringExpressionTypeClass.create(c),
                    'filteringExpression',
                ),
            };
        } else if (ctx.SNIPPET()) {
            // `(target_length = n)` は任意
            return {
                kind: 'SNIPPET',
                targetLength: ctx.IntegerLiteral() ? ctx.IntegerLiteral().getText() : null,
            };
        } else if (ctx.SPELL_CORRECTION()) {
            return { kind: 'SPELL_CORRECTION', enabled: ctx.BooleanLiteral().getText() };
        } else if (ctx.NETWORK()) {
            // `NETWORK IN (...)` と `NETWORK = '...'` の 2 形式がある
            return {
                kind: 'NETWORK',
                content: ctx.networkList()
                    ? {
                          kind: 'in',
                          list: createNode(
                              ctx.networkList(),
                              (c) => NetworkListTypeClass.create(c),
                              'networkList',
                          ),
                      }
                    : { kind: 'eq', text: ctx.StringLiteral().getText() },
            };
        } else if (ctx.METADATA()) {
            return {
                kind: 'METADATA',
                content: ctx.StringLiteral() ? ctx.StringLiteral().getText() : null,
            };
        } else if (ctx.HIGHLIGHT()) {
            return { kind: 'HIGHLIGHT' };
        } else if (ctx.SYSTEM_MODE()) {
            return { kind: 'SYSTEM_MODE' };
        } else if (ctx.USER_MODE()) {
            return { kind: 'USER_MODE' };
        }
        throw new Error('値が異常です。SoslWithClauseContext: ' + ctx.getText());
    }

    getKind(): SoslWithClauseType['kind'] {
        return this.getFields().kind;
    }
}

export const isSoslWithClauseType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SoslWithClauseTypeClass => {
    return isSpicifyApexCommonTypeClass('soslWithClause', target);
};
