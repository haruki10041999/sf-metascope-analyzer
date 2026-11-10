import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isInterfaceExtends, type InterfaceExtends } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from '../commons/identifier';
import {
    qualifiedTypeIdentifierTypePair,
    type QualifiedTypeIdentifierTypeClass,
} from './qualifiedTypeIdentifier';
import { TypeParameterInstantiationTypeClass } from './typeParameterInstantiation';

const interfaceExtendsIdPairs = lazyPairs(
    () => [identifierTypePair, qualifiedTypeIdentifierTypePair] as const,
);

export type InterfaceExtendsFields = TypeField<'interfaceExtends'> & {
    id: IdentifierTypeClass | QualifiedTypeIdentifierTypeClass;
    typeParameters: TypeParameterInstantiationTypeClass | null;
};

export class InterfaceExtendsTypeClass extends LwcCommonTypeClass<
    'interfaceExtends',
    InterfaceExtendsFields
> {
    private constructor(value: FieldsOf<InterfaceExtendsFields>, sourceSpan: SourceSpan) {
        super('interfaceExtends', value, sourceSpan);
    }

    static create(target: InterfaceExtends, originalSource: string): InterfaceExtendsTypeClass {
        return new InterfaceExtendsTypeClass(
            {
                id: visitNode(
                    target.id,
                    originalSource,
                    interfaceExtendsIdPairs(),
                    'InterfaceExtends.id',
                ),
                typeParameters:
                    target.typeParameters == null
                        ? null
                        : TypeParameterInstantiationTypeClass.create(
                              target.typeParameters,
                              originalSource,
                          ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): InterfaceExtendsFields['id'] {
        return this.getFields().id;
    }

    getTypeParameters(): InterfaceExtendsFields['typeParameters'] {
        return this.getFields().typeParameters;
    }
}

export const interfaceExtendsTypePair: EvaluatePair<InterfaceExtends, InterfaceExtendsTypeClass> =
    makeEvaluatePair(isInterfaceExtends, (target, originalSource) =>
        InterfaceExtendsTypeClass.create(target, originalSource),
    );

export const isInterfaceExtendsType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is InterfaceExtendsTypeClass => target instanceof InterfaceExtendsTypeClass;
