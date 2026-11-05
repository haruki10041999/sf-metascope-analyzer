import { isThrowStatement, type ThrowStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type ThrowStatementFields = {
    argument: ExpressionTypeClass | LwcErrorTypeClass;
};

export class ThrowStatementTypeClass extends LwcCommonTypeClass<'throwStatement'> {
    private readonly value: ThrowStatementFields;

    private constructor(value: ThrowStatementFields) {
        super('throwStatement');
        this.value = value;
    }

    static create(target: ThrowStatement, originalSource: string): ThrowStatementTypeClass {
        return new ThrowStatementTypeClass({
            argument: visitNode(
                target.argument,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ThrowStatementFields {
        return this.value;
    }

    getArgument(): ThrowStatementFields['argument'] {
        return this.value.argument;
    }
}

export const throwStatementTypePair: EvaluatePair<ThrowStatement, ThrowStatementTypeClass> =
    makeEvaluatePair(isThrowStatement, (target, originalSource) =>
        ThrowStatementTypeClass.create(target, originalSource),
    );

export const isThrowStatementType = (
    target: LwcCommonTypeClass<string>,
): target is ThrowStatementTypeClass => target instanceof ThrowStatementTypeClass;
