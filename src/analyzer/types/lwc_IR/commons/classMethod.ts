import { isClassMethod, type ClassMethod } from '@babel/types';
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
    typeAnnotationTypePair,
    type TypeAnnotationTypeClass,
} from '../flowVisitor/typeAnnotation';
import {
    typeParameterDeclarationTypePair,
    type TypeParameterDeclarationTypeClass,
} from '../flowVisitor/typeParameterDeclaration';
import {
    functionParameterVisitorEvaluatePairs,
    type FunctionParameterTypeClass,
} from '../functionParameterVisitor';
import {
    tSParameterPropertyTypePair,
    type TSParameterPropertyTypeClass,
} from '../typeScriptVisitor/tSParameterProperty';
import {
    tSTypeAnnotationTypePair,
    type TSTypeAnnotationTypeClass,
} from '../typeScriptVisitor/tSTypeAnnotation';
import {
    tSTypeParameterDeclarationTypePair,
    type TSTypeParameterDeclarationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterDeclaration';
import { blockStatementTypePair, type BlockStatementTypeClass } from './blockStatement';
import { decoratorTypePair, type DecoratorTypeClass } from './decorator';
import { privateNameTypePair, type PrivateNameTypeClass } from './privateName';

const classMethodParamsPairs = lazyPairs(
    () => [...functionParameterVisitorEvaluatePairs(), tSParameterPropertyTypePair] as const,
);
const classMethodKeyPairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), privateNameTypePair] as const,
);
const classMethodDecoratorsPairs = lazyPairs(() => [decoratorTypePair] as const);
const classMethodReturnTypePairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const classMethodTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair, tSTypeParameterDeclarationTypePair] as const,
);
const classMethodBodyPairs = lazyPairs(() => [blockStatementTypePair] as const);

export type ClassMethodFields = {
    params: (FunctionParameterTypeClass | TSParameterPropertyTypeClass | LwcErrorTypeClass)[];
    generator: ClassMethod['generator'];
    async: ClassMethod['async'];
    abstract: NonNullable<ClassMethod['abstract']> | null;
    accessibility: NonNullable<ClassMethod['accessibility']> | null;
    static: ClassMethod['static'];
    override: NonNullable<ClassMethod['override']> | null;
    computed: ClassMethod['computed'];
    optional: NonNullable<ClassMethod['optional']> | null;
    key: ExpressionTypeClass | PrivateNameTypeClass | LwcErrorTypeClass;
    kind: ClassMethod['kind'];
    access: NonNullable<ClassMethod['access']> | null;
    decorators: (DecoratorTypeClass | LwcErrorTypeClass)[] | null;
    returnType: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    typeParameters:
        | TypeParameterDeclarationTypeClass
        | TSTypeParameterDeclarationTypeClass
        | LwcErrorTypeClass
        | null;
    body: BlockStatementTypeClass | LwcErrorTypeClass;
};

export class ClassMethodTypeClass extends LwcCommonTypeClass<'classMethod'> {
    private readonly value: ClassMethodFields;

    private constructor(value: ClassMethodFields) {
        super('classMethod');
        this.value = value;
    }

    static create(target: ClassMethod, originalSource: string): ClassMethodTypeClass {
        return new ClassMethodTypeClass({
            params: visitNodeList(
                target.params,
                originalSource,
                classMethodParamsPairs(),
                'ClassMethod.params',
            ),
            generator: target.generator,
            async: target.async,
            abstract: target.abstract ?? null,
            accessibility: target.accessibility ?? null,
            static: target.static,
            override: target.override ?? null,
            computed: target.computed,
            optional: target.optional ?? null,
            key: visitNode(target.key, originalSource, classMethodKeyPairs(), 'ClassMethod.key'),
            kind: target.kind,
            access: target.access ?? null,
            decorators:
                target.decorators == null
                    ? null
                    : visitNodeList(
                          target.decorators,
                          originalSource,
                          classMethodDecoratorsPairs(),
                          'ClassMethod.decorators',
                      ),
            returnType: visitOptionalNode(
                target.returnType,
                originalSource,
                classMethodReturnTypePairs(),
                'ClassMethod.returnType',
            ),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                classMethodTypeParametersPairs(),
                'ClassMethod.typeParameters',
            ),
            body: visitNode(
                target.body,
                originalSource,
                classMethodBodyPairs(),
                'ClassMethod.body',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ClassMethodFields {
        return this.value;
    }

    getParams(): ClassMethodFields['params'] {
        return this.value.params;
    }

    getGenerator(): ClassMethodFields['generator'] {
        return this.value.generator;
    }

    getAsync(): ClassMethodFields['async'] {
        return this.value.async;
    }

    getAbstract(): ClassMethodFields['abstract'] {
        return this.value.abstract;
    }

    getAccessibility(): ClassMethodFields['accessibility'] {
        return this.value.accessibility;
    }

    getStatic(): ClassMethodFields['static'] {
        return this.value.static;
    }

    getOverride(): ClassMethodFields['override'] {
        return this.value.override;
    }

    getComputed(): ClassMethodFields['computed'] {
        return this.value.computed;
    }

    getOptional(): ClassMethodFields['optional'] {
        return this.value.optional;
    }

    getKey(): ClassMethodFields['key'] {
        return this.value.key;
    }

    getKind(): ClassMethodFields['kind'] {
        return this.value.kind;
    }

    getAccess(): ClassMethodFields['access'] {
        return this.value.access;
    }

    getDecorators(): ClassMethodFields['decorators'] {
        return this.value.decorators;
    }

    getReturnType(): ClassMethodFields['returnType'] {
        return this.value.returnType;
    }

    getTypeParameters(): ClassMethodFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getBody(): ClassMethodFields['body'] {
        return this.value.body;
    }
}

export const classMethodTypePair: EvaluatePair<ClassMethod, ClassMethodTypeClass> =
    makeEvaluatePair(isClassMethod, (target, originalSource) =>
        ClassMethodTypeClass.create(target, originalSource),
    );

export const isClassMethodType = (
    target: LwcCommonTypeClass<string>,
): target is ClassMethodTypeClass => target instanceof ClassMethodTypeClass;
