import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isDoWhileStatement, type DoWhileStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';

export type DoWhileStatementFields = TypeField<'doWhileStatement'> & {
    test: ExpressionTypeClass;
    body: StatementTypeClass;
};

export class DoWhileStatementTypeClass extends LwcCommonTypeClass<
    'doWhileStatement',
    DoWhileStatementFields
> {
    private constructor(value: FieldsOf<DoWhileStatementFields>, sourceSpan: SourceSpan) {
        super('doWhileStatement', value, sourceSpan);
    }

    static create(target: DoWhileStatement, originalSource: string): DoWhileStatementTypeClass {
        return new DoWhileStatementTypeClass(
            {
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
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTest(): DoWhileStatementFields['test'] {
        return this.getFields().test;
    }

    getBody(): DoWhileStatementFields['body'] {
        return this.getFields().body;
    }
}

export const doWhileStatementTypePair: EvaluatePair<DoWhileStatement, DoWhileStatementTypeClass> =
    makeEvaluatePair(isDoWhileStatement, (target, originalSource) =>
        DoWhileStatementTypeClass.create(target, originalSource),
    );

export const isDoWhileStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is DoWhileStatementTypeClass => target instanceof DoWhileStatementTypeClass;
