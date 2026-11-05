import { ArgumentsContext } from '@apexdevtools/apex-parser';

import { ArgumentsTypeClass } from '.';

import { ExpressionListTypeClass, ListVisitor, isExpressionListType } from '../listVisitor';

import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class NormalArgumentsTypeClass extends ArgumentsTypeClass<
    'arguments',
    ExpressionListTypeClass
> {
    private constructor(value: ExpressionListTypeClass | ApexErrorTypeClass | null) {
        super('arguments', value);
    }

    static create(ctx: ArgumentsContext): NormalArgumentsTypeClass {
        if (!ctx.LPAREN() || !ctx.RPAREN()) {
            throw new Error('値が異常です。ArgumentsContext: ' + ctx.getText());
        }

        let value: ExpressionListTypeClass | ApexErrorTypeClass | null = null;

        if (ctx.expressionList()) {
            value = visitNode(
                new ListVisitor(),
                ctx.expressionList(),
                isExpressionListType,
                'expressionList',
            );
        }

        return new NormalArgumentsTypeClass(value);
    }
}

export const isNormalArgumentsType = (
    target: ApexCommonTypeClass<string>,
): target is NormalArgumentsTypeClass => {
    return target instanceof NormalArgumentsTypeClass;
};
