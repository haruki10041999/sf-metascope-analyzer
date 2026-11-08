import { isTSTypeParameterDeclaration, type TSTypeParameterDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import { tSTypeParameterTypePair, type TSTypeParameterTypeClass } from './tSTypeParameter';

const tSTypeParameterDeclarationParamsPairs = lazyPairs(() => [tSTypeParameterTypePair] as const);

export type TSTypeParameterDeclarationFields = {
    params: (TSTypeParameterTypeClass | LwcErrorTypeClass)[];
};

export class TSTypeParameterDeclarationTypeClass extends LwcCommonTypeClass<'tSTypeParameterDeclaration'> {
    private readonly value: TSTypeParameterDeclarationFields;

    private constructor(value: TSTypeParameterDeclarationFields) {
        super('tSTypeParameterDeclaration');
        this.value = value;
    }

    static create(
        target: TSTypeParameterDeclaration,
        originalSource: string,
    ): TSTypeParameterDeclarationTypeClass {
        return new TSTypeParameterDeclarationTypeClass({
            params: visitNodeList(
                target.params,
                originalSource,
                tSTypeParameterDeclarationParamsPairs(),
                'TSTypeParameterDeclaration.params',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSTypeParameterDeclarationFields {
        return this.value;
    }

    getParams(): TSTypeParameterDeclarationFields['params'] {
        return this.value.params;
    }
}

export const tSTypeParameterDeclarationTypePair: EvaluatePair<
    TSTypeParameterDeclaration,
    TSTypeParameterDeclarationTypeClass
> = makeEvaluatePair(isTSTypeParameterDeclaration, (target, originalSource) =>
    TSTypeParameterDeclarationTypeClass.create(target, originalSource),
);

export const isTSTypeParameterDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeParameterDeclarationTypeClass =>
    target instanceof TSTypeParameterDeclarationTypeClass;
