import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isBreakStatement, type BreakStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { IdentifierTypeClass } from './identifier';

export type BreakStatementFields = TypeField<'breakStatement'> & {
    label: IdentifierTypeClass | null;
};

export class BreakStatementTypeClass extends LwcCommonTypeClass<
    'breakStatement',
    BreakStatementFields
> {
    private constructor(value: FieldsOf<BreakStatementFields>, sourceSpan: SourceSpan) {
        super('breakStatement', value, sourceSpan);
    }

    static create(target: BreakStatement, originalSource: string): BreakStatementTypeClass {
        return new BreakStatementTypeClass(
            {
                label:
                    target.label == null
                        ? null
                        : IdentifierTypeClass.create(target.label, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getLabel(): BreakStatementFields['label'] {
        return this.getFields().label;
    }
}

export const breakStatementTypePair: EvaluatePair<BreakStatement, BreakStatementTypeClass> =
    makeEvaluatePair(isBreakStatement, (target, originalSource) =>
        BreakStatementTypeClass.create(target, originalSource),
    );

export const isBreakStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is BreakStatementTypeClass => target instanceof BreakStatementTypeClass;
