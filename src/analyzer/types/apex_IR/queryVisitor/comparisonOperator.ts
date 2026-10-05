import { ComparisonOperatorContext } from '@apexdevtools/apex-parser';

import { QueryTypeClass } from './index';

import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

type ComparisonOperatorValueType =
    '=' | '!=' | '<' | '>' | '<=' | '>=' | 'LIKE' | 'IN' | 'NOT IN' | 'INCLUDES' | 'EXCLUDES';

export class ComparisonOperatorTypeClass extends QueryTypeClass<ComparisonOperatorValueType> {
    constructor(value: ComparisonOperatorValueType | ErrorTypeClass) {
        super('comparisonOperator', value);
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

        let value: ComparisonOperatorValueType;

        if (ctx.ASSIGN()) {
            value = '=';
        } else if (ctx.NOTEQUAL()) {
            value = '!=';
        } else if (ctx.LT()) {
            value = '<';
        } else if (ctx.GT()) {
            value = '>';
        } else if (ctx.LESSANDGREATER()) {
            value = ctx.LESSANDGREATER().getText() as ComparisonOperatorValueType;
        } else if (ctx.LIKE()) {
            value = 'LIKE';
        } else if (ctx.IN()) {
            if (ctx.NOT()) {
                value = 'NOT IN';
            }
            value = 'IN';
        } else if (ctx.INCLUDES()) {
            value = 'INCLUDES';
        } else {
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
