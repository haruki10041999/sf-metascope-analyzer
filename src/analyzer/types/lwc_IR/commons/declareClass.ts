import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isDeclareClass, type DeclareClass } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { ClassImplementsTypeClass } from '../flowVisitor/classImplements';
import { InterfaceExtendsTypeClass } from '../flowVisitor/interfaceExtends';
import { TypeParameterDeclarationTypeClass } from '../flowVisitor/typeParameterDeclaration';
import { IdentifierTypeClass } from './identifier';
import { ObjectTypeAnnotationTypeClass } from './objectTypeAnnotation';

export type DeclareClassFields = TypeField<'declareClass'> & {
    id: IdentifierTypeClass;
    typeParameters: TypeParameterDeclarationTypeClass | null;
    extends: InterfaceExtendsTypeClass[] | null;
    mixins: InterfaceExtendsTypeClass[] | null;
    implements: ClassImplementsTypeClass[] | null;
    body: ObjectTypeAnnotationTypeClass;
};

export class DeclareClassTypeClass extends LwcCommonTypeClass<'declareClass', DeclareClassFields> {
    private constructor(value: FieldsOf<DeclareClassFields>, sourceSpan: SourceSpan) {
        super('declareClass', value, sourceSpan);
    }

    static create(target: DeclareClass, originalSource: string): DeclareClassTypeClass {
        return new DeclareClassTypeClass(
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
                mixins:
                    target.mixins == null
                        ? null
                        : target.mixins.map((child) =>
                              InterfaceExtendsTypeClass.create(child, originalSource),
                          ),
                implements:
                    target.implements == null
                        ? null
                        : target.implements.map((child) =>
                              ClassImplementsTypeClass.create(child, originalSource),
                          ),
                body: ObjectTypeAnnotationTypeClass.create(target.body, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): DeclareClassFields['id'] {
        return this.getFields().id;
    }

    getTypeParameters(): DeclareClassFields['typeParameters'] {
        return this.getFields().typeParameters;
    }

    getExtends(): DeclareClassFields['extends'] {
        return this.getFields().extends;
    }

    getMixins(): DeclareClassFields['mixins'] {
        return this.getFields().mixins;
    }

    getImplements(): DeclareClassFields['implements'] {
        return this.getFields().implements;
    }

    getBody(): DeclareClassFields['body'] {
        return this.getFields().body;
    }
}

export const declareClassTypePair: EvaluatePair<DeclareClass, DeclareClassTypeClass> =
    makeEvaluatePair(isDeclareClass, (target, originalSource) =>
        DeclareClassTypeClass.create(target, originalSource),
    );

export const isDeclareClassType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is DeclareClassTypeClass => target instanceof DeclareClassTypeClass;
