import { ArrayInitializerContext } from '@apexdevtools/apex-parser';

import { VariableListTypeClass } from '.';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClassList } from '../commonVisitor';

export class ArrayInitializerTypeClass extends VariableListTypeClass<
    'arrayInitializer',
    BasedExpressionTypeClass
> {
    private constructor(value: (BasedExpressionTypeClass | ApexErrorTypeClass)[]) {
        super('arrayInitializer', value);
    }

    public static create(ctx: ArrayInitializerContext) {
        return new ArrayInitializerTypeClass(
            isApexValidClassList(
                ctx.expression_list(),
                (ctx) => new ExpressionVisitor().visit(ctx),
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

