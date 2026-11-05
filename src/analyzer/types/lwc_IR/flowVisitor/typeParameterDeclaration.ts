import { isTypeParameterDeclaration, type TypeParameterDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import { typeParameterTypePair, type TypeParameterTypeClass } from './typeParameter';

const typeParameterDeclarationParamsPairs = lazyPairs(() => [typeParameterTypePair] as const);

export type TypeParameterDeclarationFields = {
    params: (TypeParameterTypeClass | LwcErrorTypeClass)[];
};

export class TypeParameterDeclarationTypeClass extends LwcCommonTypeClass<'typeParameterDeclaration'> {
    private readonly value: TypeParameterDeclarationFields;

    private constructor(value: TypeParameterDeclarationFields) {
        super('typeParameterDeclaration');
        this.value = value;
    }

    static create(
        target: TypeParameterDeclaration,
        originalSource: string,
    ): TypeParameterDeclarationTypeClass {
        return new TypeParameterDeclarationTypeClass({
            params: visitNodeList(
                target.params,
                originalSource,
                typeParameterDeclarationParamsPairs(),
                'TypeParameterDeclaration.params',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TypeParameterDeclarationFields {
        return this.value;
    }

    getParams(): TypeParameterDeclarationFields['params'] {
        return this.value.params;
    }
}

export const typeParameterDeclarationTypePair: EvaluatePair<
    TypeParameterDeclaration,
    TypeParameterDeclarationTypeClass
> = makeEvaluatePair(isTypeParameterDeclaration, (target, originalSource) =>
    TypeParameterDeclarationTypeClass.create(target, originalSource),
);

export const isTypeParameterDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is TypeParameterDeclarationTypeClass =>
    target instanceof TypeParameterDeclarationTypeClass;
