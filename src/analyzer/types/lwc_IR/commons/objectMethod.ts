import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isObjectMethod, type ObjectMethod } from '@babel/types';
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

const objectMethodReturnTypePairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const objectMethodTypeParametersPairs = lazyPairs(
    () => [typeParameterDeclarationTypePair, tSTypeParameterDeclarationTypePair] as const,
);

/**
 * Babel 8 の ObjectMethodComputed | ObjectMethodNonComputed と、kind ごとの決まり
 * (get・set は generator・async・typeParameters を持たず、params の数が決まる。set は returnType も持たない)。
 * オブジェクトリテラルでは書けないので decorators は持たない
 */
export type ObjectMethodFields = TypeField<'objectMethod'> &
    MemberKey & { body: BlockStatementTypeClass } & (
        | {
              kind: 'method';
              generator: ObjectMethod['generator'];
              async: ObjectMethod['async'];
              params: FunctionParameterTypeClass[];
              returnType: MethodReturnTypeClass | null;
              typeParameters: MethodTypeParametersTypeClass | null;
          }
        | { kind: 'get'; params: GetterParams; returnType: MethodReturnTypeClass | null }
        | { kind: 'set'; params: SetterParams }
    );

export class ObjectMethodTypeClass extends LwcCommonTypeClass<'objectMethod', ObjectMethodFields> {
    private constructor(value: FieldsOf<ObjectMethodFields>, sourceSpan: SourceSpan) {
        super('objectMethod', value, sourceSpan);
    }

    static create(target: ObjectMethod, originalSource: string): ObjectMethodTypeClass {
        const common = {
            ...createMemberKey(target, originalSource, staticMemberKeyPairs(), 'ObjectMethod'),
            body: BlockStatementTypeClass.create(target.body, originalSource),
        };
        const returnType = (): MethodReturnTypeClass | null =>
            visitOptionalNode(
                target.returnType,
                originalSource,
                objectMethodReturnTypePairs(),
                'ObjectMethod.returnType',
            );

        switch (target.kind) {
            case 'method':
                return new ObjectMethodTypeClass(
                    {
                        ...common,
                        kind: 'method',
                        generator: target.generator,
                        async: target.async,
                        params: visitNodeList(
                            target.params,
                            originalSource,
                            functionParameterVisitorEvaluatePairs(),
                            'ObjectMethod.params',
                        ),
                        returnType: returnType(),
                        typeParameters: visitOptionalNode(
                            target.typeParameters,
                            originalSource,
                            objectMethodTypeParametersPairs(),
                            'ObjectMethod.typeParameters',
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
                return new ObjectMethodTypeClass(
                    {
                        ...common,
                        kind: 'get',
                        params: createGetterParams(target, originalSource, 'ObjectMethod'),
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
                return new ObjectMethodTypeClass(
                    {
                        ...common,
                        kind: 'set',
                        params: createSetterParams(
                            target,
                            originalSource,
                            setterParamPairs(),
                            'ObjectMethod',
                        ),
                    },
                    getSourceSpan(target, originalSource),
                );
        }
    }

    getParams(): ObjectMethodFields['params'] {
        return this.getFields().params;
    }

    getKind(): ObjectMethodFields['kind'] {
        return this.getFields().kind;
    }

    getComputed(): ObjectMethodFields['computed'] {
        return this.getFields().computed;
    }

    getKey(): ObjectMethodFields['key'] {
        return this.getFields().key;
    }

    getBody(): ObjectMethodFields['body'] {
        return this.getFields().body;
    }
}

export const objectMethodTypePair: EvaluatePair<ObjectMethod, ObjectMethodTypeClass> =
    makeEvaluatePair(isObjectMethod, (target, originalSource) =>
        ObjectMethodTypeClass.create(target, originalSource),
    );

export const isObjectMethodType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ObjectMethodTypeClass => target instanceof ObjectMethodTypeClass;
