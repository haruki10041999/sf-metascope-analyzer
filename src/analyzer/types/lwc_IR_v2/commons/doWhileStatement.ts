import { isDoWhileStatement, type DoWhileStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';

export type DoWhileStatementFields = {
    test: ExpressionTypeClass | LwcErrorTypeClass;
    body: StatementTypeClass | LwcErrorTypeClass;
};

export class DoWhileStatementTypeClass extends LwcCommonTypeClass<'doWhileStatement'> {
    private readonly value: DoWhileStatementFields;

    private constructor(value: DoWhileStatementFields) {
        super('doWhileStatement');
        this.value = value;
    }

    static create(target: DoWhileStatement, originalSource: string): DoWhileStatementTypeClass {
        return new DoWhileStatementTypeClass({
            test: visitNode(
                target.test,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            body: visitNode(
                target.body,
                originalSource,
                statementVisitorEvaluatePairs(),
                'StatementVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): DoWhileStatementFields {
        return this.value;
    }

    getTest(): DoWhileStatementFields['test'] {
        return this.value.test;
    }

    getBody(): DoWhileStatementFields['body'] {
        return this.value.body;
    }
}

export const doWhileStatementTypePair: EvaluatePair<DoWhileStatement, DoWhileStatementTypeClass> =
    makeEvaluatePair(isDoWhileStatement, (target, originalSource) =>
        DoWhileStatementTypeClass.create(target, originalSource),
    );

export const isDoWhileStatementType = (
    target: LwcCommonTypeClass<string>,
): target is DoWhileStatementTypeClass => target instanceof DoWhileStatementTypeClass;
