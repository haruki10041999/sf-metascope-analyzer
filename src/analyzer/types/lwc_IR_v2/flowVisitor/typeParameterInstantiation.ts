import { isTypeParameterInstantiation, type TypeParameterInstantiation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type TypeParameterInstantiationFields = {
    params: (FlowTypeTypeClass | LwcErrorTypeClass)[];
};

export class TypeParameterInstantiationTypeClass extends LwcCommonTypeClass<'typeParameterInstantiation'> {
    private readonly value: TypeParameterInstantiationFields;

    private constructor(value: TypeParameterInstantiationFields) {
        super('typeParameterInstantiation');
        this.value = value;
    }

    static create(
        target: TypeParameterInstantiation,
        originalSource: string,
    ): TypeParameterInstantiationTypeClass {
        return new TypeParameterInstantiationTypeClass({
            params: visitNodeList(
                target.params,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TypeParameterInstantiationFields {
        return this.value;
    }

    getParams(): TypeParameterInstantiationFields['params'] {
        return this.value.params;
    }
}

export const typeParameterInstantiationTypePair: EvaluatePair<
    TypeParameterInstantiation,
    TypeParameterInstantiationTypeClass
> = makeEvaluatePair(isTypeParameterInstantiation, (target, originalSource) =>
    TypeParameterInstantiationTypeClass.create(target, originalSource),
);

export const isTypeParameterInstantiationType = (
    target: LwcCommonTypeClass<string>,
): target is TypeParameterInstantiationTypeClass =>
    target instanceof TypeParameterInstantiationTypeClass;
