import { ValueContext } from '@apexdevtools/apex-parser';

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
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ValueType = TypeField<'value'> &
    (
        | {
              valueType:
                  | 'null'
                  | 'boolean'
                  | 'string'
                  | 'longText'
                  | 'date'
                  | 'time'
                  | 'dateTime'
                  | 'currency'
                  | 'integer';
              value: string;
          }
        | {
              valueType: 'number';
              value: SignedNumberTypeClass;
          }
        | {
              valueType: 'dateFormula';
              value: DateFormulaTypeClass;
          }
        | {
              valueType: 'subQuery';
              value: SubQueryTypeClass;
          }
        | {
              valueType: 'list';
              value: ValueListTypeClass;
          }
        | {
              valueType: 'bind';
              value: BoundExpressionTypeClass;
          }
    );

export class ValueTypeClass extends ApexCommonTypeClass<'value', ValueType> {
    private constructor(valueType: Omit<ValueType, 'type'>, sourceSpan: SourceSpan) {
        super('value', valueType, sourceSpan);
    }

    static create(ctx: ValueContext): ValueTypeClass {
        let value: Omit<ValueType, 'type'>;

        if (ctx.NULL()) {
            value = {
                valueType: 'null',
                value: 'null',
            };
        } else if (ctx.BooleanLiteral()) {
            value = {
                valueType: 'boolean',
                value: ctx.BooleanLiteral().getText(),
            };
        } else if (ctx.signedNumber()) {
            value = {
                valueType: 'number',
                value: SignedNumberTypeClass.create(ctx.signedNumber()),
            };
        } else if (ctx.StringLiteral()) {
            value = {
                valueType: 'string',
                value: ctx.StringLiteral().getText(),
            };
        } else if (ctx.MultilineStringLiteral()) {
            value = {
                valueType: 'longText',
                value: ctx.MultilineStringLiteral().getText(),
            };
        } else if (ctx.DateLiteral()) {
            value = {
                valueType: 'date',
                value: ctx.DateLiteral().getText(),
            };
        } else if (ctx.TimeLiteral()) {
            value = {
                valueType: 'time',
                value: ctx.TimeLiteral().getText(),
            };
        } else if (ctx.DateTimeLiteral()) {
            value = {
                valueType: 'dateTime',
                value: ctx.DateTimeLiteral().getText(),
            };
        } else if (ctx.dateFormula()) {
            value = {
                valueType: 'dateFormula',
                value: DateFormulaTypeClass.create(ctx.dateFormula()),
            };
        } else if (ctx.IntegralCurrencyLiteral()) {
            value = {
                valueType: 'currency',
                value: ctx.IntegralCurrencyLiteral().getText(),
            };
        } else if (ctx.IntegerLiteral()) {
            value = {
                valueType: 'integer',
                value: ctx.IntegerLiteral().getText(),
            };
        } else if (ctx.subQuery()) {
            value = {
                valueType: 'subQuery',
                value: SubQueryTypeClass.create(ctx.subQuery()),
            };
        } else if (ctx.valueList()) {
            value = {
                valueType: 'list',
                value: ValueListTypeClass.create(ctx.valueList()),
            };
        } else {
            value = {
                valueType: 'bind',
                value: BoundExpressionTypeClass.create(ctx.boundExpression()),
            };
        }

        return new ValueTypeClass(value, getSourceSpan(ctx));
    }

    getValueType(): ValueType['valueType'] {
        return this.getFields().valueType;
    }

    getValue(): ValueType['value'] {
        return this.getFields().value;
    }
}

export const isValueType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ValueTypeClass => {
    return isSpicifyApexCommonTypeClass('value', target);
};
