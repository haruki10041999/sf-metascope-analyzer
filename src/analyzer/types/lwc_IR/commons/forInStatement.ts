import { isForInStatement, type ForInStatement } from '@babel/types';
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

const forInStatementLeftPairs = lazyPairs(
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

export type ForInStatementFields = {
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
};

export class ForInStatementTypeClass extends LwcCommonTypeClass<'forInStatement'> {
    private readonly value: ForInStatementFields;

    private constructor(value: ForInStatementFields) {
        super('forInStatement');
        this.value = value;
    }

    static create(target: ForInStatement, originalSource: string): ForInStatementTypeClass {
        return new ForInStatementTypeClass({
            left: visitNode(
                target.left,
                originalSource,
                forInStatementLeftPairs(),
                'ForInStatement.left',
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
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ForInStatementFields {
        return this.value;
    }

    getLeft(): ForInStatementFields['left'] {
        return this.value.left;
    }

    getRight(): ForInStatementFields['right'] {
        return this.value.right;
    }

    getBody(): ForInStatementFields['body'] {
        return this.value.body;
    }
}

export const forInStatementTypePair: EvaluatePair<ForInStatement, ForInStatementTypeClass> =
    makeEvaluatePair(isForInStatement, (target, originalSource) =>
        ForInStatementTypeClass.create(target, originalSource),
    );

export const isForInStatementType = (
    target: LwcCommonTypeClass<string>,
): target is ForInStatementTypeClass => target instanceof ForInStatementTypeClass;
