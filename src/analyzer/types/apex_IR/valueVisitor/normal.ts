import { ValueContext } from '@apexdevtools/apex-parser';

import { ValueTypeClass } from '../valueVisitor';

import {
    BoundExpressionTypeClass,
    ExpressionVisitor,
    isBoundExpressionType,
} from '../expressionVisitor';
import { ValueListTypeClass, ListVisitor, isValueListType } from '../listVisitor';
import {
    DateFormulaTypeClass,
    SubQueryTypeClass,
    QueryVisitor,
    isDateFormulaType,
    isSubQueryType,
} from '../queryVisitor';
import { SignedIntegerTypeClass, LiteralVisitor, isSignedIntegerType } from '../literalVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

type ValueTypeClassValue =
    | string
    | number
    | boolean
    | Date
    | SignedIntegerTypeClass
    | DateFormulaTypeClass
    | SubQueryTypeClass
    | ValueListTypeClass
    | BoundExpressionTypeClass
    | null;

export class NormalValueTypeClass extends ValueTypeClass<ValueTypeClassValue> {
    private valueType: string;
    private constructor(value: ValueTypeClassValue | ErrorTypeClass, valueType: string) {
        super('value', value);
        this.valueType = valueType;
    }

    static create(ctx: ValueContext): NormalValueTypeClass {
        if (
            !ctx.NULL() &&
            !ctx.BooleanLiteral() &&
            !ctx.signedNumber() &&
            !ctx.StringLiteral() &&
            !ctx.MultilineStringLiteral() &&
            !ctx.DateLiteral() &&
            !ctx.dateFormula() &&
            !ctx.IntegralCurrencyLiteral() &&
            !ctx.IntegerLiteral() &&
            !ctx.subQuery() &&
            !ctx.valueList() &&
            !ctx.boundExpression()
        ) {
            throw new Error('値が異常です。ValueContext: ' + ctx.getText());
        }

        let value: ValueTypeClassValue | ErrorTypeClass;
        let valueType: string;
    }
}

export const isNormalValueType = (target: CommonTypeClass): target is NormalValueTypeClass => {
    return target instanceof NormalValueTypeClass;
};

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
          value: QueryType;
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
        const value = new QueryVisitor().visit(ctx.dateFormula());
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
