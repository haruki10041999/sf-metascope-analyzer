import { isTSTypeParameterInstantiation, type TSTypeParameterInstantiation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSTypeParameterInstantiationFields = {
    params: (TSTypeTypeClass | LwcErrorTypeClass)[];
};

export class TSTypeParameterInstantiationTypeClass extends LwcCommonTypeClass<'tSTypeParameterInstantiation'> {
    private readonly value: TSTypeParameterInstantiationFields;

    private constructor(value: TSTypeParameterInstantiationFields) {
        super('tSTypeParameterInstantiation');
        this.value = value;
    }

    static create(
        target: TSTypeParameterInstantiation,
        originalSource: string,
    ): TSTypeParameterInstantiationTypeClass {
        return new TSTypeParameterInstantiationTypeClass({
            params: visitNodeList(
                target.params,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSTypeParameterInstantiationFields {
        return this.value;
    }

    getParams(): TSTypeParameterInstantiationFields['params'] {
        return this.value.params;
    }
}

export const tSTypeParameterInstantiationTypePair: EvaluatePair<
    TSTypeParameterInstantiation,
    TSTypeParameterInstantiationTypeClass
> = makeEvaluatePair(isTSTypeParameterInstantiation, (target, originalSource) =>
    TSTypeParameterInstantiationTypeClass.create(target, originalSource),
);

export const isTSTypeParameterInstantiationType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeParameterInstantiationTypeClass =>
    target instanceof TSTypeParameterInstantiationTypeClass;
