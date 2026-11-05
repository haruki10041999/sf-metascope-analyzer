import { isForOfStatement, type ForOfStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';
import { arrayPatternTypePair, type ArrayPatternTypeClass } from './arrayPattern';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { memberExpressionTypePair, type MemberExpressionTypeClass } from './memberExpression';
import { objectPatternTypePair, type ObjectPatternTypeClass } from './objectPattern';
import { tSAsExpressionTypePair, type TSAsExpressionTypeClass } from './tSAsExpression';
import {
    tSNonNullExpressionTypePair,
    type TSNonNullExpressionTypeClass,
} from './tSNonNullExpression';
import {
    tSSatisfiesExpressionTypePair,
    type TSSatisfiesExpressionTypeClass,
} from './tSSatisfiesExpression';
import { tSTypeAssertionTypePair, type TSTypeAssertionTypeClass } from './tSTypeAssertion';
import {
    variableDeclarationTypePair,
    type VariableDeclarationTypeClass,
} from './variableDeclaration';

const forOfStatementLeftPairs = lazyPairs(
    () =>
        [
            variableDeclarationTypePair,
            identifierTypePair,
            memberExpressionTypePair,
            arrayPatternTypePair,
            objectPatternTypePair,
            tSAsExpressionTypePair,
            tSSatisfiesExpressionTypePair,
            tSTypeAssertionTypePair,
            tSNonNullExpressionTypePair,
        ] as const,
);

export type ForOfStatementFields = {
    left:
        | VariableDeclarationTypeClass
        | IdentifierTypeClass
        | MemberExpressionTypeClass
        | ArrayPatternTypeClass
        | ObjectPatternTypeClass
        | TSAsExpressionTypeClass
        | TSSatisfiesExpressionTypeClass
        | TSTypeAssertionTypeClass
        | TSNonNullExpressionTypeClass
        | LwcErrorTypeClass;
    right: ExpressionTypeClass | LwcErrorTypeClass;
    body: StatementTypeClass | LwcErrorTypeClass;
    await: ForOfStatement['await'];
};

export class ForOfStatementTypeClass extends LwcCommonTypeClass<'forOfStatement'> {
    private readonly value: ForOfStatementFields;

    private constructor(value: ForOfStatementFields) {
        super('forOfStatement');
        this.value = value;
    }

    static create(target: ForOfStatement, originalSource: string): ForOfStatementTypeClass {
        return new ForOfStatementTypeClass({
            left: visitNode(
                target.left,
                originalSource,
                forOfStatementLeftPairs(),
                'ForOfStatement.left',
            ),
            right: visitNode(
                target.right,
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
            await: target.await,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ForOfStatementFields {
        return this.value;
    }

    getLeft(): ForOfStatementFields['left'] {
        return this.value.left;
    }

    getRight(): ForOfStatementFields['right'] {
        return this.value.right;
    }

    getBody(): ForOfStatementFields['body'] {
        return this.value.body;
    }

    getAwait(): ForOfStatementFields['await'] {
        return this.value.await;
    }
}

export const forOfStatementTypePair: EvaluatePair<ForOfStatement, ForOfStatementTypeClass> =
    makeEvaluatePair(isForOfStatement, (target, originalSource) =>
        ForOfStatementTypeClass.create(target, originalSource),
    );

export const isForOfStatementType = (
    target: LwcCommonTypeClass<string>,
): target is ForOfStatementTypeClass => target instanceof ForOfStatementTypeClass;
