import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSTypeParameterDeclaration, type TSTypeParameterDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { TSTypeParameterTypeClass } from './tSTypeParameter';

export type TSTypeParameterDeclarationFields = TypeField<'tSTypeParameterDeclaration'> & {
    params: TSTypeParameterTypeClass[];
};

export class TSTypeParameterDeclarationTypeClass extends LwcCommonTypeClass<
    'tSTypeParameterDeclaration',
    TSTypeParameterDeclarationFields
> {
    private constructor(value: FieldsOf<TSTypeParameterDeclarationFields>, sourceSpan: SourceSpan) {
        super('tSTypeParameterDeclaration', value, sourceSpan);
    }

    static create(
        target: TSTypeParameterDeclaration,
        originalSource: string,
    ): TSTypeParameterDeclarationTypeClass {
        return new TSTypeParameterDeclarationTypeClass(
            {
                params: target.params.map((child) =>
                    TSTypeParameterTypeClass.create(child, originalSource),
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getParams(): TSTypeParameterDeclarationFields['params'] {
        return this.getFields().params;
    }
}

export const tSTypeParameterDeclarationTypePair: EvaluatePair<
    TSTypeParameterDeclaration,
    TSTypeParameterDeclarationTypeClass
> = makeEvaluatePair(isTSTypeParameterDeclaration, (target, originalSource) =>
    TSTypeParameterDeclarationTypeClass.create(target, originalSource),
);

export const isTSTypeParameterDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSTypeParameterDeclarationTypeClass =>
    target instanceof TSTypeParameterDeclarationTypeClass;
