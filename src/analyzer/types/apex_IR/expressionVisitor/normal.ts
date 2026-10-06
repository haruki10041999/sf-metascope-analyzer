import { ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

export class NormalExpressionTypeClass extends ExpressionTypeClass<string> {
    private constructor(value: string) {
        super('expression', value);
    }

    static create(ctx: ExpressionContext): NormalExpressionTypeClass {
        if (!ctx) {
            throw new Error('値が異常です。ExpressionContext: ' + ctx);
        }

        return new NormalExpressionTypeClass(ctx.getText());
    }
}

export const isNormalExpressionType = (
    target: CommonTypeClass,
): target is NormalExpressionTypeClass => {
    return target instanceof NormalExpressionTypeClass;
};

