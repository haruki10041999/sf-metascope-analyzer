import { SetCreatorRestContext } from '@apexdevtools/apex-parser';

import { RestListTypeClass } from '.';

import {
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class SetCreatorRestTypeClass extends RestListTypeClass<ExpressionAllTypeClass> {
    private constructor(value: (ExpressionAllTypeClass | ErrorTypeClass)[]) {
        super('setCreatorRest', value);
    }

    static create(ctx: SetCreatorRestContext): SetCreatorRestTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length === 0) {
            throw new Error('値が異常です。SetCreatorRestContext: ' + ctx.getText());
        }

        return new SetCreatorRestTypeClass(
            isValidClassList(
                ctx.expression_list(),
                (ctx) => new ExpressionVisitor().visit(ctx),
                isExpressionTypeAll,
                'expression',
            ),
        );
    }
}

export const isSetCreatorRestType = (
    target: CommonTypeClass,
): target is SetCreatorRestTypeClass => {
    return target instanceof SetCreatorRestTypeClass;
};

