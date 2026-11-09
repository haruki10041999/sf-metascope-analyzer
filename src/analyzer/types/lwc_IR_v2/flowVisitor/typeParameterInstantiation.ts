import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTypeParameterInstantiation, type TypeParameterInstantiation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type TypeParameterInstantiationFields = TypeField<'typeParameterInstantiation'> & {
    params: FlowTypeTypeClass[];
};

export class TypeParameterInstantiationTypeClass extends LwcCommonTypeClass<
    'typeParameterInstantiation',
    TypeParameterInstantiationFields
> {
    private constructor(value: FieldsOf<TypeParameterInstantiationFields>, sourceSpan: SourceSpan) {
        super('typeParameterInstantiation', value, sourceSpan);
    }

    static create(
        target: TypeParameterInstantiation,
        originalSource: string,
    ): TypeParameterInstantiationTypeClass {
        return new TypeParameterInstantiationTypeClass(
            {
                params: visitNodeList(
                    target.params,
                    originalSource,
                    flowTypeVisitorEvaluatePairs(),
                    'FlowTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getParams(): TypeParameterInstantiationFields['params'] {
        return this.getFields().params;
    }
}

export const typeParameterInstantiationTypePair: EvaluatePair<
    TypeParameterInstantiation,
    TypeParameterInstantiationTypeClass
> = makeEvaluatePair(isTypeParameterInstantiation, (target, originalSource) =>
    TypeParameterInstantiationTypeClass.create(target, originalSource),
);

export const isTypeParameterInstantiationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TypeParameterInstantiationTypeClass =>
    target instanceof TypeParameterInstantiationTypeClass;
