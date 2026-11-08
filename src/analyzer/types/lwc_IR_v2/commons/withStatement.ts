import { isWithStatement, type WithStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';

export type WithStatementFields = {
    object: ExpressionTypeClass | LwcErrorTypeClass;
    body: StatementTypeClass | LwcErrorTypeClass;
};

export class WithStatementTypeClass extends LwcCommonTypeClass<'withStatement'> {
    private readonly value: WithStatementFields;

    private constructor(value: WithStatementFields) {
        super('withStatement');
        this.value = value;
    }

    static create(target: WithStatement, originalSource: string): WithStatementTypeClass {
        return new WithStatementTypeClass({
            object: visitNode(
                target.object,
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
    override getFields(): WithStatementFields {
        return this.value;
    }

    getObject(): WithStatementFields['object'] {
        return this.value.object;
    }

    getBody(): WithStatementFields['body'] {
        return this.value.body;
    }
}

export const withStatementTypePair: EvaluatePair<WithStatement, WithStatementTypeClass> =
    makeEvaluatePair(isWithStatement, (target, originalSource) =>
        WithStatementTypeClass.create(target, originalSource),
    );

export const isWithStatementType = (
    target: LwcCommonTypeClass<string>,
): target is WithStatementTypeClass => target instanceof WithStatementTypeClass;
