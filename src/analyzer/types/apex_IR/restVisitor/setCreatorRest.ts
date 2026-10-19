import { SetCreatorRestContext } from '@apexdevtools/apex-parser';

import { RestListTypeClass } from '.';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionTypeClass,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class SetCreatorRestTypeClass extends RestListTypeClass<BasedExpressionTypeClass> {
    private constructor(value: (BasedExpressionTypeClass | ErrorTypeClass)[]) {
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
                isBasedExpressionTypeClass,
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

