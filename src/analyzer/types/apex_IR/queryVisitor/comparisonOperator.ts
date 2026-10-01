import { ComparisonOperatorContext } from '@apexdevtools/apex-parser';

import { QueryTypeClass } from './index';

import { CommonTypeClass } from '../commonVisitor';

type ComparisonOperatorValueType =
    '=' | '!=' | '<' | '>' | '<=' | '>=' | 'LIKE' | 'IN' | 'NOT IN' | 'INCLUDES' | 'EXCLUDES';

export class ComparisonOperatorTypeClass extends QueryTypeClass<ComparisonOperatorValueType> {
    constructor(value: ComparisonOperatorValueType | null) {
        super('comparisonOperator', value, {});
    }

    static create(ctx: ComparisonOperatorContext): ComparisonOperatorTypeClass {
        if (
            !ctx.ASSIGN() &&
            !ctx.NOTEQUAL() &&
            !ctx.LT() &&
            !ctx.GT() &&
            !ctx.LESSANDGREATER() &&
            !ctx.LIKE() &&
            !ctx.IN() &&
            !ctx.INCLUDES() &&
            !ctx.EXCLUDES()
        ) {
            throw new Error('値が異常です。ComparisonOperatorContext: ' + ctx.getText());
        }

        let value: ComparisonOperatorValueType | null = null;

        if (ctx.ASSIGN()) {
            value = '=';
        }

        if (ctx.NOTEQUAL()) {
            value = '!=';
        }

        if (ctx.LT()) {
            value = '<';
        }

        if (ctx.GT()) {
            value = '>';
        }

        if (ctx.LESSANDGREATER()) {
            value = ctx.LESSANDGREATER().getText() as ComparisonOperatorValueType;
        }

        if (ctx.LIKE()) {
            value = 'LIKE';
        }

        if (ctx.IN()) {
            if (ctx.NOT()) {
                value = 'NOT IN';
            }
            value = 'IN';
        }

        if (ctx.INCLUDES()) {
            value = 'INCLUDES';
        }

        if (ctx.EXCLUDES()) {
            value = 'EXCLUDES';
        }

        return new ComparisonOperatorTypeClass(value);
    }
}

export const isComparisonOperatorType = (
    target: CommonTypeClass,
): target is ComparisonOperatorTypeClass => {
    return target instanceof ComparisonOperatorTypeClass;
};

