import { SetCreatorRestContext } from '@apexdevtools/apex-parser';

import { RestTypeClass } from '.';

import { ExpressionTypeClass, ExpressionVisitor, isExpressionTypeAll } from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class SetCreatorRestTypeClass extends RestTypeClass<ExpressionTypeClass<unknown>[]> {
    private constructor(
        value: ExpressionTypeClass<unknown>[] | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('setCreatorRest', value, errorClasses);
    }

    static create(ctx: SetCreatorRestContext): SetCreatorRestTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length === 0) {
            throw new Error('値が異常です。SetCreatorRestContext: ' + ctx.getText());
        }

        const value: ExpressionTypeClass<unknown>[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        ctx.expression_list().forEach((expressionCtx, index) => {
            const expressionTypeClass = new ExpressionVisitor().visit(expressionCtx);
            if (isExpressionTypeAll(expressionTypeClass)) {
                value.push(expressionTypeClass);
            } else {
                errorClasses[`value_${index}`] = expressionTypeClass;
            }
        });

        return new SetCreatorRestTypeClass(value, errorClasses);
    }
}

export const isSetCreatorRestType = (
    target: CommonTypeClass,
): target is SetCreatorRestTypeClass => {
    return target instanceof SetCreatorRestTypeClass;
};

