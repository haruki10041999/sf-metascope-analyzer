import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isExpressionStatement, type ExpressionStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type ExpressionStatementFields = TypeField<'expressionStatement'> & {
    expression: ExpressionTypeClass;
};

export class ExpressionStatementTypeClass extends LwcCommonTypeClass<
    'expressionStatement',
    ExpressionStatementFields
> {
    private constructor(value: FieldsOf<ExpressionStatementFields>, sourceSpan: SourceSpan) {
        super('expressionStatement', value, sourceSpan);
    }

    static create(
        target: ExpressionStatement,
        originalSource: string,
    ): ExpressionStatementTypeClass {
        return new ExpressionStatementTypeClass(
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

    getExpression(): ExpressionStatementFields['expression'] {
        return this.getFields().expression;
    }
}

export const expressionStatementTypePair: EvaluatePair<
    ExpressionStatement,
    ExpressionStatementTypeClass
> = makeEvaluatePair(isExpressionStatement, (target, originalSource) =>
    ExpressionStatementTypeClass.create(target, originalSource),
);

export const isExpressionStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ExpressionStatementTypeClass => target instanceof ExpressionStatementTypeClass;
