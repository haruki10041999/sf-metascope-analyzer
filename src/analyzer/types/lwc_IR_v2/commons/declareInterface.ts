import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isDeclareInterface, type DeclareInterface } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { InterfaceExtendsTypeClass } from '../flowVisitor/interfaceExtends';
import { TypeParameterDeclarationTypeClass } from '../flowVisitor/typeParameterDeclaration';
import { IdentifierTypeClass } from './identifier';
import { ObjectTypeAnnotationTypeClass } from './objectTypeAnnotation';

export type DeclareInterfaceFields = TypeField<'declareInterface'> & {
    id: IdentifierTypeClass;
    typeParameters: TypeParameterDeclarationTypeClass | null;
    extends: InterfaceExtendsTypeClass[] | null;
    body: ObjectTypeAnnotationTypeClass;
};

export class DeclareInterfaceTypeClass extends LwcCommonTypeClass<
    'declareInterface',
    DeclareInterfaceFields
> {
    private constructor(value: FieldsOf<DeclareInterfaceFields>, sourceSpan: SourceSpan) {
        super('declareInterface', value, sourceSpan);
    }

    static create(target: DeclareInterface, originalSource: string): DeclareInterfaceTypeClass {
        return new DeclareInterfaceTypeClass(
            {
                id: IdentifierTypeClass.create(target.id, originalSource),
                typeParameters:
                    target.typeParameters == null
                        ? null
                        : TypeParameterDeclarationTypeClass.create(
                              target.typeParameters,
                              originalSource,
                          ),
                extends:
                    target.extends == null
                        ? null
                        : target.extends.map((child) =>
                              InterfaceExtendsTypeClass.create(child, originalSource),
                          ),
                body: ObjectTypeAnnotationTypeClass.create(target.body, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): DeclareInterfaceFields['id'] {
        return this.getFields().id;
    }

    getTypeParameters(): DeclareInterfaceFields['typeParameters'] {
        return this.getFields().typeParameters;
    }

    getExtends(): DeclareInterfaceFields['extends'] {
        return this.getFields().extends;
    }

    getBody(): DeclareInterfaceFields['body'] {
        return this.getFields().body;
    }
}

export const declareInterfaceTypePair: EvaluatePair<DeclareInterface, DeclareInterfaceTypeClass> =
    makeEvaluatePair(isDeclareInterface, (target, originalSource) =>
        DeclareInterfaceTypeClass.create(target, originalSource),
    );

export const isDeclareInterfaceType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is DeclareInterfaceTypeClass => target instanceof DeclareInterfaceTypeClass;
