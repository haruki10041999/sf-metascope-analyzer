import { isDeclareClass, type DeclareClass } from '@babel/types';
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
    classImplementsTypePair,
    type ClassImplementsTypeClass,
} from '../flowVisitor/classImplements';
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

const declareClassIdPairs = lazyPairs(() => [identifierTypePair] as const);
const declareClassTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair] as const,
);
const declareClassExtendsPairs = lazyPairs(() => [interfaceExtendsTypePair] as const);
const declareClassMixinsPairs = lazyPairs(() => [interfaceExtendsTypePair] as const);
const declareClassImplementsPairs = lazyPairs(() => [classImplementsTypePair] as const);
const declareClassBodyPairs = lazyPairs(() => [objectTypeAnnotationTypePair] as const);

export type DeclareClassFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
    typeParameters: TypeParameterDeclarationTypeClass | LwcErrorTypeClass | null;
    extends: (InterfaceExtendsTypeClass | LwcErrorTypeClass)[] | null;
    mixins: (InterfaceExtendsTypeClass | LwcErrorTypeClass)[] | null;
    implements: (ClassImplementsTypeClass | LwcErrorTypeClass)[] | null;
    body: ObjectTypeAnnotationTypeClass | LwcErrorTypeClass;
};

export class DeclareClassTypeClass extends LwcCommonTypeClass<'declareClass'> {
    private readonly value: DeclareClassFields;

    private constructor(value: DeclareClassFields) {
        super('declareClass');
        this.value = value;
    }

    static create(target: DeclareClass, originalSource: string): DeclareClassTypeClass {
        return new DeclareClassTypeClass({
            id: visitNode(target.id, originalSource, declareClassIdPairs(), 'DeclareClass.id'),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                declareClassTypeParametersPairs(),
                'DeclareClass.typeParameters',
            ),
            extends:
                target.extends == null
                    ? null
                    : visitNodeList(
                          target.extends,
                          originalSource,
                          declareClassExtendsPairs(),
                          'DeclareClass.extends',
                      ),
            mixins:
                target.mixins == null
                    ? null
                    : visitNodeList(
                          target.mixins,
                          originalSource,
                          declareClassMixinsPairs(),
                          'DeclareClass.mixins',
                      ),
            implements:
                target.implements == null
                    ? null
                    : visitNodeList(
                          target.implements,
                          originalSource,
                          declareClassImplementsPairs(),
                          'DeclareClass.implements',
                      ),
            body: visitNode(
                target.body,
                originalSource,
                declareClassBodyPairs(),
                'DeclareClass.body',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): DeclareClassFields {
        return this.value;
    }

    getId(): DeclareClassFields['id'] {
        return this.value.id;
    }

    getTypeParameters(): DeclareClassFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getExtends(): DeclareClassFields['extends'] {
        return this.value.extends;
    }

    getMixins(): DeclareClassFields['mixins'] {
        return this.value.mixins;
    }

    getImplements(): DeclareClassFields['implements'] {
        return this.value.implements;
    }

    getBody(): DeclareClassFields['body'] {
        return this.value.body;
    }
}

export const declareClassTypePair: EvaluatePair<DeclareClass, DeclareClassTypeClass> =
    makeEvaluatePair(isDeclareClass, (target, originalSource) =>
        DeclareClassTypeClass.create(target, originalSource),
    );

export const isDeclareClassType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareClassTypeClass => target instanceof DeclareClassTypeClass;
