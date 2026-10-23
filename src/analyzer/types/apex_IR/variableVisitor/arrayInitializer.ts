import { ArrayInitializerContext } from '@apexdevtools/apex-parser';

import { VariableListTypeClass } from '.';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class ArrayInitializerTypeClass extends VariableListTypeClass<
    'arrayInitializer',
    BasedExpressionTypeClass
> {
    private constructor(value: (BasedExpressionTypeClass | ErrorTypeClass)[]) {
        super('arrayInitializer', value);
    }

    public static create(ctx: ArrayInitializerContext) {
        return new ArrayInitializerTypeClass(
            isValidClassList(
                ctx.expression_list(),
                (ctx) => new ExpressionVisitor().visit(ctx),
                isBasedExpressionType,
                'expression',
            ),
        );
    }
}

export const isArrayInitializerType = (
    target: CommonTypeClass<string>,
): target is ArrayInitializerTypeClass => {
    return target instanceof ArrayInitializerTypeClass;
};

