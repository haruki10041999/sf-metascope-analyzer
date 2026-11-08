import { isTSTypeAliasDeclaration, type TSTypeAliasDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';
import {
    tSTypeParameterDeclarationTypePair,
    type TSTypeParameterDeclarationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterDeclaration';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const tSTypeAliasDeclarationIdPairs = lazyPairs(() => [identifierTypePair] as const);
const tSTypeAliasDeclarationTypeParametersPairs = lazyPairs(
    () => [tSTypeParameterDeclarationTypePair] as const,
);

export type TSTypeAliasDeclarationFields = {
    declare: NonNullable<TSTypeAliasDeclaration['declare']> | null;
    id: IdentifierTypeClass | LwcErrorTypeClass;
    typeParameters: TSTypeParameterDeclarationTypeClass | LwcErrorTypeClass | null;
    typeAnnotation: TSTypeTypeClass | LwcErrorTypeClass;
};

export class TSTypeAliasDeclarationTypeClass extends LwcCommonTypeClass<'tSTypeAliasDeclaration'> {
    private readonly value: TSTypeAliasDeclarationFields;

    private constructor(value: TSTypeAliasDeclarationFields) {
        super('tSTypeAliasDeclaration');
        this.value = value;
    }

    static create(
        target: TSTypeAliasDeclaration,
        originalSource: string,
    ): TSTypeAliasDeclarationTypeClass {
        return new TSTypeAliasDeclarationTypeClass({
            declare: target.declare ?? null,
            id: visitNode(
                target.id,
                originalSource,
                tSTypeAliasDeclarationIdPairs(),
                'TSTypeAliasDeclaration.id',
            ),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                tSTypeAliasDeclarationTypeParametersPairs(),
                'TSTypeAliasDeclaration.typeParameters',
            ),
            typeAnnotation: visitNode(
                target.typeAnnotation,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSTypeAliasDeclarationFields {
        return this.value;
    }

    getDeclare(): TSTypeAliasDeclarationFields['declare'] {
        return this.value.declare;
    }

    getId(): TSTypeAliasDeclarationFields['id'] {
        return this.value.id;
    }

    getTypeParameters(): TSTypeAliasDeclarationFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getTypeAnnotation(): TSTypeAliasDeclarationFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }
}

export const tSTypeAliasDeclarationTypePair: EvaluatePair<
    TSTypeAliasDeclaration,
    TSTypeAliasDeclarationTypeClass
> = makeEvaluatePair(isTSTypeAliasDeclaration, (target, originalSource) =>
    TSTypeAliasDeclarationTypeClass.create(target, originalSource),
);

export const isTSTypeAliasDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeAliasDeclarationTypeClass => target instanceof TSTypeAliasDeclarationTypeClass;
