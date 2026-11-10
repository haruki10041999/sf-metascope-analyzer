import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isParenthesizedExpression, type ParenthesizedExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type ParenthesizedExpressionFields = TypeField<'parenthesizedExpression'> & {
    expression: ExpressionTypeClass;
};

export class ParenthesizedExpressionTypeClass extends LwcCommonTypeClass<
    'parenthesizedExpression',
    ParenthesizedExpressionFields
> {
    private constructor(value: FieldsOf<ParenthesizedExpressionFields>, sourceSpan: SourceSpan) {
        super('parenthesizedExpression', value, sourceSpan);
    }

    static create(
        target: ParenthesizedExpression,
        originalSource: string,
    ): ParenthesizedExpressionTypeClass {
        return new ParenthesizedExpressionTypeClass(
            {
                expression: visitNode(
                    target.expression,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getExpression(): ParenthesizedExpressionFields['expression'] {
        return this.getFields().expression;
    }
}

export const parenthesizedExpressionTypePair: EvaluatePair<
    ParenthesizedExpression,
    ParenthesizedExpressionTypeClass
> = makeEvaluatePair(isParenthesizedExpression, (target, originalSource) =>
    ParenthesizedExpressionTypeClass.create(target, originalSource),
);

export const isParenthesizedExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ParenthesizedExpressionTypeClass => target instanceof ParenthesizedExpressionTypeClass;
