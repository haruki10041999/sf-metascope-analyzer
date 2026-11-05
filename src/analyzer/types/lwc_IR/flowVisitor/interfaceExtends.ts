import { isInterfaceExtends, type InterfaceExtends } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from '../commons/identifier';
import {
    qualifiedTypeIdentifierTypePair,
    type QualifiedTypeIdentifierTypeClass,
} from './qualifiedTypeIdentifier';
import {
    typeParameterInstantiationTypePair,
    type TypeParameterInstantiationTypeClass,
} from './typeParameterInstantiation';

const interfaceExtendsIdPairs = lazyPairs(
    () => [identifierTypePair, qualifiedTypeIdentifierTypePair] as const,
);
const interfaceExtendsTypeParametersPairs = lazyPairs(
    () => [typeParameterInstantiationTypePair] as const,
);

export type InterfaceExtendsFields = {
    id: IdentifierTypeClass | QualifiedTypeIdentifierTypeClass | LwcErrorTypeClass;
    typeParameters: TypeParameterInstantiationTypeClass | LwcErrorTypeClass | null;
};

export class InterfaceExtendsTypeClass extends LwcCommonTypeClass<'interfaceExtends'> {
    private readonly value: InterfaceExtendsFields;

    private constructor(value: InterfaceExtendsFields) {
        super('interfaceExtends');
        this.value = value;
    }

    static create(target: InterfaceExtends, originalSource: string): InterfaceExtendsTypeClass {
        return new InterfaceExtendsTypeClass({
            id: visitNode(
                target.id,
                originalSource,
                interfaceExtendsIdPairs(),
                'InterfaceExtends.id',
            ),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                interfaceExtendsTypeParametersPairs(),
                'InterfaceExtends.typeParameters',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): InterfaceExtendsFields {
        return this.value;
    }

    getId(): InterfaceExtendsFields['id'] {
        return this.value.id;
    }

    getTypeParameters(): InterfaceExtendsFields['typeParameters'] {
        return this.value.typeParameters;
    }
}

export const interfaceExtendsTypePair: EvaluatePair<InterfaceExtends, InterfaceExtendsTypeClass> =
    makeEvaluatePair(isInterfaceExtends, (target, originalSource) =>
        InterfaceExtendsTypeClass.create(target, originalSource),
    );

export const isInterfaceExtendsType = (
    target: LwcCommonTypeClass<string>,
): target is InterfaceExtendsTypeClass => target instanceof InterfaceExtendsTypeClass;
