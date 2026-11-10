import { ValueContext } from '@apexdevtools/apex-parser';

import { BoundExpressionTypeClass } from '../expressionVisitor';
import { ValueListTypeClass } from '../listVisitor';
import { DateFormulaTypeClass, SubQueryTypeClass } from '../queryVisitor';
import { SignedNumberTypeClass } from '../literalVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ValueType = TypeField<'value'> &
    (
        | {
              kind:
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
              kind: 'number';
              value: SignedNumberTypeClass;
          }
        | {
              kind: 'dateFormula';
              value: DateFormulaTypeClass;
          }
        | {
              kind: 'subQuery';
              value: SubQueryTypeClass;
          }
        | {
              kind: 'list';
              value: ValueListTypeClass;
          }
        | {
              kind: 'bind';
              value: BoundExpressionTypeClass;
          }
    );

export class ValueTypeClass extends ApexCommonTypeClass<'value', ValueType> {
    private constructor(fields: FieldsOf<ValueType>, sourceSpan: SourceSpan) {
        super('value', fields, sourceSpan);
    }

    static create(ctx: ValueContext): ValueTypeClass {
        return new ValueTypeClass(ValueTypeClass.createValue(ctx), getSourceSpan(ctx));
    }

    /** value の選択肢のうち、ある子 (トークン) だけを読む */
    private static createValue(ctx: ValueContext): FieldsOf<ValueType> {
        if (ctx.NULL()) {
            return { kind: 'null', value: 'null' };
        } else if (ctx.BooleanLiteral()) {
            return { kind: 'boolean', value: ctx.BooleanLiteral().getText() };
        } else if (ctx.signedNumber()) {
            return {
                kind: 'number',
                value: createNode(
                    ctx.signedNumber(),
                    (c) => SignedNumberTypeClass.create(c),
                    'signedNumber',
                ),
            };
        } else if (ctx.StringLiteral()) {
            return { kind: 'string', value: ctx.StringLiteral().getText() };
        } else if (ctx.MultilineStringLiteral()) {
            return { kind: 'longText', value: ctx.MultilineStringLiteral().getText() };
        } else if (ctx.DateLiteral()) {
            return { kind: 'date', value: ctx.DateLiteral().getText() };
        } else if (ctx.TimeLiteral()) {
            return { kind: 'time', value: ctx.TimeLiteral().getText() };
        } else if (ctx.DateTimeLiteral()) {
            return { kind: 'dateTime', value: ctx.DateTimeLiteral().getText() };
        } else if (ctx.dateFormula()) {
            return {
                kind: 'dateFormula',
                value: createNode(
                    ctx.dateFormula(),
                    (c) => DateFormulaTypeClass.create(c),
                    'dateFormula',
                ),
            };
        } else if (ctx.IntegralCurrencyLiteral()) {
            return { kind: 'currency', value: ctx.IntegralCurrencyLiteral().getText() };
        } else if (ctx.IntegerLiteral()) {
            return { kind: 'integer', value: ctx.IntegerLiteral().getText() };
        } else if (ctx.subQuery()) {
            return {
                kind: 'subQuery',
                value: createNode(ctx.subQuery(), (c) => SubQueryTypeClass.create(c), 'subQuery'),
            };
        } else if (ctx.valueList()) {
            return {
                kind: 'list',
                value: createNode(
                    ctx.valueList(),
                    (c) => ValueListTypeClass.create(c),
                    'valueList',
                ),
            };
        }
        // どの子もなければ (構文エラーの回復) boundExpression も null になり NULL_CHILD になる
        return {
            kind: 'bind',
            value: createNode(
                ctx.boundExpression(),
                (c) => BoundExpressionTypeClass.create(c),
                'boundExpression',
            ),
        };
    }

    getKind(): ValueType['kind'] {
        return this.getFields().kind;
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
