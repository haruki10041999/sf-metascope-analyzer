import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSNonNullExpression, type TSNonNullExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type TSNonNullExpressionFields = TypeField<'tSNonNullExpression'> & {
    expression: ExpressionTypeClass;
};

export class TSNonNullExpressionTypeClass extends LwcCommonTypeClass<
    'tSNonNullExpression',
    TSNonNullExpressionFields
> {
    private constructor(value: FieldsOf<TSNonNullExpressionFields>, sourceSpan: SourceSpan) {
        super('tSNonNullExpression', value, sourceSpan);
    }

    static create(
        target: TSNonNullExpression,
        originalSource: string,
    ): TSNonNullExpressionTypeClass {
        return new TSNonNullExpressionTypeClass(
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

    getExpression(): TSNonNullExpressionFields['expression'] {
        return this.getFields().expression;
    }
}

export const tSNonNullExpressionTypePair: EvaluatePair<
    TSNonNullExpression,
    TSNonNullExpressionTypeClass
> = makeEvaluatePair(isTSNonNullExpression, (target, originalSource) =>
    TSNonNullExpressionTypeClass.create(target, originalSource),
);

export const isTSNonNullExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSNonNullExpressionTypeClass => target instanceof TSNonNullExpressionTypeClass;
