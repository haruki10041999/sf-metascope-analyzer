import { isArrayExpression, isExpression, ArrayExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
} from '../commonVisitor';
import { ExpressionTypeClass, ExpressionVisitor } from '../expression';
import { SpreadElementTypeClass } from './spreadElement';

export class ArrayExpressionTypeClass extends LwcCommonTypeClass<'arrayExpression'> {
    private value: (null | ExpressionTypeClass | SpreadElementTypeClass | LwcErrorTypeClass)[];

    private constructor(
        value: (null | ExpressionTypeClass | SpreadElementTypeClass | LwcErrorTypeClass)[],
        originalSource: string,
    ) {
        super('arrayExpression', originalSource);
        this.value = value;
    }

    static create(target: ArrayExpression, originalSource: string): ArrayExpressionTypeClass {
        return new ArrayExpressionTypeClass(
            target.elements.map((value) => {
                if (value) {
                    if (isExpression(value)) {
                        return new ExpressionVisitor().visit(value, originalSource);
                    } else {
                        return SpreadElementTypeClass.create(value, originalSource);
                    }
                } else {
                    return null;
                }
            }),
            originalSource,
        );
    }

    getValue(): (null | ExpressionTypeClass | SpreadElementTypeClass | LwcErrorTypeClass)[] {
        return this.value;
    }
}

export const arrayExpressionTypePair: EvaluatePair<ArrayExpression, ArrayExpressionTypeClass> =
    makeEvaluatePair(isArrayExpression, (target, originalSource) =>
        ArrayExpressionTypeClass.create(target, originalSource),
    );

export const isArrayExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is ArrayExpressionTypeClass => target instanceof ArrayExpressionTypeClass;
