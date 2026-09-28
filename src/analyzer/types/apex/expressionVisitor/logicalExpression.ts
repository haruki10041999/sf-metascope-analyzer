import { LogicalExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

type LogicalFieldType =
    | {
          condition: ExpressionType;
      }
    | {
          type: 'AND';
          condition1: LogicalFieldType;
          condition2: LogicalFieldType;
      }
    | {
          type: 'OR';
          condition1: LogicalFieldType;
          condition2: LogicalFieldType;
      }
    | {
          type: 'NOT';
          condition: LogicalFieldType;
      };

export type LogicalExpressionType = {
    type: 'logicalExpression';
    expression: LogicalFieldType;
};

export const makeLogicalExpressionType = (ctx: LogicalExpressionContext): LogicalExpressionType => {
    const conditions: LogicalFieldType[] = ctx.conditionalExpression_list()
        ? ctx.conditionalExpression_list().map((conditionalExpressionCtx) => {
              const value = new ExpressionVisitor().visit(conditionalExpressionCtx);
              return {
                  condition: value,
              };
          })
        : [];

    const andNodes = ctx.SOQLAND_list()
        ? ctx.SOQLAND_list().map((andNode) => {
              return { index: andNode.symbol.tokenIndex, value: 'AND' };
          })
        : [];
    const orNodes = ctx.SOQLOR_list()
        ? ctx.SOQLOR_list().map((orNode) => {
              return { index: orNode.symbol.tokenIndex, value: 'OR' };
          })
        : [];
    const logicalOperators = [...andNodes, ...orNodes]
        .sort((a, b) => a.index - b.index)
        .map((node) => {
            return node.value;
        });

    if (conditions.length - 1 !== logicalOperators.length) {
        throw new Error('値が異常です。LogicalExpressionContext: ' + ctx.getText());
    }

    let i = 0;
    while (i < logicalOperators.length) {
        if (logicalOperators.at(i) === 'AND') {
            const andConditon: LogicalFieldType = {
                type: 'AND',
                condition1: conditions.at(i)!,
                condition2: conditions.at(i + 1)!,
            };

            conditions.splice(i, 2, andConditon);
            logicalOperators.splice(i, 1);
        } else {
            i++;
        }
    }

    let value: LogicalFieldType = conditions.at(0)!;
    logicalOperators.forEach((operator, index) => {
        value = {
            type: 'OR',
            condition1: value,
            condition2: conditions.at(index + 1)!,
        };
    });

    if (ctx.NOT()) {
        value = {
            type: 'NOT',
            condition: value,
        };
    }

    return {
        type: 'logicalExpression',
        expression: value,
    };
};

