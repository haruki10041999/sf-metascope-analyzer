import { isTSTypeReference, type TSTypeReference } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import {
    tSEntityNameVisitorEvaluatePairs,
    type TSEntityNameTypeClass,
} from '../tsEntityNameVisitor';
import {
    tSTypeParameterInstantiationTypePair,
    type TSTypeParameterInstantiationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterInstantiation';

const tSTypeReferenceTypeArgumentsPairs = lazyPairs(
    () => [tSTypeParameterInstantiationTypePair] as const,
);

export type TSTypeReferenceFields = {
    typeName: TSEntityNameTypeClass | LwcErrorTypeClass;
    typeArguments: TSTypeParameterInstantiationTypeClass | LwcErrorTypeClass | null;
};

export class TSTypeReferenceTypeClass extends LwcCommonTypeClass<'tSTypeReference'> {
    private readonly value: TSTypeReferenceFields;

    private constructor(value: TSTypeReferenceFields) {
        super('tSTypeReference');
        this.value = value;
    }

    static create(target: TSTypeReference, originalSource: string): TSTypeReferenceTypeClass {
        return new TSTypeReferenceTypeClass({
            typeName: visitNode(
                target.typeName,
                originalSource,
                tSEntityNameVisitorEvaluatePairs(),
                'TSEntityNameVisitor',
            ),
            typeArguments: visitOptionalNode(
                target.typeArguments,
                originalSource,
                tSTypeReferenceTypeArgumentsPairs(),
                'TSTypeReference.typeArguments',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSTypeReferenceFields {
        return this.value;
    }

    getTypeName(): TSTypeReferenceFields['typeName'] {
        return this.value.typeName;
    }

    getTypeArguments(): TSTypeReferenceFields['typeArguments'] {
        return this.value.typeArguments;
    }
}

export const tSTypeReferenceTypePair: EvaluatePair<TSTypeReference, TSTypeReferenceTypeClass> =
    makeEvaluatePair(isTSTypeReference, (target, originalSource) =>
        TSTypeReferenceTypeClass.create(target, originalSource),
    );

export const isTSTypeReferenceType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeReferenceTypeClass => target instanceof TSTypeReferenceTypeClass;
