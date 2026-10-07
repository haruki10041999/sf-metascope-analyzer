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
import { SignedNumberTypeClass, LiteralVisitor, isSignedNumberType } from '../literalVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

type ValueTypeClassValue =
    | string
    | SignedNumberTypeClass
    | DateFormulaTypeClass
    | SubQueryTypeClass
    | ValueListTypeClass
    | BoundExpressionTypeClass;

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
            !ctx.TimeLiteral() &&
            !ctx.DateTimeLiteral() &&
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

        if (ctx.NULL()) {
            value = 'null';
            valueType = 'null';
        } else if (ctx.BooleanLiteral()) {
            value = ctx.BooleanLiteral().getText();
            valueType = 'boolean';
        } else if (ctx.signedNumber()) {
            value = isValidClass(
                new LiteralVisitor().visit(ctx.signedNumber()),
                isSignedNumberType,
                'signedNumber',
            );
            valueType = 'signedNumber';
        } else if (ctx.StringLiteral()) {
            value = ctx.StringLiteral().getText();
            valueType = 'string';
        } else if (ctx.MultilineStringLiteral()) {
            value = ctx.MultilineStringLiteral().getText();
            valueType = 'multilineString';
        } else if (ctx.DateLiteral()) {
            value = ctx.DateLiteral().getText();
            valueType = 'date';
        } else if (ctx.TimeLiteral()) {
            value = ctx.TimeLiteral().getText();
            valueType = 'time';
        } else if (ctx.DateTimeLiteral()) {
            value = ctx.DateTimeLiteral().getText();
            valueType = 'dateTime';
        } else if (ctx.dateFormula()) {
            value = isValidClass(
                new QueryVisitor().visit(ctx.dateFormula()),
                isDateFormulaType,
                'dateFormula',
            );
            valueType = 'dateFormula';
        } else if (ctx.IntegralCurrencyLiteral()) {
            value = ctx.IntegralCurrencyLiteral().getText();
            valueType = 'integralCurrency';
        } else if (ctx.IntegerLiteral()) {
            value = ctx.IntegerLiteral().getText();
            valueType = 'integer';
        } else if (ctx.subQuery()) {
            value = isValidClass(
                new QueryVisitor().visit(ctx.subQuery()),
                isSubQueryType,
                'subQuery',
            );
            valueType = 'subQuery';
        } else if (ctx.valueList()) {
            value = isValidClass(
                new ListVisitor().visit(ctx.valueList()),
                isValueListType,
                'valueList',
            );
            valueType = 'valueList';
        } else {
            value = isValidClass(
                new ExpressionVisitor().visit(ctx.boundExpression()),
                isBoundExpressionType,
                'boundExpression',
            );
            valueType = 'boundExpression';
        }

        return new NormalValueTypeClass(value, valueType);
    }

    getValueType(): string {
        return this.valueType;
    }
}

export const isNormalValueType = (target: CommonTypeClass): target is NormalValueTypeClass => {
    return target instanceof NormalValueTypeClass;
};

