import { isOpaqueType, type OpaqueType } from '@babel/types';
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

const opaqueTypeIdPairs = lazyPairs(() => [identifierTypePair] as const);
const opaqueTypeTypeParametersPairs = lazyPairs(() => [typeParameterDeclarationTypePair] as const);

export type OpaqueTypeFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
    typeParameters: TypeParameterDeclarationTypeClass | LwcErrorTypeClass | null;
    supertype: FlowTypeTypeClass | LwcErrorTypeClass | null;
    impltype: FlowTypeTypeClass | LwcErrorTypeClass;
};

export class OpaqueTypeTypeClass extends LwcCommonTypeClass<'opaqueType'> {
    private readonly value: OpaqueTypeFields;

    private constructor(value: OpaqueTypeFields) {
        super('opaqueType');
        this.value = value;
    }

    static create(target: OpaqueType, originalSource: string): OpaqueTypeTypeClass {
        return new OpaqueTypeTypeClass({
            id: visitNode(target.id, originalSource, opaqueTypeIdPairs(), 'OpaqueType.id'),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                opaqueTypeTypeParametersPairs(),
                'OpaqueType.typeParameters',
            ),
            supertype: visitOptionalNode(
                target.supertype,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
            impltype: visitNode(
                target.impltype,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): OpaqueTypeFields {
        return this.value;
    }

    getId(): OpaqueTypeFields['id'] {
        return this.value.id;
    }

    getTypeParameters(): OpaqueTypeFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getSupertype(): OpaqueTypeFields['supertype'] {
        return this.value.supertype;
    }

    getImpltype(): OpaqueTypeFields['impltype'] {
        return this.value.impltype;
    }
}

export const opaqueTypeTypePair: EvaluatePair<OpaqueType, OpaqueTypeTypeClass> = makeEvaluatePair(
    isOpaqueType,
    (target, originalSource) => OpaqueTypeTypeClass.create(target, originalSource),
);

export const isOpaqueTypeType = (
    target: LwcCommonTypeClass<string>,
): target is OpaqueTypeTypeClass => target instanceof OpaqueTypeTypeClass;
