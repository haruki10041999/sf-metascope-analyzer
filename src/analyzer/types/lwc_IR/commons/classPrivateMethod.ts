import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isClassPrivateMethod, type ClassPrivateMethod } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { typeAnnotationTypePair } from '../flowVisitor/typeAnnotation';
import { typeParameterDeclarationTypePair } from '../flowVisitor/typeParameterDeclaration';
import {
    functionParameterVisitorEvaluatePairs,
    type FunctionParameterTypeClass,
} from '../functionParameterVisitor';
import { tSTypeAnnotationTypePair } from '../typeScriptVisitor/tSTypeAnnotation';
import { tSTypeParameterDeclarationTypePair } from '../typeScriptVisitor/tSTypeParameterDeclaration';
import { BlockStatementTypeClass } from './blockStatement';
import { type MethodReturnTypeClass, type MethodTypeParametersTypeClass } from './classMethod';
import { DecoratorTypeClass } from './decorator';
import {
    createGetterParams,
    createSetterParams,
    rejectChild,
    setterParamPairs,
    type GetterParams,
    type SetterParams,
} from './memberKey';
import { PrivateNameTypeClass } from './privateName';

const classPrivateMethodReturnTypePairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const classPrivateMethodTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair, tSTypeParameterDeclarationTypePair] as const,
);

/**
 * `#x() {}`。key は常に PrivateName で computed ではない。constructor はないので TSParameterProperty も持たない。
 * `#x` には TS のアクセス修飾子 (accessibility・abstract・optional) を付けられないので、override だけを持つ。
 * get・set の params の決まりは ClassMethod と同じ (memberKey.ts)
 */
export type ClassPrivateMethodFields = TypeField<'classPrivateMethod'> & {
    key: PrivateNameTypeClass;
    static: ClassPrivateMethod['static'];
    override: boolean;
    decorators: DecoratorTypeClass[];
    body: BlockStatementTypeClass;
} & (
        | {
              kind: 'method';
              generator: ClassPrivateMethod['generator'];
              async: ClassPrivateMethod['async'];
              params: FunctionParameterTypeClass[];
              returnType: MethodReturnTypeClass | null;
              typeParameters: MethodTypeParametersTypeClass | null;
          }
        | {
              kind: 'get';
              params: GetterParams;
              returnType: MethodReturnTypeClass | null;
          }
        | {
              kind: 'set';
              params: SetterParams;
          }
    );

export class ClassPrivateMethodTypeClass extends LwcCommonTypeClass<
    'classPrivateMethod',
    ClassPrivateMethodFields
> {
    private constructor(value: FieldsOf<ClassPrivateMethodFields>, sourceSpan: SourceSpan) {
        super('classPrivateMethod', value, sourceSpan);
    }

    static create(target: ClassPrivateMethod, originalSource: string): ClassPrivateMethodTypeClass {
        const common = {
            key: PrivateNameTypeClass.create(target.key, originalSource),
            static: target.static,
            override: target.override ?? false,
            decorators: (target.decorators ?? []).map((child) =>
                DecoratorTypeClass.create(child, originalSource),
            ),
            body: BlockStatementTypeClass.create(target.body, originalSource),
        };
        const returnType = (): MethodReturnTypeClass | null =>
            visitOptionalNode(
                target.returnType,
                originalSource,
                classPrivateMethodReturnTypePairs(),
                'ClassPrivateMethod.returnType',
            );

        switch (target.kind) {
            case 'method':
                return new ClassPrivateMethodTypeClass(
                    {
                        ...common,
                        kind: 'method',
                        generator: target.generator,
                        async: target.async,
                        params: visitNodeList(
                            target.params,
                            originalSource,
                            functionParameterVisitorEvaluatePairs(),
                            'ClassPrivateMethod.params',
                        ),
                        returnType: returnType(),
                        typeParameters: visitOptionalNode(
                            target.typeParameters,
                            originalSource,
                            classPrivateMethodTypeParametersPairs(),
                            'ClassPrivateMethod.typeParameters',
                        ),
                    },
                    getSourceSpan(target, originalSource),
                );
            case 'get':
                rejectChild(
                    target,
                    target.typeParameters,
                    originalSource,
                    'get は型パラメータを持てません',
                );
                return new ClassPrivateMethodTypeClass(
                    {
                        ...common,
                        kind: 'get',
                        params: createGetterParams(target, originalSource, 'ClassPrivateMethod'),
                        returnType: returnType(),
                    },
                    getSourceSpan(target, originalSource),
                );
            case 'set':
                rejectChild(
                    target,
                    target.typeParameters,
                    originalSource,
                    'set は型パラメータを持てません',
                );
                rejectChild(
                    target,
                    target.returnType,
                    originalSource,
                    'set は戻り値の型を持てません',
                );
                return new ClassPrivateMethodTypeClass(
                    {
                        ...common,
                        kind: 'set',
                        params: createSetterParams(
                            target,
                            originalSource,
                            setterParamPairs(),
                            'ClassPrivateMethod',
                        ),
                    },
                    getSourceSpan(target, originalSource),
                );
        }
    }

    getParams(): ClassPrivateMethodFields['params'] {
        return this.getFields().params;
    }

    getStatic(): ClassPrivateMethodFields['static'] {
        return this.getFields().static;
    }

    getOverride(): ClassPrivateMethodFields['override'] {
        return this.getFields().override;
    }

    getKey(): ClassPrivateMethodFields['key'] {
        return this.getFields().key;
    }

    getKind(): ClassPrivateMethodFields['kind'] {
        return this.getFields().kind;
    }

    getDecorators(): ClassPrivateMethodFields['decorators'] {
        return this.getFields().decorators;
    }

    getBody(): ClassPrivateMethodFields['body'] {
        return this.getFields().body;
    }
}

export const classPrivateMethodTypePair: EvaluatePair<
    ClassPrivateMethod,
    ClassPrivateMethodTypeClass
> = makeEvaluatePair(isClassPrivateMethod, (target, originalSource) =>
    ClassPrivateMethodTypeClass.create(target, originalSource),
);

export const isClassPrivateMethodType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ClassPrivateMethodTypeClass => target instanceof ClassPrivateMethodTypeClass;
