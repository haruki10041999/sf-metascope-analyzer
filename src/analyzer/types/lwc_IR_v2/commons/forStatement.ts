import { isForStatement, type ForStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';
import {
    variableDeclarationTypePair,
    type VariableDeclarationTypeClass,
} from './variableDeclaration';

const forStatementInitPairs = lazyPairs(
    () => [variableDeclarationTypePair, ...expressionVisitorEvaluatePairs()] as const,
);

export type ForStatementFields = {
    init: VariableDeclarationTypeClass | ExpressionTypeClass | LwcErrorTypeClass | null;
    test: ExpressionTypeClass | LwcErrorTypeClass | null;
    update: ExpressionTypeClass | LwcErrorTypeClass | null;
    body: StatementTypeClass | LwcErrorTypeClass;
};

export class ForStatementTypeClass extends LwcCommonTypeClass<'forStatement'> {
    private readonly value: ForStatementFields;

    private constructor(value: ForStatementFields) {
        super('forStatement');
        this.value = value;
    }

    static create(target: ForStatement, originalSource: string): ForStatementTypeClass {
        return new ForStatementTypeClass({
            init: visitOptionalNode(
                target.init,
                originalSource,
                forStatementInitPairs(),
                'ForStatement.init',
            ),
            test: visitOptionalNode(
                target.test,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            update: visitOptionalNode(
                target.update,
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
    override getFields(): ForStatementFields {
        return this.value;
    }

    getInit(): ForStatementFields['init'] {
        return this.value.init;
    }

    getTest(): ForStatementFields['test'] {
        return this.value.test;
    }

    getUpdate(): ForStatementFields['update'] {
        return this.value.update;
    }

    getBody(): ForStatementFields['body'] {
        return this.value.body;
    }
}

export const forStatementTypePair: EvaluatePair<ForStatement, ForStatementTypeClass> =
    makeEvaluatePair(isForStatement, (target, originalSource) =>
        ForStatementTypeClass.create(target, originalSource),
    );

export const isForStatementType = (
    target: LwcCommonTypeClass<string>,
): target is ForStatementTypeClass => target instanceof ForStatementTypeClass;
