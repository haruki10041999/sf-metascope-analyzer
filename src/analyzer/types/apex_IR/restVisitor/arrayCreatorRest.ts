import { ArrayCreatorRestContext } from '@apexdevtools/apex-parser';

import { RestTypeClass } from '.';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ArrayInitializerTypeClass,
    VariableVisitor,
    isArrayInitializerType,
} from '../variableVisitor';

import { ApexErrorTypeClass, ApexCommonTypeClass, visitOptionalNode } from '../commonVisitor';

export class ArrayCreatorRestTypeClass extends RestTypeClass<
    'arrayCreatorRest',
    ArrayInitializerTypeClass | null
> {
    private size: BasedExpressionTypeClass | ApexErrorTypeClass | null = null;
    private constructor(
        value: ArrayInitializerTypeClass | ApexErrorTypeClass | null,
        size: BasedExpressionTypeClass | ApexErrorTypeClass | null,
    ) {
        super('arrayCreatorRest', value);
        this.size = size;
    }

    static create(ctx: ArrayCreatorRestContext): ArrayCreatorRestTypeClass {
        if (!ctx.expression() && !ctx.arrayInitializer()) {
            throw new Error('値が異常です。ArrayCreatorRestContext: ' + ctx.getText());
        }

        const value = visitOptionalNode(
            new VariableVisitor(),
            ctx.arrayInitializer(),
            isArrayInitializerType,
            'arrayInitializer',
        );

        const size = visitOptionalNode(
            new ExpressionVisitor(),
            ctx.expression(),
            isBasedExpressionType,
            'expression',
        );

        return new ArrayCreatorRestTypeClass(value, size);
    }

    getSize(): BasedExpressionTypeClass | ApexErrorTypeClass | null {
        return this.size;
    }
}

export const isArrayCreatorRestType = (
    target: ApexCommonTypeClass<string>,
): target is ArrayCreatorRestTypeClass => {
    return target instanceof ArrayCreatorRestTypeClass;
};
