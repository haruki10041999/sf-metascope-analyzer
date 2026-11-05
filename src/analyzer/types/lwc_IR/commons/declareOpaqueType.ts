import { isDeclareOpaqueType, type DeclareOpaqueType } from '@babel/types';
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

const declareOpaqueTypeIdPairs = lazyPairs(() => [identifierTypePair] as const);
const declareOpaqueTypeTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair] as const,
);

export type DeclareOpaqueTypeFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
    typeParameters: TypeParameterDeclarationTypeClass | LwcErrorTypeClass | null;
    supertype: FlowTypeTypeClass | LwcErrorTypeClass | null;
    impltype: FlowTypeTypeClass | LwcErrorTypeClass | null;
};

export class DeclareOpaqueTypeTypeClass extends LwcCommonTypeClass<'declareOpaqueType'> {
    private readonly value: DeclareOpaqueTypeFields;

    private constructor(value: DeclareOpaqueTypeFields) {
        super('declareOpaqueType');
        this.value = value;
    }

    static create(target: DeclareOpaqueType, originalSource: string): DeclareOpaqueTypeTypeClass {
        return new DeclareOpaqueTypeTypeClass({
            id: visitNode(
                target.id,
                originalSource,
                declareOpaqueTypeIdPairs(),
                'DeclareOpaqueType.id',
            ),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                declareOpaqueTypeTypeParametersPairs(),
                'DeclareOpaqueType.typeParameters',
            ),
            supertype: visitOptionalNode(
                target.supertype,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
            impltype: visitOptionalNode(
                target.impltype,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): DeclareOpaqueTypeFields {
        return this.value;
    }

    getId(): DeclareOpaqueTypeFields['id'] {
        return this.value.id;
    }

    getTypeParameters(): DeclareOpaqueTypeFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getSupertype(): DeclareOpaqueTypeFields['supertype'] {
        return this.value.supertype;
    }

    getImpltype(): DeclareOpaqueTypeFields['impltype'] {
        return this.value.impltype;
    }
}

export const declareOpaqueTypeTypePair: EvaluatePair<
    DeclareOpaqueType,
    DeclareOpaqueTypeTypeClass
> = makeEvaluatePair(isDeclareOpaqueType, (target, originalSource) =>
    DeclareOpaqueTypeTypeClass.create(target, originalSource),
);

export const isDeclareOpaqueTypeType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareOpaqueTypeTypeClass => target instanceof DeclareOpaqueTypeTypeClass;
