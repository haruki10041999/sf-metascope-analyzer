import { isBreakStatement, type BreakStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitOptionalNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const breakStatementLabelPairs = lazyPairs(() => [identifierTypePair] as const);

export type BreakStatementFields = {
    label: IdentifierTypeClass | LwcErrorTypeClass | null;
};

export class BreakStatementTypeClass extends LwcCommonTypeClass<'breakStatement'> {
    private readonly value: BreakStatementFields;

    private constructor(value: BreakStatementFields) {
        super('breakStatement');
        this.value = value;
    }

    static create(target: BreakStatement, originalSource: string): BreakStatementTypeClass {
        return new BreakStatementTypeClass({
            label: visitOptionalNode(
                target.label,
                originalSource,
                breakStatementLabelPairs(),
                'BreakStatement.label',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): BreakStatementFields {
        return this.value;
    }

    getLabel(): BreakStatementFields['label'] {
        return this.value.label;
    }
}

export const breakStatementTypePair: EvaluatePair<BreakStatement, BreakStatementTypeClass> =
    makeEvaluatePair(isBreakStatement, (target, originalSource) =>
        BreakStatementTypeClass.create(target, originalSource),
    );

export const isBreakStatementType = (
    target: LwcCommonTypeClass<string>,
): target is BreakStatementTypeClass => target instanceof BreakStatementTypeClass;
