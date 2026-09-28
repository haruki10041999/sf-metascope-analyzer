import { ValueContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';
import { ListType, ListVisitor } from '../listVisitor';
import { QueryType, QueryVisitor } from '../queryVisitor';
import { LiteralVisitor, LiteralType } from '../literalVisitor';

import { DateFormulaType, makeDateFormulaType } from '../dateFormula';

type ValueFieldType =
    | {
          type: 'null';
          value: null;
      }
    | {
          type:
              | 'boolean'
              | 'string'
              | 'multilineString'
              | 'date'
              | 'time'
              | 'dateTime'
              | 'integralCurrency'
              | 'integer';
          value: string;
      }
    | {
          type: 'signedNumber';
          value: LiteralType;
      }
    | {
          type: 'dateFormula';
          value: DateFormulaType;
      }
    | {
          type: 'subQuery';
          value: QueryType;
      }
    | { type: 'list'; value: ListType }
    | {
          type: 'bind';
          value: ExpressionType;
      };

export type ValueType = {
    type: 'value';
    value: ValueFieldType;
};

export const makeValueType = (ctx: ValueContext): ValueType => {
    let valueFieldType: ValueFieldType | undefined = undefined;
    if (ctx.NULL()) {
        valueFieldType = {
            type: 'null',
            value: null,
        };
    }

    if (ctx.BooleanLiteral()) {
        valueFieldType = {
            type: 'boolean',
            value: ctx.BooleanLiteral().getText(),
        };
    }

    if (ctx.StringLiteral()) {
        valueFieldType = {
            type: 'string',
            value: ctx.StringLiteral().getText(),
        };
    }

    if (ctx.MultilineStringLiteral()) {
        valueFieldType = {
            type: 'multilineString',
            value: ctx.MultilineStringLiteral().getText(),
        };
    }

    if (ctx.DateLiteral()) {
        valueFieldType = {
            type: 'date',
            value: ctx.DateLiteral().getText(),
        };
    }

    if (ctx.TimeLiteral()) {
        valueFieldType = {
            type: 'time',
            value: ctx.TimeLiteral().getText(),
        };
    }

    if (ctx.DateTimeLiteral()) {
        valueFieldType = {
            type: 'dateTime',
            value: ctx.DateTimeLiteral().getText(),
        };
    }

    if (ctx.IntegralCurrencyLiteral()) {
        valueFieldType = {
            type: 'integralCurrency',
            value: ctx.IntegralCurrencyLiteral().getText(),
        };
    }

    if (ctx.IntegerLiteral()) {
        valueFieldType = {
            type: 'integer',
            value: ctx.IntegerLiteral().getText(),
        };
    }

    if (ctx.signedNumber()) {
        const value = new LiteralVisitor().visit(ctx.signedNumber());
        valueFieldType = {
            type: 'signedNumber',
            value: value,
        };
    }

    if (ctx.dateFormula()) {
        const value = makeDateFormulaType(ctx.dateFormula());
        valueFieldType = {
            type: 'dateFormula',
            value: value,
        };
    }

    if (ctx.subQuery()) {
        const value = new QueryVisitor().visit(ctx.subQuery());
        valueFieldType = {
            type: 'subQuery',
            value: value,
        };
    }

    if (ctx.valueList()) {
        const value = new ListVisitor().visit(ctx.valueList());
        valueFieldType = {
            type: 'list',
            value: value,
        };
    }

    if (ctx.boundExpression()) {
        const value = new ExpressionVisitor().visit(ctx.boundExpression());
        valueFieldType = {
            type: 'bind',
            value: value,
        };
    }

    if (!valueFieldType) {
        throw new Error('値が異常です。ValueContext: ' + ctx.getText());
    }

    return {
        type: 'value',
        value: valueFieldType,
    };
};

