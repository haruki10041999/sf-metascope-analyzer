import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isForStatement, type ForStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
    getSourceSpan,
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

export type ForStatementFields = TypeField<'forStatement'> & {
    init: VariableDeclarationTypeClass | ExpressionTypeClass | null;
    test: ExpressionTypeClass | null;
    update: ExpressionTypeClass | null;
    body: StatementTypeClass;
};

export class ForStatementTypeClass extends LwcCommonTypeClass<'forStatement', ForStatementFields> {
    private constructor(value: FieldsOf<ForStatementFields>, sourceSpan: SourceSpan) {
        super('forStatement', value, sourceSpan);
    }

    static create(target: ForStatement, originalSource: string): ForStatementTypeClass {
        return new ForStatementTypeClass(
            {
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
            },
            getSourceSpan(target, originalSource),
        );
    }

    getInit(): ForStatementFields['init'] {
        return this.getFields().init;
    }

    getTest(): ForStatementFields['test'] {
        return this.getFields().test;
    }

    getUpdate(): ForStatementFields['update'] {
        return this.getFields().update;
    }

    getBody(): ForStatementFields['body'] {
        return this.getFields().body;
    }
}

export const forStatementTypePair: EvaluatePair<ForStatement, ForStatementTypeClass> =
    makeEvaluatePair(isForStatement, (target, originalSource) =>
        ForStatementTypeClass.create(target, originalSource),
    );

export const isForStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ForStatementTypeClass => target instanceof ForStatementTypeClass;
