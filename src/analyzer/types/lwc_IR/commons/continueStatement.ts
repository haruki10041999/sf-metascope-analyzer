import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isContinueStatement, type ContinueStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { IdentifierTypeClass } from './identifier';

export type ContinueStatementFields = TypeField<'continueStatement'> & {
    label: IdentifierTypeClass | null;
};

export class ContinueStatementTypeClass extends LwcCommonTypeClass<
    'continueStatement',
    ContinueStatementFields
> {
    private constructor(value: FieldsOf<ContinueStatementFields>, sourceSpan: SourceSpan) {
        super('continueStatement', value, sourceSpan);
    }

    static create(target: ContinueStatement, originalSource: string): ContinueStatementTypeClass {
        return new ContinueStatementTypeClass(
            {
                label:
                    target.label == null
                        ? null
                        : IdentifierTypeClass.create(target.label, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getLabel(): ContinueStatementFields['label'] {
        return this.getFields().label;
    }
}

export const continueStatementTypePair: EvaluatePair<
    ContinueStatement,
    ContinueStatementTypeClass
> = makeEvaluatePair(isContinueStatement, (target, originalSource) =>
    ContinueStatementTypeClass.create(target, originalSource),
);

export const isContinueStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ContinueStatementTypeClass => target instanceof ContinueStatementTypeClass;
