import { isInterfaceDeclaration, type InterfaceDeclaration } from '@babel/types';
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

const interfaceDeclarationIdPairs = lazyPairs(() => [identifierTypePair] as const);
const interfaceDeclarationTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair] as const,
);
const interfaceDeclarationExtendsPairs = lazyPairs(() => [interfaceExtendsTypePair] as const);
const interfaceDeclarationBodyPairs = lazyPairs(() => [objectTypeAnnotationTypePair] as const);

export type InterfaceDeclarationFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
    typeParameters: TypeParameterDeclarationTypeClass | LwcErrorTypeClass | null;
    extends: (InterfaceExtendsTypeClass | LwcErrorTypeClass)[] | null;
    body: ObjectTypeAnnotationTypeClass | LwcErrorTypeClass;
};

export class InterfaceDeclarationTypeClass extends LwcCommonTypeClass<'interfaceDeclaration'> {
    private readonly value: InterfaceDeclarationFields;

    private constructor(value: InterfaceDeclarationFields) {
        super('interfaceDeclaration');
        this.value = value;
    }

    static create(
        target: InterfaceDeclaration,
        originalSource: string,
    ): InterfaceDeclarationTypeClass {
        return new InterfaceDeclarationTypeClass({
            id: visitNode(
                target.id,
                originalSource,
                interfaceDeclarationIdPairs(),
                'InterfaceDeclaration.id',
            ),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                interfaceDeclarationTypeParametersPairs(),
                'InterfaceDeclaration.typeParameters',
            ),
            extends:
                target.extends == null
                    ? null
                    : visitNodeList(
                          target.extends,
                          originalSource,
                          interfaceDeclarationExtendsPairs(),
                          'InterfaceDeclaration.extends',
                      ),
            body: visitNode(
                target.body,
                originalSource,
                interfaceDeclarationBodyPairs(),
                'InterfaceDeclaration.body',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): InterfaceDeclarationFields {
        return this.value;
    }

    getId(): InterfaceDeclarationFields['id'] {
        return this.value.id;
    }

    getTypeParameters(): InterfaceDeclarationFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getExtends(): InterfaceDeclarationFields['extends'] {
        return this.value.extends;
    }

    getBody(): InterfaceDeclarationFields['body'] {
        return this.value.body;
    }
}

export const interfaceDeclarationTypePair: EvaluatePair<
    InterfaceDeclaration,
    InterfaceDeclarationTypeClass
> = makeEvaluatePair(isInterfaceDeclaration, (target, originalSource) =>
    InterfaceDeclarationTypeClass.create(target, originalSource),
);

export const isInterfaceDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is InterfaceDeclarationTypeClass => target instanceof InterfaceDeclarationTypeClass;
