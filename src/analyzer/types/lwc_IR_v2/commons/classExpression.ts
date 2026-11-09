import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isClassExpression, type ClassExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import {
    classImplementsTypePair,
    type ClassImplementsTypeClass,
} from '../flowVisitor/classImplements';
import { InterfaceExtendsTypeClass } from '../flowVisitor/interfaceExtends';
import {
    typeParameterDeclarationTypePair,
    type TypeParameterDeclarationTypeClass,
} from '../flowVisitor/typeParameterDeclaration';
import { ClassBodyTypeClass } from '../standardizedVisitor/classBody';
import {
    tSTypeParameterDeclarationTypePair,
    type TSTypeParameterDeclarationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterDeclaration';
import { DecoratorTypeClass } from './decorator';
import { createClassHeritage, type ClassHeritage } from './classDeclaration';
import { IdentifierTypeClass } from './identifier';
import { tSClassImplementsTypePair, type TSClassImplementsTypeClass } from './tSClassImplements';

const classExpressionTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair, tSTypeParameterDeclarationTypePair] as const,
);
const classExpressionImplementsPairs = lazyPairs(
    () => [tSClassImplementsTypePair, classImplementsTypePair] as const,
);

export type ClassExpressionFields = TypeField<'classExpression'> & {
    id: IdentifierTypeClass | null;
    typeParameters: TypeParameterDeclarationTypeClass | TSTypeParameterDeclarationTypeClass | null;
    body: ClassBodyTypeClass;
    heritage: ClassHeritage | null;
    implements: (TSClassImplementsTypeClass | ClassImplementsTypeClass)[] | null;
    decorators: DecoratorTypeClass[] | null;
    mixins: InterfaceExtendsTypeClass | null;
};

export class ClassExpressionTypeClass extends LwcCommonTypeClass<
    'classExpression',
    ClassExpressionFields
> {
    private constructor(value: FieldsOf<ClassExpressionFields>, sourceSpan: SourceSpan) {
        super('classExpression', value, sourceSpan);
    }

    static create(target: ClassExpression, originalSource: string): ClassExpressionTypeClass {
        return new ClassExpressionTypeClass(
            {
                id:
                    target.id == null
                        ? null
                        : IdentifierTypeClass.create(target.id, originalSource),
                typeParameters: visitOptionalNode(
                    target.typeParameters,
                    originalSource,
                    classExpressionTypeParametersPairs(),
                    'ClassExpression.typeParameters',
                ),
                body: ClassBodyTypeClass.create(target.body, originalSource),
                heritage: createClassHeritage(target, originalSource),
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
                        : target.decorators.map((child) =>
                              DecoratorTypeClass.create(child, originalSource),
                          ),
                mixins:
                    target.mixins == null
                        ? null
                        : InterfaceExtendsTypeClass.create(target.mixins, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): ClassExpressionFields['id'] {
        return this.getFields().id;
    }

    getTypeParameters(): ClassExpressionFields['typeParameters'] {
        return this.getFields().typeParameters;
    }

    getBody(): ClassExpressionFields['body'] {
        return this.getFields().body;
    }

    getHeritage(): ClassExpressionFields['heritage'] {
        return this.getFields().heritage;
    }

    getImplements(): ClassExpressionFields['implements'] {
        return this.getFields().implements;
    }

    getDecorators(): ClassExpressionFields['decorators'] {
        return this.getFields().decorators;
    }

    getMixins(): ClassExpressionFields['mixins'] {
        return this.getFields().mixins;
    }
}

export const classExpressionTypePair: EvaluatePair<ClassExpression, ClassExpressionTypeClass> =
    makeEvaluatePair(isClassExpression, (target, originalSource) =>
        ClassExpressionTypeClass.create(target, originalSource),
    );

export const isClassExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ClassExpressionTypeClass => target instanceof ClassExpressionTypeClass;
