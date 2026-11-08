import { isDeclareInterface, type DeclareInterface } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
    visitOptionalNode,
} from '../commonVisitor';
import {
    interfaceExtendsTypePair,
    type InterfaceExtendsTypeClass,
} from '../flowVisitor/interfaceExtends';
import {
    typeParameterDeclarationTypePair,
    type TypeParameterDeclarationTypeClass,
} from '../flowVisitor/typeParameterDeclaration';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import {
    objectTypeAnnotationTypePair,
    type ObjectTypeAnnotationTypeClass,
} from './objectTypeAnnotation';

const declareInterfaceIdPairs = lazyPairs(() => [identifierTypePair] as const);
const declareInterfaceTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair] as const,
);
const declareInterfaceExtendsPairs = lazyPairs(() => [interfaceExtendsTypePair] as const);
const declareInterfaceBodyPairs = lazyPairs(() => [objectTypeAnnotationTypePair] as const);

export type DeclareInterfaceFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
    typeParameters: TypeParameterDeclarationTypeClass | LwcErrorTypeClass | null;
    extends: (InterfaceExtendsTypeClass | LwcErrorTypeClass)[] | null;
    body: ObjectTypeAnnotationTypeClass | LwcErrorTypeClass;
};

export class DeclareInterfaceTypeClass extends LwcCommonTypeClass<'declareInterface'> {
    private readonly value: DeclareInterfaceFields;

    private constructor(value: DeclareInterfaceFields) {
        super('declareInterface');
        this.value = value;
    }

    static create(target: DeclareInterface, originalSource: string): DeclareInterfaceTypeClass {
        return new DeclareInterfaceTypeClass({
            id: visitNode(
                target.id,
                originalSource,
                declareInterfaceIdPairs(),
                'DeclareInterface.id',
            ),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                declareInterfaceTypeParametersPairs(),
                'DeclareInterface.typeParameters',
            ),
            extends:
                target.extends == null
                    ? null
                    : visitNodeList(
                          target.extends,
                          originalSource,
                          declareInterfaceExtendsPairs(),
                          'DeclareInterface.extends',
                      ),
            body: visitNode(
                target.body,
                originalSource,
                declareInterfaceBodyPairs(),
                'DeclareInterface.body',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): DeclareInterfaceFields {
        return this.value;
    }

    getId(): DeclareInterfaceFields['id'] {
        return this.value.id;
    }

    getTypeParameters(): DeclareInterfaceFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getExtends(): DeclareInterfaceFields['extends'] {
        return this.value.extends;
    }

    getBody(): DeclareInterfaceFields['body'] {
        return this.value.body;
    }
}

export const declareInterfaceTypePair: EvaluatePair<DeclareInterface, DeclareInterfaceTypeClass> =
    makeEvaluatePair(isDeclareInterface, (target, originalSource) =>
        DeclareInterfaceTypeClass.create(target, originalSource),
    );

export const isDeclareInterfaceType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareInterfaceTypeClass => target instanceof DeclareInterfaceTypeClass;
