import { ArgumentsContext } from '@apexdevtools/apex-parser';

import { ArgumentsTypeClass } from '.';

import { ExpressionListTypeClass, ListVisitor, isExpressionListType } from '../listVisitor';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class NormalArgumentsTypeClass extends ArgumentsTypeClass<ExpressionListTypeClass> {
    private constructor(value: ExpressionListTypeClass | ErrorTypeClass | null) {
        super('arguments', value);
    }

    static create(ctx: ArgumentsContext): NormalArgumentsTypeClass {
        if (!ctx.LPAREN() || !ctx.RPAREN()) {
            throw new Error('値が異常です。ArgumentsContext: ' + ctx.getText());
        }

        let value: ExpressionListTypeClass | ErrorTypeClass | null = null;

        if (ctx.expressionList()) {
            value = isValidClass(
                new ListVisitor().visit(ctx.expressionList()),
                isExpressionListType,
                'expressionList',
            );
        }

        return new NormalArgumentsTypeClass(value);
    }
}

export const isNormalArgumentsType = (
    target: CommonTypeClass,
): target is NormalArgumentsTypeClass => {
    return target instanceof NormalArgumentsTypeClass;
};
