import { ArgumentsContext } from '@apexdevtools/apex-parser';

import { ArgumentsTypeClass } from '.';

import { ExpressionListTypeClass, ListVisitor, isExpressionListType } from '../listVisitor';

import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class NormalArgumentsTypeClass extends ArgumentsTypeClass<ExpressionListTypeClass> {
    private constructor(
        value: ExpressionListTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('arguments', value, errorClasses);
    }

    static create(ctx: ArgumentsContext): NormalArgumentsTypeClass {
        if (!ctx.LPAREN() || !ctx.RPAREN() || !ctx.expressionList()) {
            throw new Error('値が異常です。ArgumentsContext: ' + ctx.getText());
        }

        let value: ExpressionListTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const listTypeClass = new ListVisitor().visit(ctx.expressionList());
        if (isExpressionListType(listTypeClass)) {
            value = listTypeClass;
        } else if (isErrorType(listTypeClass)) {
            errorClasses['value'] = listTypeClass;
        }

        return new NormalArgumentsTypeClass(value, errorClasses);
    }
}

export const isNormalArgumentsType = (
    target: CommonTypeClass,
): target is NormalArgumentsTypeClass => {
    return target instanceof NormalArgumentsTypeClass;
};
