import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isInterfaceDeclaration, type InterfaceDeclaration } from '@babel/types';
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

export type InterfaceDeclarationFields = TypeField<'interfaceDeclaration'> & {
    id: IdentifierTypeClass;
    typeParameters: TypeParameterDeclarationTypeClass | null;
    extends: InterfaceExtendsTypeClass[] | null;
    body: ObjectTypeAnnotationTypeClass;
};

export class InterfaceDeclarationTypeClass extends LwcCommonTypeClass<
    'interfaceDeclaration',
    InterfaceDeclarationFields
> {
    private constructor(value: FieldsOf<InterfaceDeclarationFields>, sourceSpan: SourceSpan) {
        super('interfaceDeclaration', value, sourceSpan);
    }

    static create(
        target: InterfaceDeclaration,
        originalSource: string,
    ): InterfaceDeclarationTypeClass {
        return new InterfaceDeclarationTypeClass(
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

    getId(): InterfaceDeclarationFields['id'] {
        return this.getFields().id;
    }

    getTypeParameters(): InterfaceDeclarationFields['typeParameters'] {
        return this.getFields().typeParameters;
    }

    getExtends(): InterfaceDeclarationFields['extends'] {
        return this.getFields().extends;
    }

    getBody(): InterfaceDeclarationFields['body'] {
        return this.getFields().body;
    }
}

export const interfaceDeclarationTypePair: EvaluatePair<
    InterfaceDeclaration,
    InterfaceDeclarationTypeClass
> = makeEvaluatePair(isInterfaceDeclaration, (target, originalSource) =>
    InterfaceDeclarationTypeClass.create(target, originalSource),
);

export const isInterfaceDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is InterfaceDeclarationTypeClass => target instanceof InterfaceDeclarationTypeClass;
