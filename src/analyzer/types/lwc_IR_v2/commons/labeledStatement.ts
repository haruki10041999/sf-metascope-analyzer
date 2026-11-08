import { isLabeledStatement, type LabeledStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const labeledStatementLabelPairs = lazyPairs(() => [identifierTypePair] as const);

export type LabeledStatementFields = {
    label: IdentifierTypeClass | LwcErrorTypeClass;
    body: StatementTypeClass | LwcErrorTypeClass;
};

export class LabeledStatementTypeClass extends LwcCommonTypeClass<'labeledStatement'> {
    private readonly value: LabeledStatementFields;

    private constructor(value: LabeledStatementFields) {
        super('labeledStatement');
        this.value = value;
    }

    static create(target: LabeledStatement, originalSource: string): LabeledStatementTypeClass {
        return new LabeledStatementTypeClass({
            label: visitNode(
                target.label,
                originalSource,
                labeledStatementLabelPairs(),
                'LabeledStatement.label',
            ),
            body: visitNode(
                target.body,
                originalSource,
                statementVisitorEvaluatePairs(),
                'StatementVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): LabeledStatementFields {
        return this.value;
    }

    getLabel(): LabeledStatementFields['label'] {
        return this.value.label;
    }

    getBody(): LabeledStatementFields['body'] {
        return this.value.body;
    }
}

export const labeledStatementTypePair: EvaluatePair<LabeledStatement, LabeledStatementTypeClass> =
    makeEvaluatePair(isLabeledStatement, (target, originalSource) =>
        LabeledStatementTypeClass.create(target, originalSource),
    );

export const isLabeledStatementType = (
    target: LwcCommonTypeClass<string>,
): target is LabeledStatementTypeClass => target instanceof LabeledStatementTypeClass;
