import { isIfStatement, type IfStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';

export type IfStatementFields = {
    test: ExpressionTypeClass | LwcErrorTypeClass;
    consequent: StatementTypeClass | LwcErrorTypeClass;
    alternate: StatementTypeClass | LwcErrorTypeClass | null;
};

export class IfStatementTypeClass extends LwcCommonTypeClass<'ifStatement'> {
    private readonly value: IfStatementFields;

    private constructor(value: IfStatementFields) {
        super('ifStatement');
        this.value = value;
    }

    static create(target: IfStatement, originalSource: string): IfStatementTypeClass {
        return new IfStatementTypeClass({
            test: visitNode(
                target.test,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            consequent: visitNode(
                target.consequent,
                originalSource,
                statementVisitorEvaluatePairs(),
                'StatementVisitor',
            ),
            alternate: visitOptionalNode(
                target.alternate,
                originalSource,
                statementVisitorEvaluatePairs(),
                'StatementVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): IfStatementFields {
        return this.value;
    }

    getTest(): IfStatementFields['test'] {
        return this.value.test;
    }

    getConsequent(): IfStatementFields['consequent'] {
        return this.value.consequent;
    }

    getAlternate(): IfStatementFields['alternate'] {
        return this.value.alternate;
    }
}

export const ifStatementTypePair: EvaluatePair<IfStatement, IfStatementTypeClass> =
    makeEvaluatePair(isIfStatement, (target, originalSource) =>
        IfStatementTypeClass.create(target, originalSource),
    );

export const isIfStatementType = (
    target: LwcCommonTypeClass<string>,
): target is IfStatementTypeClass => target instanceof IfStatementTypeClass;
