import { ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass as expressionTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

export class ExpressionTypeClass extends expressionTypeClass {
    private constructor(value: string) {
        super('expression', value, []);
    }

    static create(ctx: ExpressionContext): ExpressionTypeClass {
        if (!ctx) {
            throw new Error('値が異常です。ExpressionContext: ' + ctx);
        }

        return new ExpressionTypeClass(ctx.getText());
    }
}

export const isExpressionType = (target: CommonTypeClass): target is ExpressionTypeClass => {
    return target instanceof ExpressionTypeClass;
};
