import { isTypeAlias, type TypeAlias } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';
import {
    typeParameterDeclarationTypePair,
    type TypeParameterDeclarationTypeClass,
} from '../flowVisitor/typeParameterDeclaration';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const typeAliasIdPairs = lazyPairs(() => [identifierTypePair] as const);
const typeAliasTypeParametersPairs = lazyPairs(() => [typeParameterDeclarationTypePair] as const);

export type TypeAliasFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
    typeParameters: TypeParameterDeclarationTypeClass | LwcErrorTypeClass | null;
    right: FlowTypeTypeClass | LwcErrorTypeClass;
};

export class TypeAliasTypeClass extends LwcCommonTypeClass<'typeAlias'> {
    private readonly value: TypeAliasFields;

    private constructor(value: TypeAliasFields) {
        super('typeAlias');
        this.value = value;
    }

    static create(target: TypeAlias, originalSource: string): TypeAliasTypeClass {
        return new TypeAliasTypeClass({
            id: visitNode(target.id, originalSource, typeAliasIdPairs(), 'TypeAlias.id'),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                typeAliasTypeParametersPairs(),
                'TypeAlias.typeParameters',
            ),
            right: visitNode(
                target.right,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TypeAliasFields {
        return this.value;
    }

    getId(): TypeAliasFields['id'] {
        return this.value.id;
    }

    getTypeParameters(): TypeAliasFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getRight(): TypeAliasFields['right'] {
        return this.value.right;
    }
}

export const typeAliasTypePair: EvaluatePair<TypeAlias, TypeAliasTypeClass> = makeEvaluatePair(
    isTypeAlias,
    (target, originalSource) => TypeAliasTypeClass.create(target, originalSource),
);

export const isTypeAliasType = (target: LwcCommonTypeClass<string>): target is TypeAliasTypeClass =>
    target instanceof TypeAliasTypeClass;
