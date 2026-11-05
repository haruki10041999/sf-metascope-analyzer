import { isReturnStatement, type ReturnStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitOptionalNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type ReturnStatementFields = {
    argument: ExpressionTypeClass | LwcErrorTypeClass | null;
};

export class ReturnStatementTypeClass extends LwcCommonTypeClass<'returnStatement'> {
    private readonly value: ReturnStatementFields;

    private constructor(value: ReturnStatementFields) {
        super('returnStatement');
        this.value = value;
    }

    static create(target: ReturnStatement, originalSource: string): ReturnStatementTypeClass {
        return new ReturnStatementTypeClass({
            argument: visitOptionalNode(
                target.argument,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ReturnStatementFields {
        return this.value;
    }

    getArgument(): ReturnStatementFields['argument'] {
        return this.value.argument;
    }
}

export const returnStatementTypePair: EvaluatePair<ReturnStatement, ReturnStatementTypeClass> =
    makeEvaluatePair(isReturnStatement, (target, originalSource) =>
        ReturnStatementTypeClass.create(target, originalSource),
    );

export const isReturnStatementType = (
    target: LwcCommonTypeClass<string>,
): target is ReturnStatementTypeClass => target instanceof ReturnStatementTypeClass;
