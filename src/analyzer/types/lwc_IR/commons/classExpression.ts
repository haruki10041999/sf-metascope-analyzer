import { isClassExpression, type ClassExpression } from '@babel/types';
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
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
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
import {
    typeParameterInstantiationTypePair,
    type TypeParameterInstantiationTypeClass,
} from '../flowVisitor/typeParameterInstantiation';
import { classBodyTypePair, type ClassBodyTypeClass } from '../standardizedVisitor/classBody';
import {
    tSTypeParameterDeclarationTypePair,
    type TSTypeParameterDeclarationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterDeclaration';
import {
    tSTypeParameterInstantiationTypePair,
    type TSTypeParameterInstantiationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterInstantiation';
import { decoratorTypePair, type DecoratorTypeClass } from './decorator';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { tSClassImplementsTypePair, type TSClassImplementsTypeClass } from './tSClassImplements';

const classExpressionIdPairs = lazyPairs(() => [identifierTypePair] as const);
const classExpressionTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair, tSTypeParameterDeclarationTypePair] as const,
);
const classExpressionBodyPairs = lazyPairs(() => [classBodyTypePair] as const);
const classExpressionSuperTypeArgumentsPairs = lazyPairs(
    () => [typeParameterInstantiationTypePair, tSTypeParameterInstantiationTypePair] as const,
);
const classExpressionImplementsPairs = lazyPairs(
    () => [tSClassImplementsTypePair, classImplementsTypePair] as const,
);
const classExpressionDecoratorsPairs = lazyPairs(() => [decoratorTypePair] as const);
const classExpressionMixinsPairs = lazyPairs(() => [interfaceExtendsTypePair] as const);

export type ClassExpressionFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass | null;
    typeParameters:
        | TypeParameterDeclarationTypeClass
        | TSTypeParameterDeclarationTypeClass
        | LwcErrorTypeClass
        | null;
    body: ClassBodyTypeClass | LwcErrorTypeClass;
    superClass: ExpressionTypeClass | LwcErrorTypeClass | null;
    superTypeArguments:
        | TypeParameterInstantiationTypeClass
        | TSTypeParameterInstantiationTypeClass
        | LwcErrorTypeClass
        | null;
    implements:
        (TSClassImplementsTypeClass | ClassImplementsTypeClass | LwcErrorTypeClass)[] | null;
    decorators: (DecoratorTypeClass | LwcErrorTypeClass)[] | null;
    mixins: InterfaceExtendsTypeClass | LwcErrorTypeClass | null;
};

export class ClassExpressionTypeClass extends LwcCommonTypeClass<'classExpression'> {
    private readonly value: ClassExpressionFields;

    private constructor(value: ClassExpressionFields) {
        super('classExpression');
        this.value = value;
    }

    static create(target: ClassExpression, originalSource: string): ClassExpressionTypeClass {
        return new ClassExpressionTypeClass({
            id: visitOptionalNode(
                target.id,
                originalSource,
                classExpressionIdPairs(),
                'ClassExpression.id',
            ),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                classExpressionTypeParametersPairs(),
                'ClassExpression.typeParameters',
            ),
            body: visitNode(
                target.body,
                originalSource,
                classExpressionBodyPairs(),
                'ClassExpression.body',
            ),
            superClass: visitOptionalNode(
                target.superClass,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            superTypeArguments: visitOptionalNode(
                target.superTypeArguments,
                originalSource,
                classExpressionSuperTypeArgumentsPairs(),
                'ClassExpression.superTypeArguments',
            ),
            implements:
                target.implements == null
                    ? null
                    : visitNodeList(
                          target.implements,
                          originalSource,
                          classExpressionImplementsPairs(),
                          'ClassExpression.implements',
                      ),
            decorators:
                target.decorators == null
                    ? null
                    : visitNodeList(
                          target.decorators,
                          originalSource,
                          classExpressionDecoratorsPairs(),
                          'ClassExpression.decorators',
                      ),
            mixins: visitOptionalNode(
                target.mixins,
                originalSource,
                classExpressionMixinsPairs(),
                'ClassExpression.mixins',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ClassExpressionFields {
        return this.value;
    }

    getId(): ClassExpressionFields['id'] {
        return this.value.id;
    }

    getTypeParameters(): ClassExpressionFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getBody(): ClassExpressionFields['body'] {
        return this.value.body;
    }

    getSuperClass(): ClassExpressionFields['superClass'] {
        return this.value.superClass;
    }

    getSuperTypeArguments(): ClassExpressionFields['superTypeArguments'] {
        return this.value.superTypeArguments;
    }

    getImplements(): ClassExpressionFields['implements'] {
        return this.value.implements;
    }

    getDecorators(): ClassExpressionFields['decorators'] {
        return this.value.decorators;
    }

    getMixins(): ClassExpressionFields['mixins'] {
        return this.value.mixins;
    }
}

export const classExpressionTypePair: EvaluatePair<ClassExpression, ClassExpressionTypeClass> =
    makeEvaluatePair(isClassExpression, (target, originalSource) =>
        ClassExpressionTypeClass.create(target, originalSource),
    );

export const isClassExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is ClassExpressionTypeClass => target instanceof ClassExpressionTypeClass;
