import { isArrayExpression, type ArrayExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNullableNodeList,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { spreadElementTypePair, type SpreadElementTypeClass } from './spreadElement';

const arrayExpressionElementsPairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), spreadElementTypePair] as const,
);

export type ArrayExpressionFields = {
    elements: (ExpressionTypeClass | SpreadElementTypeClass | LwcErrorTypeClass | null)[];
};

export class ArrayExpressionTypeClass extends LwcCommonTypeClass<'arrayExpression'> {
    private readonly value: ArrayExpressionFields;

    private constructor(value: ArrayExpressionFields) {
        super('arrayExpression');
        this.value = value;
    }

    static create(target: ArrayExpression, originalSource: string): ArrayExpressionTypeClass {
        return new ArrayExpressionTypeClass({
            elements: visitNullableNodeList(
                target.elements,
                originalSource,
                arrayExpressionElementsPairs(),
                'ArrayExpression.elements',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ArrayExpressionFields {
        return this.value;
    }

    getElements(): ArrayExpressionFields['elements'] {
        return this.value.elements;
    }
}

export const arrayExpressionTypePair: EvaluatePair<ArrayExpression, ArrayExpressionTypeClass> =
    makeEvaluatePair(isArrayExpression, (target, originalSource) =>
        ArrayExpressionTypeClass.create(target, originalSource),
    );

export const isArrayExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is ArrayExpressionTypeClass => target instanceof ArrayExpressionTypeClass;
