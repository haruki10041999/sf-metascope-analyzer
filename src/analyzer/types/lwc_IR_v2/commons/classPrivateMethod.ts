import { isClassPrivateMethod, type ClassPrivateMethod } from '@babel/types';
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

const classPrivateMethodParamsPairs = lazyPairs(
    () => [...functionParameterVisitorEvaluatePairs(), tSParameterPropertyTypePair] as const,
);
const classPrivateMethodKeyPairs = lazyPairs(() => [privateNameTypePair] as const);
const classPrivateMethodDecoratorsPairs = lazyPairs(() => [decoratorTypePair] as const);
const classPrivateMethodReturnTypePairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const classPrivateMethodTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair, tSTypeParameterDeclarationTypePair] as const,
);
const classPrivateMethodBodyPairs = lazyPairs(() => [blockStatementTypePair] as const);

export type ClassPrivateMethodFields = {
    params: (FunctionParameterTypeClass | TSParameterPropertyTypeClass | LwcErrorTypeClass)[];
    generator: ClassPrivateMethod['generator'];
    async: ClassPrivateMethod['async'];
    abstract: NonNullable<ClassPrivateMethod['abstract']> | null;
    accessibility: NonNullable<ClassPrivateMethod['accessibility']> | null;
    static: ClassPrivateMethod['static'];
    override: NonNullable<ClassPrivateMethod['override']> | null;
    computed: ClassPrivateMethod['computed'];
    optional: NonNullable<ClassPrivateMethod['optional']> | null;
    key: PrivateNameTypeClass | LwcErrorTypeClass;
    kind: ClassPrivateMethod['kind'];
    access: NonNullable<ClassPrivateMethod['access']> | null;
    decorators: (DecoratorTypeClass | LwcErrorTypeClass)[] | null;
    returnType: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    typeParameters:
        | TypeParameterDeclarationTypeClass
        | TSTypeParameterDeclarationTypeClass
        | LwcErrorTypeClass
        | null;
    body: BlockStatementTypeClass | LwcErrorTypeClass;
};

export class ClassPrivateMethodTypeClass extends LwcCommonTypeClass<'classPrivateMethod'> {
    private readonly value: ClassPrivateMethodFields;

    private constructor(value: ClassPrivateMethodFields) {
        super('classPrivateMethod');
        this.value = value;
    }

    static create(target: ClassPrivateMethod, originalSource: string): ClassPrivateMethodTypeClass {
        return new ClassPrivateMethodTypeClass({
            params: visitNodeList(
                target.params,
                originalSource,
                classPrivateMethodParamsPairs(),
                'ClassPrivateMethod.params',
            ),
            generator: target.generator,
            async: target.async,
            abstract: target.abstract ?? null,
            accessibility: target.accessibility ?? null,
            static: target.static,
            override: target.override ?? null,
            computed: target.computed,
            optional: target.optional ?? null,
            key: visitNode(
                target.key,
                originalSource,
                classPrivateMethodKeyPairs(),
                'ClassPrivateMethod.key',
            ),
            kind: target.kind,
            access: target.access ?? null,
            decorators:
                target.decorators == null
                    ? null
                    : visitNodeList(
                          target.decorators,
                          originalSource,
                          classPrivateMethodDecoratorsPairs(),
                          'ClassPrivateMethod.decorators',
                      ),
            returnType: visitOptionalNode(
                target.returnType,
                originalSource,
                classPrivateMethodReturnTypePairs(),
                'ClassPrivateMethod.returnType',
            ),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                classPrivateMethodTypeParametersPairs(),
                'ClassPrivateMethod.typeParameters',
            ),
            body: visitNode(
                target.body,
                originalSource,
                classPrivateMethodBodyPairs(),
                'ClassPrivateMethod.body',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ClassPrivateMethodFields {
        return this.value;
    }

    getParams(): ClassPrivateMethodFields['params'] {
        return this.value.params;
    }

    getGenerator(): ClassPrivateMethodFields['generator'] {
        return this.value.generator;
    }

    getAsync(): ClassPrivateMethodFields['async'] {
        return this.value.async;
    }

    getAbstract(): ClassPrivateMethodFields['abstract'] {
        return this.value.abstract;
    }

    getAccessibility(): ClassPrivateMethodFields['accessibility'] {
        return this.value.accessibility;
    }

    getStatic(): ClassPrivateMethodFields['static'] {
        return this.value.static;
    }

    getOverride(): ClassPrivateMethodFields['override'] {
        return this.value.override;
    }

    getComputed(): ClassPrivateMethodFields['computed'] {
        return this.value.computed;
    }

    getOptional(): ClassPrivateMethodFields['optional'] {
        return this.value.optional;
    }

    getKey(): ClassPrivateMethodFields['key'] {
        return this.value.key;
    }

    getKind(): ClassPrivateMethodFields['kind'] {
        return this.value.kind;
    }

    getAccess(): ClassPrivateMethodFields['access'] {
        return this.value.access;
    }

    getDecorators(): ClassPrivateMethodFields['decorators'] {
        return this.value.decorators;
    }

    getReturnType(): ClassPrivateMethodFields['returnType'] {
        return this.value.returnType;
    }

    getTypeParameters(): ClassPrivateMethodFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getBody(): ClassPrivateMethodFields['body'] {
        return this.value.body;
    }
}

export const classPrivateMethodTypePair: EvaluatePair<
    ClassPrivateMethod,
    ClassPrivateMethodTypeClass
> = makeEvaluatePair(isClassPrivateMethod, (target, originalSource) =>
    ClassPrivateMethodTypeClass.create(target, originalSource),
);

export const isClassPrivateMethodType = (
    target: LwcCommonTypeClass<string>,
): target is ClassPrivateMethodTypeClass => target instanceof ClassPrivateMethodTypeClass;
