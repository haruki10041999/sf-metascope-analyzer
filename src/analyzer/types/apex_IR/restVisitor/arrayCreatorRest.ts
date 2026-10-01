import { ArrayCreatorRestContext } from '@apexdevtools/apex-parser';

import { RestTypeClass } from '.';

import { ExpressionTypeClass, ExpressionVisitor, isExpressionTypeAll } from '../expressionVisitor';
import {
    ArrayInitializerTypeClass,
    VariableVisitor,
    isArrayInitializerType,
} from '../variableVisitor';

import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class ArrayCreatorRestTypeClass extends RestTypeClass<ArrayInitializerTypeClass> {
    private size: ExpressionTypeClass<unknown> | null = null;
    private constructor(
        value: ArrayInitializerTypeClass | null,
        size: ExpressionTypeClass<unknown> | null,
        errorTypeClasses: Record<string, ErrorTypeClass>,
    ) {
        super('arrayCreatorRest', value, errorTypeClasses);
        this.size = size;
    }

    static create(ctx: ArrayCreatorRestContext): ArrayCreatorRestTypeClass {
        if (!ctx) {
            throw new Error('値が異常です。ArrayCreatorRestContext: ' + ctx);
        }

        let value: ArrayInitializerTypeClass | null = null;
        let size: ExpressionTypeClass<unknown> | null = null;
        const errorTypeClasses: Record<string, ErrorTypeClass> = {};

        if (ctx.expression()) {
            const expressionTypeClass = new ExpressionVisitor().visit(ctx.expression());
            if (isExpressionTypeAll(expressionTypeClass)) {
                size = expressionTypeClass;
            } else {
                errorTypeClasses['size'] = expressionTypeClass;
            }
        }

        if (ctx.arrayInitializer()) {
            const variableTypeClass = new VariableVisitor().visit(ctx.arrayInitializer());
            if (isArrayInitializerType(variableTypeClass)) {
                value = variableTypeClass;
            } else if (isErrorType(variableTypeClass)) {
                errorTypeClasses['value'] = variableTypeClass;
            }
        }

        return new ArrayCreatorRestTypeClass(value, size, errorTypeClasses);
    }

    getSize(): ExpressionTypeClass<unknown> | null {
        return this.size;
    }

    isSizeNull(): boolean {
        return this.size === null;
    }
}

export const isArrayCreatorRestType = (
    target: CommonTypeClass,
): target is ArrayCreatorRestTypeClass => {
    return target instanceof ArrayCreatorRestTypeClass;
};

