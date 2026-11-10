import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isOpaqueType, type OpaqueType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';
import { TypeParameterDeclarationTypeClass } from '../flowVisitor/typeParameterDeclaration';
import { IdentifierTypeClass } from './identifier';

export type OpaqueTypeFields = TypeField<'opaqueType'> & {
    id: IdentifierTypeClass;
    typeParameters: TypeParameterDeclarationTypeClass | null;
    supertype: FlowTypeTypeClass | null;
    impltype: FlowTypeTypeClass;
};

export class OpaqueTypeTypeClass extends LwcCommonTypeClass<'opaqueType', OpaqueTypeFields> {
    private constructor(value: FieldsOf<OpaqueTypeFields>, sourceSpan: SourceSpan) {
        super('opaqueType', value, sourceSpan);
    }

    static create(target: OpaqueType, originalSource: string): OpaqueTypeTypeClass {
        return new OpaqueTypeTypeClass(
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
                impltype: visitNode(
                    target.impltype,
                    originalSource,
                    flowTypeVisitorEvaluatePairs(),
                    'FlowTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): OpaqueTypeFields['id'] {
        return this.getFields().id;
    }

    getTypeParameters(): OpaqueTypeFields['typeParameters'] {
        return this.getFields().typeParameters;
    }

    getSupertype(): OpaqueTypeFields['supertype'] {
        return this.getFields().supertype;
    }

    getImpltype(): OpaqueTypeFields['impltype'] {
        return this.getFields().impltype;
    }
}

export const opaqueTypeTypePair: EvaluatePair<OpaqueType, OpaqueTypeTypeClass> = makeEvaluatePair(
    isOpaqueType,
    (target, originalSource) => OpaqueTypeTypeClass.create(target, originalSource),
);

export const isOpaqueTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is OpaqueTypeTypeClass => target instanceof OpaqueTypeTypeClass;
