import { isClassDeclaration, type ClassDeclaration } from '@babel/types';
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

const classDeclarationIdPairs = lazyPairs(() => [identifierTypePair] as const);
const classDeclarationTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair, tSTypeParameterDeclarationTypePair] as const,
);
const classDeclarationBodyPairs = lazyPairs(() => [classBodyTypePair] as const);
const classDeclarationSuperTypeArgumentsPairs = lazyPairs(
    () => [typeParameterInstantiationTypePair, tSTypeParameterInstantiationTypePair] as const,
);
const classDeclarationImplementsPairs = lazyPairs(
    () => [tSClassImplementsTypePair, classImplementsTypePair] as const,
);
const classDeclarationDecoratorsPairs = lazyPairs(() => [decoratorTypePair] as const);
const classDeclarationMixinsPairs = lazyPairs(() => [interfaceExtendsTypePair] as const);

export type ClassDeclarationFields = {
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
    declare: NonNullable<ClassDeclaration['declare']> | null;
    abstract: NonNullable<ClassDeclaration['abstract']> | null;
};

export class ClassDeclarationTypeClass extends LwcCommonTypeClass<'classDeclaration'> {
    private readonly value: ClassDeclarationFields;

    private constructor(value: ClassDeclarationFields) {
        super('classDeclaration');
        this.value = value;
    }

    static create(target: ClassDeclaration, originalSource: string): ClassDeclarationTypeClass {
        return new ClassDeclarationTypeClass({
            id: visitOptionalNode(
                target.id,
                originalSource,
                classDeclarationIdPairs(),
                'ClassDeclaration.id',
            ),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                classDeclarationTypeParametersPairs(),
                'ClassDeclaration.typeParameters',
            ),
            body: visitNode(
                target.body,
                originalSource,
                classDeclarationBodyPairs(),
                'ClassDeclaration.body',
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
                classDeclarationSuperTypeArgumentsPairs(),
                'ClassDeclaration.superTypeArguments',
            ),
            implements:
                target.implements == null
                    ? null
                    : visitNodeList(
                          target.implements,
                          originalSource,
                          classDeclarationImplementsPairs(),
                          'ClassDeclaration.implements',
                      ),
            decorators:
                target.decorators == null
                    ? null
                    : visitNodeList(
                          target.decorators,
                          originalSource,
                          classDeclarationDecoratorsPairs(),
                          'ClassDeclaration.decorators',
                      ),
            mixins: visitOptionalNode(
                target.mixins,
                originalSource,
                classDeclarationMixinsPairs(),
                'ClassDeclaration.mixins',
            ),
            declare: target.declare ?? null,
            abstract: target.abstract ?? null,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ClassDeclarationFields {
        return this.value;
    }

    getId(): ClassDeclarationFields['id'] {
        return this.value.id;
    }

    getTypeParameters(): ClassDeclarationFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getBody(): ClassDeclarationFields['body'] {
        return this.value.body;
    }

    getSuperClass(): ClassDeclarationFields['superClass'] {
        return this.value.superClass;
    }

    getSuperTypeArguments(): ClassDeclarationFields['superTypeArguments'] {
        return this.value.superTypeArguments;
    }

    getImplements(): ClassDeclarationFields['implements'] {
        return this.value.implements;
    }

    getDecorators(): ClassDeclarationFields['decorators'] {
        return this.value.decorators;
    }

    getMixins(): ClassDeclarationFields['mixins'] {
        return this.value.mixins;
    }

    getDeclare(): ClassDeclarationFields['declare'] {
        return this.value.declare;
    }

    getAbstract(): ClassDeclarationFields['abstract'] {
        return this.value.abstract;
    }
}

export const classDeclarationTypePair: EvaluatePair<ClassDeclaration, ClassDeclarationTypeClass> =
    makeEvaluatePair(isClassDeclaration, (target, originalSource) =>
        ClassDeclarationTypeClass.create(target, originalSource),
    );

export const isClassDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is ClassDeclarationTypeClass => target instanceof ClassDeclarationTypeClass;
