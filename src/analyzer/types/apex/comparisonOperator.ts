import { ComparisonOperatorContext } from '@apexdevtools/apex-parser';

const comparisonOperators = [
    '=',
    '!=',
    '<',
    '>',
    '<=',
    '>=',
    'LIKE',
    'IN',
    'NOT IN',
    'INCLUDES',
    'EXCLUDES',
] as const;

type ComparisonOperatorField = (typeof comparisonOperators)[number];

export type ComparisonOperatorType = {
    type: 'comparisonOperator';
    operator: ComparisonOperatorField;
};

export const makeComparisonOperatorType = (
    ctx: ComparisonOperatorContext,
): ComparisonOperatorType => {
    if (ctx.ASSIGN()) {
        return {
            type: 'comparisonOperator',
            operator: '=',
        };
    }

    if (ctx.NOTEQUAL()) {
        return {
            type: 'comparisonOperator',
            operator: '!=',
        };
    }

    if (ctx.LT()) {
        return {
            type: 'comparisonOperator',
            operator: '<',
        };
    }

    if (ctx.GT()) {
        return {
            type: 'comparisonOperator',
            operator: '>',
        };
    }

    if (ctx.LESSANDGREATER()) {
        return {
            type: 'comparisonOperator',
            operator: ctx.LESSANDGREATER().getText() as ComparisonOperatorField,
        };
    }

    if (ctx.LIKE()) {
        return {
            type: 'comparisonOperator',
            operator: 'LIKE',
        };
    }

    if (ctx.IN()) {
        if (ctx.NOT()) {
            return {
                type: 'comparisonOperator',
                operator: 'NOT IN',
            };
        }
        return {
            type: 'comparisonOperator',
            operator: 'IN',
        };
    }

    if (ctx.INCLUDES()) {
        return {
            type: 'comparisonOperator',
            operator: 'INCLUDES',
        };
    }

    if (ctx.EXCLUDES()) {
        return {
            type: 'comparisonOperator',
            operator: 'EXCLUDES',
        };
    }

    throw new Error('値が異常です。ComparisonOperatorContext: ' + ctx.getText());
};
