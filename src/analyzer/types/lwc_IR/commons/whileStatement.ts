import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isWhileStatement, type WhileStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';

export type WhileStatementFields = TypeField<'whileStatement'> & {
    test: ExpressionTypeClass;
    body: StatementTypeClass;
};

export class WhileStatementTypeClass extends LwcCommonTypeClass<
    'whileStatement',
    WhileStatementFields
> {
    private constructor(value: FieldsOf<WhileStatementFields>, sourceSpan: SourceSpan) {
        super('whileStatement', value, sourceSpan);
    }

    static create(target: WhileStatement, originalSource: string): WhileStatementTypeClass {
        return new WhileStatementTypeClass(
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

    getTest(): WhileStatementFields['test'] {
        return this.getFields().test;
    }

    getBody(): WhileStatementFields['body'] {
        return this.getFields().body;
    }
}

export const whileStatementTypePair: EvaluatePair<WhileStatement, WhileStatementTypeClass> =
    makeEvaluatePair(isWhileStatement, (target, originalSource) =>
        WhileStatementTypeClass.create(target, originalSource),
    );

export const isWhileStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is WhileStatementTypeClass => target instanceof WhileStatementTypeClass;
