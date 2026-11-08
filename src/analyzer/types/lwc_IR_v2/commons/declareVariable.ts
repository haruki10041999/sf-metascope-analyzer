import { isDeclareVariable, type DeclareVariable } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const declareVariableIdPairs = lazyPairs(() => [identifierTypePair] as const);

export type DeclareVariableFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
};

export class DeclareVariableTypeClass extends LwcCommonTypeClass<'declareVariable'> {
    private readonly value: DeclareVariableFields;

    private constructor(value: DeclareVariableFields) {
        super('declareVariable');
        this.value = value;
    }

    static create(target: DeclareVariable, originalSource: string): DeclareVariableTypeClass {
        return new DeclareVariableTypeClass({
            id: visitNode(
                target.id,
                originalSource,
                declareVariableIdPairs(),
                'DeclareVariable.id',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): DeclareVariableFields {
        return this.value;
    }

    getId(): DeclareVariableFields['id'] {
        return this.value.id;
    }
}

export const declareVariableTypePair: EvaluatePair<DeclareVariable, DeclareVariableTypeClass> =
    makeEvaluatePair(isDeclareVariable, (target, originalSource) =>
        DeclareVariableTypeClass.create(target, originalSource),
    );

export const isDeclareVariableType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareVariableTypeClass => target instanceof DeclareVariableTypeClass;
