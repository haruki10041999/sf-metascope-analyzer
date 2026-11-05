import { ArrayInitializerContext } from '@apexdevtools/apex-parser';

import { VariableListTypeClass } from '.';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNodeList } from '../commonVisitor';

export class ArrayInitializerTypeClass extends VariableListTypeClass<
    'arrayInitializer',
    BasedExpressionTypeClass
> {
    private constructor(value: (BasedExpressionTypeClass | ApexErrorTypeClass)[]) {
        super('arrayInitializer', value);
    }

    public static create(ctx: ArrayInitializerContext) {
        return new ArrayInitializerTypeClass(
            visitNodeList(
                new ExpressionVisitor(),
                ctx.expression_list(),
                isBasedExpressionType,
                'expression',
            ),
        );
    }
}

export const isArrayInitializerType = (
    target: ApexCommonTypeClass<string>,
): target is ArrayInitializerTypeClass => {
    return target instanceof ArrayInitializerTypeClass;
};
