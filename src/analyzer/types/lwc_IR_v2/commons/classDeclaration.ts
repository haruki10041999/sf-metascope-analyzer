import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isClassDeclaration, type ClassDeclaration, type ClassExpression } from '@babel/types';
import { failIrBuild } from '../buildFailure';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import {
    classImplementsTypePair,
    type ClassImplementsTypeClass,
} from '../flowVisitor/classImplements';
import { InterfaceExtendsTypeClass } from '../flowVisitor/interfaceExtends';
import {
    typeParameterDeclarationTypePair,
    type TypeParameterDeclarationTypeClass,
} from '../flowVisitor/typeParameterDeclaration';
import {
    typeParameterInstantiationTypePair,
    type TypeParameterInstantiationTypeClass,
} from '../flowVisitor/typeParameterInstantiation';
import { ClassBodyTypeClass } from '../standardizedVisitor/classBody';
import {
    tSTypeParameterDeclarationTypePair,
    type TSTypeParameterDeclarationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterDeclaration';
import {
    tSTypeParameterInstantiationTypePair,
    type TSTypeParameterInstantiationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterInstantiation';
import { DecoratorTypeClass } from './decorator';
import { IdentifierTypeClass } from './identifier';
import { tSClassImplementsTypePair, type TSClassImplementsTypeClass } from './tSClassImplements';

const classDeclarationTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair, tSTypeParameterDeclarationTypePair] as const,
);
const classDeclarationSuperTypeArgumentsPairs = lazyPairs(
    () => [typeParameterInstantiationTypePair, tSTypeParameterInstantiationTypePair] as const,
);
const classDeclarationImplementsPairs = lazyPairs(
    () => [tSClassImplementsTypePair, classImplementsTypePair] as const,
);

/** extends 句。superTypeArguments (`extends Base<T>` の `<T>`) は superClass があるときだけ書ける */
export type ClassHeritage = {
    superClass: ExpressionTypeClass;
    superTypeArguments:
        TypeParameterInstantiationTypeClass | TSTypeParameterInstantiationTypeClass | null;
};

/** ClassDeclaration・ClassExpression の extends 句を作る */
export const createClassHeritage = (
    target: ClassDeclaration | ClassExpression,
    originalSource: string,
): ClassHeritage | null => {
    if (target.superClass == null) {
        return target.superTypeArguments == null
            ? null
            : failIrBuild(
                  'TYPE_MISMATCH',
                  target,
                  originalSource,
                  'extends のないクラスに superTypeArguments は書けません',
              );
    }
    return {
        superClass: visitNode(
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
    };
};

/**
 * 名前のないクラスの宣言を書けるのは `export default class {}` だけなので、id は既定で null にしない。
 * export default の側では ClassDeclarationTypeClass<IdentifierTypeClass | null> を使う
 */
export type ClassDeclarationFields<TId extends IdentifierTypeClass | null = IdentifierTypeClass> =
    TypeField<'classDeclaration'> & {
        id: TId;
        typeParameters:
            TypeParameterDeclarationTypeClass | TSTypeParameterDeclarationTypeClass | null;
        body: ClassBodyTypeClass;
        heritage: ClassHeritage | null;
        implements: (TSClassImplementsTypeClass | ClassImplementsTypeClass)[] | null;
        decorators: DecoratorTypeClass[] | null;
        mixins: InterfaceExtendsTypeClass | null;
        declare: boolean;
        abstract: boolean;
    };

export class ClassDeclarationTypeClass<
    TId extends IdentifierTypeClass | null = IdentifierTypeClass,
> extends LwcCommonTypeClass<'classDeclaration', ClassDeclarationFields<TId>> {
    private constructor(value: FieldsOf<ClassDeclarationFields<TId>>, sourceSpan: SourceSpan) {
        super('classDeclaration', value, sourceSpan);
    }

    /** 名前のあるクラスの宣言 (export default のほか)。名前がなければ IrBuildError */
    static create(target: ClassDeclaration, originalSource: string): ClassDeclarationTypeClass {
        if (target.id == null) {
            return failIrBuild(
                'TYPE_MISMATCH',
                target,
                originalSource,
                '名前のないクラスの宣言は export default でしか書けません',
            );
        }
        return ClassDeclarationTypeClass.build(
            target,
            IdentifierTypeClass.create(target.id, originalSource),
            originalSource,
        );
    }

    /** export default のクラスの宣言 (名前を省略できる) */
    static createDefaultExport(
        target: ClassDeclaration,
        originalSource: string,
    ): ClassDeclarationTypeClass<IdentifierTypeClass | null> {
        return ClassDeclarationTypeClass.build(
            target,
            target.id == null ? null : IdentifierTypeClass.create(target.id, originalSource),
            originalSource,
        );
    }

    private static build<TId extends IdentifierTypeClass | null>(
        target: ClassDeclaration,
        id: TId,
        originalSource: string,
    ): ClassDeclarationTypeClass<TId> {
        return new ClassDeclarationTypeClass<TId>(
            {
                id,
                typeParameters: visitOptionalNode(
                    target.typeParameters,
                    originalSource,
                    classDeclarationTypeParametersPairs(),
                    'ClassDeclaration.typeParameters',
                ),
                body: ClassBodyTypeClass.create(target.body, originalSource),
                heritage: createClassHeritage(target, originalSource),
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
                        : target.decorators.map((child) =>
                              DecoratorTypeClass.create(child, originalSource),
                          ),
                mixins:
                    target.mixins == null
                        ? null
                        : InterfaceExtendsTypeClass.create(target.mixins, originalSource),
                declare: target.declare ?? false,
                abstract: target.abstract ?? false,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): ClassDeclarationFields<TId>['id'] {
        return this.getFields().id;
    }

    getTypeParameters(): ClassDeclarationFields<TId>['typeParameters'] {
        return this.getFields().typeParameters;
    }

    getBody(): ClassDeclarationFields<TId>['body'] {
        return this.getFields().body;
    }

    getHeritage(): ClassDeclarationFields<TId>['heritage'] {
        return this.getFields().heritage;
    }

    getImplements(): ClassDeclarationFields<TId>['implements'] {
        return this.getFields().implements;
    }

    getDecorators(): ClassDeclarationFields<TId>['decorators'] {
        return this.getFields().decorators;
    }

    getMixins(): ClassDeclarationFields<TId>['mixins'] {
        return this.getFields().mixins;
    }

    getDeclare(): ClassDeclarationFields<TId>['declare'] {
        return this.getFields().declare;
    }

    getAbstract(): ClassDeclarationFields<TId>['abstract'] {
        return this.getFields().abstract;
    }
}

export const classDeclarationTypePair: EvaluatePair<ClassDeclaration, ClassDeclarationTypeClass> =
    makeEvaluatePair(isClassDeclaration, (target, originalSource) =>
        ClassDeclarationTypeClass.create(target, originalSource),
    );

export const isClassDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ClassDeclarationTypeClass<IdentifierTypeClass | null> =>
    target instanceof ClassDeclarationTypeClass;
