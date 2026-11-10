import { WhereFieldExpressionContext } from '@apexdevtools/apex-parser';

import { FieldExpressionTypeClass } from '.';

import { ComparisonOperatorTypeClass } from '../queryVisitor';
import { ValueTypeClass } from '../valueVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

/**
 * WHERE の条件 1 つ。文法は `fieldExpression | FORMULA ( StringLiteral ) comparisonOperator value` の 2 通り
 * - field: fieldExpression (演算子と値は fieldExpression の中にある)
 * - formula: `FORMULA('...') 演算子 値`。formula は StringLiteral のソースの文字列 (引用符を含む)
 */
export type WhereFieldExpressionType = TypeField<'whereFieldExpression'> &
    (
        | { kind: 'field'; value: FieldExpressionTypeClass }
        | {
              kind: 'formula';
              formula: string;
              operator: ComparisonOperatorTypeClass;
              right: ValueTypeClass;
          }
    );

export class WhereFieldExpressionTypeClass extends ApexCommonTypeClass<
    'whereFieldExpression',
    WhereFieldExpressionType
> {
    private constructor(fields: FieldsOf<WhereFieldExpressionType>, sourceSpan: SourceSpan) {
        super('whereFieldExpression', fields, sourceSpan);
    }

    static create(ctx: WhereFieldExpressionContext): WhereFieldExpressionTypeClass {
        if (ctx.fieldExpression()) {
            return new WhereFieldExpressionTypeClass(
                {
                    kind: 'field',
                    value: createNode(
                        ctx.fieldExpression(),
                        (c) => FieldExpressionTypeClass.create(c),
                        'fieldExpression',
                    ),
                },
                getSourceSpan(ctx),
            );
        }

        if (!ctx.FORMULA() || !ctx.StringLiteral()) {
            throw new Error('値が異常です。WhereFieldExpressionContext: ' + ctx.getText());
        }

        return new WhereFieldExpressionTypeClass(
            {
                kind: 'formula',
                formula: ctx.StringLiteral().getText(),
                operator: createNode(
                    ctx.comparisonOperator(),
                    (c) => ComparisonOperatorTypeClass.create(c),
                    'comparisonOperator',
                ),
                right: createNode(ctx.value(), (c) => ValueTypeClass.create(c), 'value'),
            },
            getSourceSpan(ctx),
        );
    }

    getKind(): WhereFieldExpressionType['kind'] {
        return this.getFields().kind;
    }
}

export const isWhereFieldExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is WhereFieldExpressionTypeClass =>
    isSpicifyApexCommonTypeClass('whereFieldExpression', target);
