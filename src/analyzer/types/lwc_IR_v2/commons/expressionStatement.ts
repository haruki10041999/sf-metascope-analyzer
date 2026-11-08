import { isExpressionStatement, type ExpressionStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type ExpressionStatementFields = {
    expression: ExpressionTypeClass | LwcErrorTypeClass;
};

export class ExpressionStatementTypeClass extends LwcCommonTypeClass<'expressionStatement'> {
    private readonly value: ExpressionStatementFields;

    private constructor(value: ExpressionStatementFields) {
        super('expressionStatement');
        this.value = value;
    }

    static create(
        target: ExpressionStatement,
        originalSource: string,
    ): ExpressionStatementTypeClass {
        return new ExpressionStatementTypeClass({
            expression: visitNode(
                target.expression,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ExpressionStatementFields {
        return this.value;
    }

    getExpression(): ExpressionStatementFields['expression'] {
        return this.value.expression;
    }
}

export const expressionStatementTypePair: EvaluatePair<
    ExpressionStatement,
    ExpressionStatementTypeClass
> = makeEvaluatePair(isExpressionStatement, (target, originalSource) =>
    ExpressionStatementTypeClass.create(target, originalSource),
);

export const isExpressionStatementType = (
    target: LwcCommonTypeClass<string>,
): target is ExpressionStatementTypeClass => target instanceof ExpressionStatementTypeClass;
