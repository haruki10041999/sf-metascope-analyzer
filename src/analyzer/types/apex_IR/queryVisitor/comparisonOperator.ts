import { ComparisonOperatorContext } from '@apexdevtools/apex-parser';

import { QueryTypeClass } from './index';

import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

type ComparisonOperatorValueType =
    | '='
    | '!='
    | '<'
    | '>'
    | '<='
    | '>='
    | '<>'
    | 'LIKE'
    | 'IN'
    | 'NOT IN'
    | 'INCLUDES'
    | 'EXCLUDES';

export class ComparisonOperatorTypeClass extends QueryTypeClass<ComparisonOperatorValueType> {
    private constructor(value: ComparisonOperatorValueType | ErrorTypeClass) {
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

        // `<=` / `>=` は LT/GT と ASSIGN の 2 トークンなので、ASSIGN 単体より先に判定する
        if (ctx.LT()) {
            value = ctx.ASSIGN() ? '<=' : '<';
        } else if (ctx.GT()) {
            value = ctx.ASSIGN() ? '>=' : '>';
        } else if (ctx.ASSIGN()) {
            value = '=';
        } else if (ctx.NOTEQUAL()) {
            value = '!=';
        } else if (ctx.LESSANDGREATER()) {
            value = '<>';
        } else if (ctx.LIKE()) {
            value = 'LIKE';
        } else if (ctx.IN()) {
            value = ctx.NOT() ? 'NOT IN' : 'IN';
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

