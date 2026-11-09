import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isDeclareVariable, type DeclareVariable } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { IdentifierTypeClass } from './identifier';

export type DeclareVariableFields = TypeField<'declareVariable'> & {
    id: IdentifierTypeClass;
};

export class DeclareVariableTypeClass extends LwcCommonTypeClass<
    'declareVariable',
    DeclareVariableFields
> {
    private constructor(value: FieldsOf<DeclareVariableFields>, sourceSpan: SourceSpan) {
        super('declareVariable', value, sourceSpan);
    }

    static create(target: DeclareVariable, originalSource: string): DeclareVariableTypeClass {
        return new DeclareVariableTypeClass(
            {
                id: IdentifierTypeClass.create(target.id, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): DeclareVariableFields['id'] {
        return this.getFields().id;
    }
}

export const declareVariableTypePair: EvaluatePair<DeclareVariable, DeclareVariableTypeClass> =
    makeEvaluatePair(isDeclareVariable, (target, originalSource) =>
        DeclareVariableTypeClass.create(target, originalSource),
    );

export const isDeclareVariableType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is DeclareVariableTypeClass => target instanceof DeclareVariableTypeClass;
