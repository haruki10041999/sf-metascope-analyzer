import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isSequenceExpression, type SequenceExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type SequenceExpressionFields = TypeField<'sequenceExpression'> & {
    expressions: ExpressionTypeClass[];
};

export class SequenceExpressionTypeClass extends LwcCommonTypeClass<
    'sequenceExpression',
    SequenceExpressionFields
> {
    private constructor(value: FieldsOf<SequenceExpressionFields>, sourceSpan: SourceSpan) {
        super('sequenceExpression', value, sourceSpan);
    }

    static create(target: SequenceExpression, originalSource: string): SequenceExpressionTypeClass {
        return new SequenceExpressionTypeClass(
            {
                expressions: visitNodeList(
                    target.expressions,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getExpressions(): SequenceExpressionFields['expressions'] {
        return this.getFields().expressions;
    }
}

export const sequenceExpressionTypePair: EvaluatePair<
    SequenceExpression,
    SequenceExpressionTypeClass
> = makeEvaluatePair(isSequenceExpression, (target, originalSource) =>
    SequenceExpressionTypeClass.create(target, originalSource),
);

export const isSequenceExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is SequenceExpressionTypeClass => target instanceof SequenceExpressionTypeClass;
