import { SetCreatorRestContext } from '@apexdevtools/apex-parser';

import { RestListTypeClass } from '.';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNodeList } from '../commonVisitor';

export class SetCreatorRestTypeClass extends RestListTypeClass<
    'setCreatorRest',
    BasedExpressionTypeClass
> {
    private constructor(value: (BasedExpressionTypeClass | ApexErrorTypeClass)[]) {
        super('setCreatorRest', value);
    }

    static create(ctx: SetCreatorRestContext): SetCreatorRestTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length === 0) {
            throw new Error('値が異常です。SetCreatorRestContext: ' + ctx.getText());
        }

        return new SetCreatorRestTypeClass(
            visitNodeList(
                new ExpressionVisitor(),
                ctx.expression_list(),
                isBasedExpressionType,
                'expression',
            ),
        );
    }
}

export const isSetCreatorRestType = (
    target: ApexCommonTypeClass<string>,
): target is SetCreatorRestTypeClass => {
    return target instanceof SetCreatorRestTypeClass;
};
