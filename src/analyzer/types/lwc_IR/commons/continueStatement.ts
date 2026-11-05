import { isContinueStatement, type ContinueStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitOptionalNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const continueStatementLabelPairs = lazyPairs(() => [identifierTypePair] as const);

export type ContinueStatementFields = {
    label: IdentifierTypeClass | LwcErrorTypeClass | null;
};

export class ContinueStatementTypeClass extends LwcCommonTypeClass<'continueStatement'> {
    private readonly value: ContinueStatementFields;

    private constructor(value: ContinueStatementFields) {
        super('continueStatement');
        this.value = value;
    }

    static create(target: ContinueStatement, originalSource: string): ContinueStatementTypeClass {
        return new ContinueStatementTypeClass({
            label: visitOptionalNode(
                target.label,
                originalSource,
                continueStatementLabelPairs(),
                'ContinueStatement.label',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ContinueStatementFields {
        return this.value;
    }

    getLabel(): ContinueStatementFields['label'] {
        return this.value.label;
    }
}

export const continueStatementTypePair: EvaluatePair<
    ContinueStatement,
    ContinueStatementTypeClass
> = makeEvaluatePair(isContinueStatement, (target, originalSource) =>
    ContinueStatementTypeClass.create(target, originalSource),
);

export const isContinueStatementType = (
    target: LwcCommonTypeClass<string>,
): target is ContinueStatementTypeClass => target instanceof ContinueStatementTypeClass;
