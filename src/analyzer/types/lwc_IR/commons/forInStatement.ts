import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isForInStatement, isVariableDeclaration, type ForInStatement } from '@babel/types';
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
import { ForHeadDeclarationTypeClass, type ForInHeadKind } from './variableDeclaration';

const forInStatementLeftPairs = lazyPairs(
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

export type ForInStatementFields = TypeField<'forInStatement'> & {
    left:
        | ForHeadDeclarationTypeClass<ForInHeadKind>
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
};

export class ForInStatementTypeClass extends LwcCommonTypeClass<
    'forInStatement',
    ForInStatementFields
> {
    private constructor(value: FieldsOf<ForInStatementFields>, sourceSpan: SourceSpan) {
        super('forInStatement', value, sourceSpan);
    }

    static create(target: ForInStatement, originalSource: string): ForInStatementTypeClass {
        return new ForInStatementTypeClass(
            {
                left: isVariableDeclaration(target.left)
                    ? ForHeadDeclarationTypeClass.createForIn(target.left, originalSource)
                    : visitNode(
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
            },
            getSourceSpan(target, originalSource),
        );
    }

    getLeft(): ForInStatementFields['left'] {
        return this.getFields().left;
    }

    getRight(): ForInStatementFields['right'] {
        return this.getFields().right;
    }

    getBody(): ForInStatementFields['body'] {
        return this.getFields().body;
    }
}

export const forInStatementTypePair: EvaluatePair<ForInStatement, ForInStatementTypeClass> =
    makeEvaluatePair(isForInStatement, (target, originalSource) =>
        ForInStatementTypeClass.create(target, originalSource),
    );

export const isForInStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ForInStatementTypeClass => target instanceof ForInStatementTypeClass;
