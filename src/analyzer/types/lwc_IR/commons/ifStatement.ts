import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isIfStatement, type IfStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';

export type IfStatementFields = TypeField<'ifStatement'> & {
    test: ExpressionTypeClass;
    consequent: StatementTypeClass;
    alternate: StatementTypeClass | null;
};

export class IfStatementTypeClass extends LwcCommonTypeClass<'ifStatement', IfStatementFields> {
    private constructor(value: FieldsOf<IfStatementFields>, sourceSpan: SourceSpan) {
        super('ifStatement', value, sourceSpan);
    }

    static create(target: IfStatement, originalSource: string): IfStatementTypeClass {
        return new IfStatementTypeClass(
            {
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
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTest(): IfStatementFields['test'] {
        return this.getFields().test;
    }

    getConsequent(): IfStatementFields['consequent'] {
        return this.getFields().consequent;
    }

    getAlternate(): IfStatementFields['alternate'] {
        return this.getFields().alternate;
    }
}

export const ifStatementTypePair: EvaluatePair<IfStatement, IfStatementTypeClass> =
    makeEvaluatePair(isIfStatement, (target, originalSource) =>
        IfStatementTypeClass.create(target, originalSource),
    );

export const isIfStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is IfStatementTypeClass => target instanceof IfStatementTypeClass;
