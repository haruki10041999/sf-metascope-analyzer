import { isDeclareTypeAlias, type DeclareTypeAlias } from '@babel/types';
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

const declareTypeAliasIdPairs = lazyPairs(() => [identifierTypePair] as const);
const declareTypeAliasTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair] as const,
);

export type DeclareTypeAliasFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
    typeParameters: TypeParameterDeclarationTypeClass | LwcErrorTypeClass | null;
    right: FlowTypeTypeClass | LwcErrorTypeClass;
};

export class DeclareTypeAliasTypeClass extends LwcCommonTypeClass<'declareTypeAlias'> {
    private readonly value: DeclareTypeAliasFields;

    private constructor(value: DeclareTypeAliasFields) {
        super('declareTypeAlias');
        this.value = value;
    }

    static create(target: DeclareTypeAlias, originalSource: string): DeclareTypeAliasTypeClass {
        return new DeclareTypeAliasTypeClass({
            id: visitNode(
                target.id,
                originalSource,
                declareTypeAliasIdPairs(),
                'DeclareTypeAlias.id',
            ),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                declareTypeAliasTypeParametersPairs(),
                'DeclareTypeAlias.typeParameters',
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
    override getFields(): DeclareTypeAliasFields {
        return this.value;
    }

    getId(): DeclareTypeAliasFields['id'] {
        return this.value.id;
    }

    getTypeParameters(): DeclareTypeAliasFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getRight(): DeclareTypeAliasFields['right'] {
        return this.value.right;
    }
}

export const declareTypeAliasTypePair: EvaluatePair<DeclareTypeAlias, DeclareTypeAliasTypeClass> =
    makeEvaluatePair(isDeclareTypeAlias, (target, originalSource) =>
        DeclareTypeAliasTypeClass.create(target, originalSource),
    );

export const isDeclareTypeAliasType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareTypeAliasTypeClass => target instanceof DeclareTypeAliasTypeClass;
