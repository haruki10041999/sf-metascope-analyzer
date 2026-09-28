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
    query: ComparisonOperatorField;
};

export const makeComparisonOperatorType = (
    ctx: ComparisonOperatorContext,
): ComparisonOperatorType => {
    if (ctx.ASSIGN()) {
        return {
            type: 'comparisonOperator',
            query: '=',
        };
    }

    if (ctx.NOTEQUAL()) {
        return {
            type: 'comparisonOperator',
            query: '!=',
        };
    }

    if (ctx.LT()) {
        return {
            type: 'comparisonOperator',
            query: '<',
        };
    }

    if (ctx.GT()) {
        return {
            type: 'comparisonOperator',
            query: '>',
        };
    }

    if (ctx.LESSANDGREATER()) {
        return {
            type: 'comparisonOperator',
            query: ctx.LESSANDGREATER().getText() as ComparisonOperatorField,
        };
    }

    if (ctx.LIKE()) {
        return {
            type: 'comparisonOperator',
            query: 'LIKE',
        };
    }

    if (ctx.IN()) {
        if (ctx.NOT()) {
            return {
                type: 'comparisonOperator',
                query: 'NOT IN',
            };
        }
        return {
            type: 'comparisonOperator',
            query: 'IN',
        };
    }

    if (ctx.INCLUDES()) {
        return {
            type: 'comparisonOperator',
            query: 'INCLUDES',
        };
    }

    if (ctx.EXCLUDES()) {
        return {
            type: 'comparisonOperator',
            query: 'EXCLUDES',
        };
    }

    throw new Error('値が異常です。ComparisonOperatorContext: ' + ctx.getText());
};

