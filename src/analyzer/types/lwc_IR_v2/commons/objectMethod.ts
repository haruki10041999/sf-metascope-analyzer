import { isObjectMethod, type ObjectMethod } from '@babel/types';
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
    tSTypeAnnotationTypePair,
    type TSTypeAnnotationTypeClass,
} from '../typeScriptVisitor/tSTypeAnnotation';
import {
    tSTypeParameterDeclarationTypePair,
    type TSTypeParameterDeclarationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterDeclaration';
import { blockStatementTypePair, type BlockStatementTypeClass } from './blockStatement';
import { decoratorTypePair, type DecoratorTypeClass } from './decorator';

const objectMethodReturnTypePairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const objectMethodTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair, tSTypeParameterDeclarationTypePair] as const,
);
const objectMethodDecoratorsPairs = lazyPairs(() => [decoratorTypePair] as const);
const objectMethodBodyPairs = lazyPairs(() => [blockStatementTypePair] as const);

export type ObjectMethodFields = {
    params: (FunctionParameterTypeClass | LwcErrorTypeClass)[];
    generator: ObjectMethod['generator'];
    async: ObjectMethod['async'];
    returnType: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    typeParameters:
        | TypeParameterDeclarationTypeClass
        | TSTypeParameterDeclarationTypeClass
        | LwcErrorTypeClass
        | null;
    kind: ObjectMethod['kind'];
    computed: ObjectMethod['computed'];
    key: ExpressionTypeClass | LwcErrorTypeClass;
    decorators: (DecoratorTypeClass | LwcErrorTypeClass)[] | null;
    body: BlockStatementTypeClass | LwcErrorTypeClass;
};

export class ObjectMethodTypeClass extends LwcCommonTypeClass<'objectMethod'> {
    private readonly value: ObjectMethodFields;

    private constructor(value: ObjectMethodFields) {
        super('objectMethod');
        this.value = value;
    }

    static create(target: ObjectMethod, originalSource: string): ObjectMethodTypeClass {
        return new ObjectMethodTypeClass({
            params: visitNodeList(
                target.params,
                originalSource,
                functionParameterVisitorEvaluatePairs(),
                'FunctionParameterVisitor',
            ),
            generator: target.generator,
            async: target.async,
            returnType: visitOptionalNode(
                target.returnType,
                originalSource,
                objectMethodReturnTypePairs(),
                'ObjectMethod.returnType',
            ),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                objectMethodTypeParametersPairs(),
                'ObjectMethod.typeParameters',
            ),
            kind: target.kind,
            computed: target.computed,
            key: visitNode(
                target.key,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            decorators:
                target.decorators == null
                    ? null
                    : visitNodeList(
                          target.decorators,
                          originalSource,
                          objectMethodDecoratorsPairs(),
                          'ObjectMethod.decorators',
                      ),
            body: visitNode(
                target.body,
                originalSource,
                objectMethodBodyPairs(),
                'ObjectMethod.body',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ObjectMethodFields {
        return this.value;
    }

    getParams(): ObjectMethodFields['params'] {
        return this.value.params;
    }

    getGenerator(): ObjectMethodFields['generator'] {
        return this.value.generator;
    }

    getAsync(): ObjectMethodFields['async'] {
        return this.value.async;
    }

    getReturnType(): ObjectMethodFields['returnType'] {
        return this.value.returnType;
    }

    getTypeParameters(): ObjectMethodFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getKind(): ObjectMethodFields['kind'] {
        return this.value.kind;
    }

    getComputed(): ObjectMethodFields['computed'] {
        return this.value.computed;
    }

    getKey(): ObjectMethodFields['key'] {
        return this.value.key;
    }

    getDecorators(): ObjectMethodFields['decorators'] {
        return this.value.decorators;
    }

    getBody(): ObjectMethodFields['body'] {
        return this.value.body;
    }
}

export const objectMethodTypePair: EvaluatePair<ObjectMethod, ObjectMethodTypeClass> =
    makeEvaluatePair(isObjectMethod, (target, originalSource) =>
        ObjectMethodTypeClass.create(target, originalSource),
    );

export const isObjectMethodType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectMethodTypeClass => target instanceof ObjectMethodTypeClass;
