import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSTypeParameterInstantiation, type TSTypeParameterInstantiation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSTypeParameterInstantiationFields = TypeField<'tSTypeParameterInstantiation'> & {
    params: TSTypeTypeClass[];
};

export class TSTypeParameterInstantiationTypeClass extends LwcCommonTypeClass<
    'tSTypeParameterInstantiation',
    TSTypeParameterInstantiationFields
> {
    private constructor(
        value: FieldsOf<TSTypeParameterInstantiationFields>,
        sourceSpan: SourceSpan,
    ) {
        super('tSTypeParameterInstantiation', value, sourceSpan);
    }

    static create(
        target: TSTypeParameterInstantiation,
        originalSource: string,
    ): TSTypeParameterInstantiationTypeClass {
        return new TSTypeParameterInstantiationTypeClass(
            {
                params: visitNodeList(
                    target.params,
                    originalSource,
                    tSTypeVisitorEvaluatePairs(),
                    'TSTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getParams(): TSTypeParameterInstantiationFields['params'] {
        return this.getFields().params;
    }
}

export const tSTypeParameterInstantiationTypePair: EvaluatePair<
    TSTypeParameterInstantiation,
    TSTypeParameterInstantiationTypeClass
> = makeEvaluatePair(isTSTypeParameterInstantiation, (target, originalSource) =>
    TSTypeParameterInstantiationTypeClass.create(target, originalSource),
);

export const isTSTypeParameterInstantiationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSTypeParameterInstantiationTypeClass =>
    target instanceof TSTypeParameterInstantiationTypeClass;
