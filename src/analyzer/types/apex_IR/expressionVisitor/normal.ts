import { ExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

export class NormalExpressionTypeClass extends ExpressionTypeClass<string> {
    private constructor(value: string) {
        super('expression', value);
    }

    static create(ctx: ExpressionContext): NormalExpressionTypeClass {
        return new NormalExpressionTypeClass(ctx.getText());
    }
}

export const isNormalExpressionType = (
    target: CommonTypeClass,
): target is NormalExpressionTypeClass => {
    return target instanceof NormalExpressionTypeClass;
};

