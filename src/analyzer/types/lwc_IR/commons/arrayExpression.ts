import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isArrayExpression, type ArrayExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNullableNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { spreadElementTypePair, type SpreadElementTypeClass } from './spreadElement';

const arrayExpressionElementsPairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), spreadElementTypePair] as const,
);

export type ArrayExpressionFields = TypeField<'arrayExpression'> & {
    elements: (ExpressionTypeClass | SpreadElementTypeClass | null)[];
};

export class ArrayExpressionTypeClass extends LwcCommonTypeClass<
    'arrayExpression',
    ArrayExpressionFields
> {
    private constructor(value: FieldsOf<ArrayExpressionFields>, sourceSpan: SourceSpan) {
        super('arrayExpression', value, sourceSpan);
    }

    static create(target: ArrayExpression, originalSource: string): ArrayExpressionTypeClass {
        return new ArrayExpressionTypeClass(
            {
                elements: visitNullableNodeList(
                    target.elements,
                    originalSource,
                    arrayExpressionElementsPairs(),
                    'ArrayExpression.elements',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getElements(): ArrayExpressionFields['elements'] {
        return this.getFields().elements;
    }
}

export const arrayExpressionTypePair: EvaluatePair<ArrayExpression, ArrayExpressionTypeClass> =
    makeEvaluatePair(isArrayExpression, (target, originalSource) =>
        ArrayExpressionTypeClass.create(target, originalSource),
    );

export const isArrayExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ArrayExpressionTypeClass => target instanceof ArrayExpressionTypeClass;
