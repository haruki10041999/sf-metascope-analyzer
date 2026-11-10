import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isReturnStatement, type ReturnStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type ReturnStatementFields = TypeField<'returnStatement'> & {
    argument: ExpressionTypeClass | null;
};

export class ReturnStatementTypeClass extends LwcCommonTypeClass<
    'returnStatement',
    ReturnStatementFields
> {
    private constructor(value: FieldsOf<ReturnStatementFields>, sourceSpan: SourceSpan) {
        super('returnStatement', value, sourceSpan);
    }

    static create(target: ReturnStatement, originalSource: string): ReturnStatementTypeClass {
        return new ReturnStatementTypeClass(
            {
                argument: visitOptionalNode(
                    target.argument,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getArgument(): ReturnStatementFields['argument'] {
        return this.getFields().argument;
    }
}

export const returnStatementTypePair: EvaluatePair<ReturnStatement, ReturnStatementTypeClass> =
    makeEvaluatePair(isReturnStatement, (target, originalSource) =>
        ReturnStatementTypeClass.create(target, originalSource),
    );

export const isReturnStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ReturnStatementTypeClass => target instanceof ReturnStatementTypeClass;
