import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTypeParameterDeclaration, type TypeParameterDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { TypeParameterTypeClass } from './typeParameter';

export type TypeParameterDeclarationFields = TypeField<'typeParameterDeclaration'> & {
    params: TypeParameterTypeClass[];
};

export class TypeParameterDeclarationTypeClass extends LwcCommonTypeClass<
    'typeParameterDeclaration',
    TypeParameterDeclarationFields
> {
    private constructor(value: FieldsOf<TypeParameterDeclarationFields>, sourceSpan: SourceSpan) {
        super('typeParameterDeclaration', value, sourceSpan);
    }

    static create(
        target: TypeParameterDeclaration,
        originalSource: string,
    ): TypeParameterDeclarationTypeClass {
        return new TypeParameterDeclarationTypeClass(
            {
                params: target.params.map((child) =>
                    TypeParameterTypeClass.create(child, originalSource),
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getParams(): TypeParameterDeclarationFields['params'] {
        return this.getFields().params;
    }
}

export const typeParameterDeclarationTypePair: EvaluatePair<
    TypeParameterDeclaration,
    TypeParameterDeclarationTypeClass
> = makeEvaluatePair(isTypeParameterDeclaration, (target, originalSource) =>
    TypeParameterDeclarationTypeClass.create(target, originalSource),
);

export const isTypeParameterDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TypeParameterDeclarationTypeClass =>
    target instanceof TypeParameterDeclarationTypeClass;
