import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isWithStatement, type WithStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';

export type WithStatementFields = TypeField<'withStatement'> & {
    object: ExpressionTypeClass;
    body: StatementTypeClass;
};

export class WithStatementTypeClass extends LwcCommonTypeClass<
    'withStatement',
    WithStatementFields
> {
    private constructor(value: FieldsOf<WithStatementFields>, sourceSpan: SourceSpan) {
        super('withStatement', value, sourceSpan);
    }

    static create(target: WithStatement, originalSource: string): WithStatementTypeClass {
        return new WithStatementTypeClass(
            {
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
            },
            getSourceSpan(target, originalSource),
        );
    }

    getObject(): WithStatementFields['object'] {
        return this.getFields().object;
    }

    getBody(): WithStatementFields['body'] {
        return this.getFields().body;
    }
}

export const withStatementTypePair: EvaluatePair<WithStatement, WithStatementTypeClass> =
    makeEvaluatePair(isWithStatement, (target, originalSource) =>
        WithStatementTypeClass.create(target, originalSource),
    );

export const isWithStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is WithStatementTypeClass => target instanceof WithStatementTypeClass;
