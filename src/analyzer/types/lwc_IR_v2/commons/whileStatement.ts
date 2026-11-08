import { isWhileStatement, type WhileStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';

export type WhileStatementFields = {
    test: ExpressionTypeClass | LwcErrorTypeClass;
    body: StatementTypeClass | LwcErrorTypeClass;
};

export class WhileStatementTypeClass extends LwcCommonTypeClass<'whileStatement'> {
    private readonly value: WhileStatementFields;

    private constructor(value: WhileStatementFields) {
        super('whileStatement');
        this.value = value;
    }

    static create(target: WhileStatement, originalSource: string): WhileStatementTypeClass {
        return new WhileStatementTypeClass({
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
    override getFields(): WhileStatementFields {
        return this.value;
    }

    getTest(): WhileStatementFields['test'] {
        return this.value.test;
    }

    getBody(): WhileStatementFields['body'] {
        return this.value.body;
    }
}

export const whileStatementTypePair: EvaluatePair<WhileStatement, WhileStatementTypeClass> =
    makeEvaluatePair(isWhileStatement, (target, originalSource) =>
        WhileStatementTypeClass.create(target, originalSource),
    );

export const isWhileStatementType = (
    target: LwcCommonTypeClass<string>,
): target is WhileStatementTypeClass => target instanceof WhileStatementTypeClass;
