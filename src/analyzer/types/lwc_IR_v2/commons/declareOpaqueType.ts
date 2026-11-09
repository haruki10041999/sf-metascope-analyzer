import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isDeclareOpaqueType, type DeclareOpaqueType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';
import { TypeParameterDeclarationTypeClass } from '../flowVisitor/typeParameterDeclaration';
import { IdentifierTypeClass } from './identifier';

export type DeclareOpaqueTypeFields = TypeField<'declareOpaqueType'> & {
    id: IdentifierTypeClass;
    typeParameters: TypeParameterDeclarationTypeClass | null;
    supertype: FlowTypeTypeClass | null;
};

export class DeclareOpaqueTypeTypeClass extends LwcCommonTypeClass<
    'declareOpaqueType',
    DeclareOpaqueTypeFields
> {
    private constructor(value: FieldsOf<DeclareOpaqueTypeFields>, sourceSpan: SourceSpan) {
        super('declareOpaqueType', value, sourceSpan);
    }

    static create(target: DeclareOpaqueType, originalSource: string): DeclareOpaqueTypeTypeClass {
        return new DeclareOpaqueTypeTypeClass(
            {
                id: IdentifierTypeClass.create(target.id, originalSource),
                typeParameters:
                    target.typeParameters == null
                        ? null
                        : TypeParameterDeclarationTypeClass.create(
                              target.typeParameters,
                              originalSource,
                          ),
                supertype: visitOptionalNode(
                    target.supertype,
                    originalSource,
                    flowTypeVisitorEvaluatePairs(),
                    'FlowTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): DeclareOpaqueTypeFields['id'] {
        return this.getFields().id;
    }

    getTypeParameters(): DeclareOpaqueTypeFields['typeParameters'] {
        return this.getFields().typeParameters;
    }

    getSupertype(): DeclareOpaqueTypeFields['supertype'] {
        return this.getFields().supertype;
    }
}

export const declareOpaqueTypeTypePair: EvaluatePair<
    DeclareOpaqueType,
    DeclareOpaqueTypeTypeClass
> = makeEvaluatePair(isDeclareOpaqueType, (target, originalSource) =>
    DeclareOpaqueTypeTypeClass.create(target, originalSource),
);

export const isDeclareOpaqueTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is DeclareOpaqueTypeTypeClass => target instanceof DeclareOpaqueTypeTypeClass;
