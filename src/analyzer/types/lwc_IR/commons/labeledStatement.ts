import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isLabeledStatement, type LabeledStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';
import { IdentifierTypeClass } from './identifier';

export type LabeledStatementFields = TypeField<'labeledStatement'> & {
    label: IdentifierTypeClass;
    body: StatementTypeClass;
};

export class LabeledStatementTypeClass extends LwcCommonTypeClass<
    'labeledStatement',
    LabeledStatementFields
> {
    private constructor(value: FieldsOf<LabeledStatementFields>, sourceSpan: SourceSpan) {
        super('labeledStatement', value, sourceSpan);
    }

    static create(target: LabeledStatement, originalSource: string): LabeledStatementTypeClass {
        return new LabeledStatementTypeClass(
            {
                label: IdentifierTypeClass.create(target.label, originalSource),
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

    getLabel(): LabeledStatementFields['label'] {
        return this.getFields().label;
    }

    getBody(): LabeledStatementFields['body'] {
        return this.getFields().body;
    }
}

export const labeledStatementTypePair: EvaluatePair<LabeledStatement, LabeledStatementTypeClass> =
    makeEvaluatePair(isLabeledStatement, (target, originalSource) =>
        LabeledStatementTypeClass.create(target, originalSource),
    );

export const isLabeledStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is LabeledStatementTypeClass => target instanceof LabeledStatementTypeClass;
