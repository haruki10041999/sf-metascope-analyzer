import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isForOfStatement, isVariableDeclaration, type ForOfStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
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
import { ForHeadDeclarationTypeClass } from './variableDeclaration';

const forOfStatementLeftPairs = lazyPairs(
    () =>
        [
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

export type ForOfStatementFields = TypeField<'forOfStatement'> & {
    left:
        | ForHeadDeclarationTypeClass
        | IdentifierTypeClass
        | MemberExpressionTypeClass
        | ArrayPatternTypeClass
        | ObjectPatternTypeClass
        | TSAsExpressionTypeClass
        | TSSatisfiesExpressionTypeClass
        | TSTypeAssertionTypeClass
        | TSNonNullExpressionTypeClass;
    right: ExpressionTypeClass;
    body: StatementTypeClass;
    await: ForOfStatement['await'];
};

export class ForOfStatementTypeClass extends LwcCommonTypeClass<
    'forOfStatement',
    ForOfStatementFields
> {
    private constructor(value: FieldsOf<ForOfStatementFields>, sourceSpan: SourceSpan) {
        super('forOfStatement', value, sourceSpan);
    }

    static create(target: ForOfStatement, originalSource: string): ForOfStatementTypeClass {
        return new ForOfStatementTypeClass(
            {
                left: isVariableDeclaration(target.left)
                    ? ForHeadDeclarationTypeClass.create(target.left, originalSource)
                    : visitNode(
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
            },
            getSourceSpan(target, originalSource),
        );
    }

    getLeft(): ForOfStatementFields['left'] {
        return this.getFields().left;
    }

    getRight(): ForOfStatementFields['right'] {
        return this.getFields().right;
    }

    getBody(): ForOfStatementFields['body'] {
        return this.getFields().body;
    }

    getAwait(): ForOfStatementFields['await'] {
        return this.getFields().await;
    }
}

export const forOfStatementTypePair: EvaluatePair<ForOfStatement, ForOfStatementTypeClass> =
    makeEvaluatePair(isForOfStatement, (target, originalSource) =>
        ForOfStatementTypeClass.create(target, originalSource),
    );

export const isForOfStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ForOfStatementTypeClass => target instanceof ForOfStatementTypeClass;
