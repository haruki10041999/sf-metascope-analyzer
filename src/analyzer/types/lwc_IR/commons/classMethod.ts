import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isClassMethod, type ClassMethod } from '@babel/types';
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
import { BlockStatementTypeClass } from './blockStatement';
import { DecoratorTypeClass } from './decorator';
import {
    createGetterParams,
    createMemberKey,
    createSetterParams,
    rejectChild,
    setterParamPairs,
    staticMemberKeyPairs,
    type GetterParams,
    type MemberKey,
    type SetterParams,
} from './memberKey';

const classMethodConstructorParamsPairs = lazyPairs(
    () => [...functionParameterVisitorEvaluatePairs(), tSParameterPropertyTypePair] as const,
);
const classMethodReturnTypePairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const classMethodTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair, tSTypeParameterDeclarationTypePair] as const,
);

/** メソッドの戻り値の型注釈 (Flow・TS) */
export type MethodReturnTypeClass = TypeAnnotationTypeClass | TSTypeAnnotationTypeClass;
/** メソッドの型パラメータ (Flow・TS) */
export type MethodTypeParametersTypeClass =
    TypeParameterDeclarationTypeClass | TSTypeParameterDeclarationTypeClass;

/** constructor 以外 (method・get・set) が持つ修飾子 */
type ClassMethodModifiers = {
    static: ClassMethod['static'];
    abstract: boolean;
    override: boolean;
    optional: boolean;
    decorators: DecoratorTypeClass[];
};

/**
 * kind ごとに持てるものが違う (Babel 8 の ClassMethodComputed | ClassMethodNonComputed と、kind の決まり)。
 * - constructor: static・generator・async・returnType・typeParameters・decorators を持たない。TSParameterProperty はここだけ
 * - get: params は 0 個 (TS の this パラメータは可)。generator・async・typeParameters を持たない
 * - set: params はちょうど 1 個 (rest は不可)。generator・async・returnType・typeParameters を持たない
 */
export type ClassMethodFields = TypeField<'classMethod'> &
    MemberKey & {
        accessibility: NonNullable<ClassMethod['accessibility']> | null;
        body: BlockStatementTypeClass;
    } & (
        | {
              kind: 'constructor';
              params: (FunctionParameterTypeClass | TSParameterPropertyTypeClass)[];
          }
        | ({
              kind: 'method';
              generator: ClassMethod['generator'];
              async: ClassMethod['async'];
              params: FunctionParameterTypeClass[];
              returnType: MethodReturnTypeClass | null;
              typeParameters: MethodTypeParametersTypeClass | null;
          } & ClassMethodModifiers)
        | ({
              kind: 'get';
              params: GetterParams;
              returnType: MethodReturnTypeClass | null;
          } & ClassMethodModifiers)
        | ({
              kind: 'set';
              params: SetterParams;
          } & ClassMethodModifiers)
    );

export class ClassMethodTypeClass extends LwcCommonTypeClass<'classMethod', ClassMethodFields> {
    private constructor(value: FieldsOf<ClassMethodFields>, sourceSpan: SourceSpan) {
        super('classMethod', value, sourceSpan);
    }

    static create(target: ClassMethod, originalSource: string): ClassMethodTypeClass {
        const common = {
            ...createMemberKey(target, originalSource, staticMemberKeyPairs(), 'ClassMethod'),
            accessibility: target.accessibility ?? null,
            body: BlockStatementTypeClass.create(target.body, originalSource),
        };
        if (target.kind === 'constructor') {
            rejectChild(
                target,
                target.returnType,
                originalSource,
                'constructor は戻り値の型を持てません',
            );
            rejectChild(
                target,
                target.typeParameters,
                originalSource,
                'constructor は型パラメータを持てません',
            );
            return new ClassMethodTypeClass(
                {
                    ...common,
                    kind: 'constructor',
                    params: visitNodeList(
                        target.params,
                        originalSource,
                        classMethodConstructorParamsPairs(),
                        'ClassMethod.params',
                    ),
                },
                getSourceSpan(target, originalSource),
            );
        }

        const modifiers: ClassMethodModifiers = {
            static: target.static,
            abstract: target.abstract ?? false,
            override: target.override ?? false,
            optional: target.optional ?? false,
            decorators: (target.decorators ?? []).map((child) =>
                DecoratorTypeClass.create(child, originalSource),
            ),
        };
        const returnType = (): MethodReturnTypeClass | null =>
            visitOptionalNode(
                target.returnType,
                originalSource,
                classMethodReturnTypePairs(),
                'ClassMethod.returnType',
            );

        if (target.kind === 'get' || target.kind === 'set') {
            rejectChild(
                target,
                target.typeParameters,
                originalSource,
                'get・set は型パラメータを持てません',
            );
        }

        switch (target.kind) {
            case 'method':
                return new ClassMethodTypeClass(
                    {
                        ...common,
                        ...modifiers,
                        kind: 'method',
                        generator: target.generator,
                        async: target.async,
                        params: visitNodeList(
                            target.params,
                            originalSource,
                            functionParameterVisitorEvaluatePairs(),
                            'ClassMethod.params',
                        ),
                        returnType: returnType(),
                        typeParameters: visitOptionalNode(
                            target.typeParameters,
                            originalSource,
                            classMethodTypeParametersPairs(),
                            'ClassMethod.typeParameters',
                        ),
                    },
                    getSourceSpan(target, originalSource),
                );
            case 'get':
                return new ClassMethodTypeClass(
                    {
                        ...common,
                        ...modifiers,
                        kind: 'get',
                        params: createGetterParams(target, originalSource, 'ClassMethod'),
                        returnType: returnType(),
                    },
                    getSourceSpan(target, originalSource),
                );
            case 'set':
                rejectChild(
                    target,
                    target.returnType,
                    originalSource,
                    'set は戻り値の型を持てません',
                );
                return new ClassMethodTypeClass(
                    {
                        ...common,
                        ...modifiers,
                        kind: 'set',
                        params: createSetterParams(
                            target,
                            originalSource,
                            setterParamPairs(),
                            'ClassMethod',
                        ),
                    },
                    getSourceSpan(target, originalSource),
                );
        }
    }

    getParams(): ClassMethodFields['params'] {
        return this.getFields().params;
    }

    getAccessibility(): ClassMethodFields['accessibility'] {
        return this.getFields().accessibility;
    }

    getComputed(): ClassMethodFields['computed'] {
        return this.getFields().computed;
    }

    getKey(): ClassMethodFields['key'] {
        return this.getFields().key;
    }

    getKind(): ClassMethodFields['kind'] {
        return this.getFields().kind;
    }

    getBody(): ClassMethodFields['body'] {
        return this.getFields().body;
    }
}

export const classMethodTypePair: EvaluatePair<ClassMethod, ClassMethodTypeClass> =
    makeEvaluatePair(isClassMethod, (target, originalSource) =>
        ClassMethodTypeClass.create(target, originalSource),
    );

export const isClassMethodType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ClassMethodTypeClass => target instanceof ClassMethodTypeClass;
