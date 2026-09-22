import { FieldExpressionContext, ValueContext } from '@apexdevtools/apex-parser';

import { SoqlField, makeSoqlField } from './field';
import { SoqlFunctionField, makeSoqlFunctionField } from './function';
import { SubQueryField, makeSubQueryField } from './subQuery';

export type ValueType =
    | {
          type: 'null';
          value: null;
      }
    | {
          type: 'literal';
          value: string;
      }
    | {
          type: 'list';
          value: ValueType[];
      }
    | {
          type: 'bind';
          variant: string;
      }
    | {
          type: 'subQuery';
          value: SubQueryField;
      };

export type FieldExpressionField = {
    field: SoqlField | SoqlFunctionField[];
    operator: string;
    value: ValueType;
};

export const makeFieldExpressionField = (ctx: FieldExpressionContext): FieldExpressionField => {
    let field: SoqlField | SoqlFunctionField[] = makeSoqlField(ctx.fieldName());
    if (ctx.soqlFunction()) {
        field = makeSoqlFunctionField(ctx.soqlFunction());
    }

    const operator = ctx.comparisonOperator().getText();
    const value = makeValueType(ctx.value());

    return {
        field: field,
        operator: operator,
        value: value,
    };
};

const makeValueType = (ctx: ValueContext): ValueType => {
    if (ctx.NULL()) {
        return {
            type: 'null',
            value: null,
        };
    }

    if (ctx.subQuery()) {
        return {
            type: 'subQuery',
            value: makeSubQueryField(ctx.subQuery()),
        };
    }

    if (ctx.boundExpression()) {
        return {
            type: 'bind',
            variant: ctx.boundExpression().getText(),
        };
    }

    if (ctx.valueList()) {
        const valueListCtx = ctx.valueList();
        const values = valueListCtx.value_list().map((valueCtx) => {
            return makeValueType(valueCtx);
        });
        return {
            type: 'list',
            value: values,
        };
    }

    return {
        type: 'literal',
        value: ctx.getText(),
    };
};
