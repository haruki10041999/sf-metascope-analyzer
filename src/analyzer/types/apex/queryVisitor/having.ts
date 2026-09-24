import { LogicalExpressionContext, ConditionalExpressionContext } from '@apexdevtools/apex-parser';

import { FieldExpressionField, makeFieldExpressionField } from './fieldExpression';

export type HavingField =
    | {
          type: 'condition';
          condition: FieldExpressionField;
      }
    | {
          type: 'AND' | 'OR';
          condition1: HavingField;
          condition2: HavingField;
      }
    | {
          type: 'NOT';
          condition: HavingField;
      };

export const makeHavingField = (ctx: LogicalExpressionContext): HavingField => {
    if (ctx.conditionalExpression_list().length === 0) {
        throw new Error(`値が異常です。WhereLogicalExpressionContext:${ctx.getText()}`);
    }

    const conditionalCtxList: ConditionalExpressionContext[] = ctx.conditionalExpression_list();
    const WhereFields: HavingField[] = [];
    const andOrList: ('AND' | 'OR')[] = alignOperatorList(ctx);
    for (const conditionalCtx of conditionalCtxList) {
        if (conditionalCtx.logicalExpression()) {
            const nestedLogicalCtx: LogicalExpressionContext = conditionalCtx.logicalExpression();
            WhereFields.push(makeHavingField(nestedLogicalCtx));
            continue;
        }
        WhereFields.push({
            type: 'condition',
            condition: makeFieldExpressionField(conditionalCtx.fieldExpression()),
        });
    }

    if (ctx.NOT()) {
        return {
            type: 'NOT',
            condition: makeAndOrField(WhereFields, andOrList),
        };
    }

    return makeAndOrField(WhereFields, andOrList);
};

const makeAndOrField = (WhereFields: HavingField[], andOrList: ('AND' | 'OR')[]): HavingField => {
    if (WhereFields.length - 1 !== andOrList.length) {
        throw new Error(`条件と演算子の数が合いません。`);
    }

    const fields = [...WhereFields];
    const operators = [...andOrList];

    let i = 0;

    while (i < operators.length) {
        if (operators[i] === 'AND') {
            const andField: HavingField = {
                type: 'AND',
                condition1: fields[i]!,
                condition2: fields[i + 1]!,
            };

            fields.splice(i, 2, andField);
            operators.splice(i, 1);
        } else {
            i++;
        }
    }

    let result = fields[0]!;

    for (let i = 0; i < operators.length; i++) {
        result = {
            type: 'OR',
            condition1: result,
            condition2: fields[i + 1]!,
        };
    }

    return result;
};

const alignOperatorList = (ctx: LogicalExpressionContext): ('AND' | 'OR')[] => {
    if (ctx.SOQLAND_list().length === 0 && ctx.SOQLOR_list().length === 0) {
        return [];
    }
    const soqlAndList = ctx.SOQLAND_list().map((andNode) => {
        return {
            tokenOrder: andNode.symbol.tokenIndex,
            value: 'AND',
        };
    });

    const soqlORList = ctx.SOQLOR_list().map((orNode) => {
        return {
            tokenOrder: orNode.symbol.tokenIndex,
            value: 'OR',
        };
    });

    return [...soqlAndList, ...soqlORList]
        .sort((a, b) => a.tokenOrder - b.tokenOrder)
        .map((value) => {
            return value.value as 'AND' | 'OR';
        });
};
