import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSDeclareMethod, type TSDeclareMethod } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import {
    createGetterParams,
    createMemberKey,
    createSetterParams,
    rejectChild,
    setterParamPairs,
    staticMemberKeyOrPrivateNamePairs,
    type GetterParams,
    type MemberKey,
    type SetterParams,
    type StaticMemberKeyTypeClass,
} from '../commons/memberKey';
import { type PrivateNameTypeClass } from '../commons/privateName';
import {
    functionParameterVisitorEvaluatePairs,
    type FunctionParameterTypeClass,
} from '../functionParameterVisitor';
import {
    tSParameterPropertyTypePair,
    type TSParameterPropertyTypeClass,
} from './tSParameterProperty';
import { TSTypeAnnotationTypeClass } from './tSTypeAnnotation';
import { TSTypeParameterDeclarationTypeClass } from './tSTypeParameterDeclaration';

const tSDeclareMethodConstructorParamsPairs = lazyPairs(
    () => [...functionParameterVisitorEvaluatePairs(), tSParameterPropertyTypePair] as const,
);

/** constructor 以外 (method・get・set) が持つ修飾子 */
type TSDeclareMethodModifiers = {
    static: TSDeclareMethod['static'];
    abstract: boolean;
    override: boolean;
    optional: boolean;
};

/**
 * Babel 8 の TSDeclareMethodComputed | TSDeclareMethodNonComputed と、kind ごとの決まり。
 * - constructor: static・generator・async・returnType・typeParameters を持たない。TSParameterProperty はここだけ
 * - get: params は 0 個 (this パラメータは可)。generator・async・typeParameters を持たない
 * - set: params はちょうど 1 個 (rest は不可)。generator・async・returnType・typeParameters を持たない
 * 旧い access は accessibility と重なるので持たない
 */
export type TSDeclareMethodFields = TypeField<'tSDeclareMethod'> &
    MemberKey<StaticMemberKeyTypeClass | PrivateNameTypeClass> & {
        accessibility: NonNullable<TSDeclareMethod['accessibility']> | null;
    } & (
        | {
              kind: 'constructor';
              params: (FunctionParameterTypeClass | TSParameterPropertyTypeClass)[];
          }
        | ({
              kind: 'method';
              generator: TSDeclareMethod['generator'];
              async: TSDeclareMethod['async'];
              params: FunctionParameterTypeClass[];
              returnType: TSTypeAnnotationTypeClass | null;
              typeParameters: TSTypeParameterDeclarationTypeClass | null;
          } & TSDeclareMethodModifiers)
        | ({
              kind: 'get';
              params: GetterParams;
              returnType: TSTypeAnnotationTypeClass | null;
          } & TSDeclareMethodModifiers)
        | ({ kind: 'set'; params: SetterParams } & TSDeclareMethodModifiers)
    );

export class TSDeclareMethodTypeClass extends LwcCommonTypeClass<
    'tSDeclareMethod',
    TSDeclareMethodFields
> {
    private constructor(value: FieldsOf<TSDeclareMethodFields>, sourceSpan: SourceSpan) {
        super('tSDeclareMethod', value, sourceSpan);
    }

    static create(target: TSDeclareMethod, originalSource: string): TSDeclareMethodTypeClass {
        const common = {
            ...createMemberKey(
                target,
                originalSource,
                staticMemberKeyOrPrivateNamePairs(),
                'TSDeclareMethod',
            ),
            accessibility: target.accessibility ?? null,
        };
        const span = getSourceSpan(target, originalSource);
        const returnType = (): TSTypeAnnotationTypeClass | null =>
            target.returnType == null
                ? null
                : TSTypeAnnotationTypeClass.create(target.returnType, originalSource);

        if (target.kind !== 'method') {
            rejectChild(
                target,
                target.typeParameters,
                originalSource,
                `${target.kind} は型パラメータを持てません`,
            );
        }
        if (target.kind === 'constructor' || target.kind === 'set') {
            rejectChild(
                target,
                target.returnType,
                originalSource,
                `${target.kind} は戻り値の型を持てません`,
            );
        }

        if (target.kind === 'constructor') {
            return new TSDeclareMethodTypeClass(
                {
                    ...common,
                    kind: 'constructor',
                    params: visitNodeList(
                        target.params,
                        originalSource,
                        tSDeclareMethodConstructorParamsPairs(),
                        'TSDeclareMethod.params',
                    ),
                },
                span,
            );
        }

        const modifiers: TSDeclareMethodModifiers = {
            static: target.static,
            abstract: target.abstract ?? false,
            override: target.override ?? false,
            optional: target.optional ?? false,
        };
        switch (target.kind) {
            case 'method':
                return new TSDeclareMethodTypeClass(
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
                            'TSDeclareMethod.params',
                        ),
                        returnType: returnType(),
                        typeParameters:
                            target.typeParameters == null
                                ? null
                                : TSTypeParameterDeclarationTypeClass.create(
                                      target.typeParameters,
                                      originalSource,
                                  ),
                    },
                    span,
                );
            case 'get':
                return new TSDeclareMethodTypeClass(
                    {
                        ...common,
                        ...modifiers,
                        kind: 'get',
                        params: createGetterParams(target, originalSource, 'TSDeclareMethod'),
                        returnType: returnType(),
                    },
                    span,
                );
            case 'set':
                return new TSDeclareMethodTypeClass(
                    {
                        ...common,
                        ...modifiers,
                        kind: 'set',
                        params: createSetterParams(
                            target,
                            originalSource,
                            setterParamPairs(),
                            'TSDeclareMethod',
                        ),
                    },
                    span,
                );
        }
    }

    getParams(): TSDeclareMethodFields['params'] {
        return this.getFields().params;
    }

    getAccessibility(): TSDeclareMethodFields['accessibility'] {
        return this.getFields().accessibility;
    }

    getComputed(): TSDeclareMethodFields['computed'] {
        return this.getFields().computed;
    }

    getKey(): TSDeclareMethodFields['key'] {
        return this.getFields().key;
    }

    getKind(): TSDeclareMethodFields['kind'] {
        return this.getFields().kind;
    }
}

export const tSDeclareMethodTypePair: EvaluatePair<TSDeclareMethod, TSDeclareMethodTypeClass> =
    makeEvaluatePair(isTSDeclareMethod, (target, originalSource) =>
        TSDeclareMethodTypeClass.create(target, originalSource),
    );

export const isTSDeclareMethodType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSDeclareMethodTypeClass => target instanceof TSDeclareMethodTypeClass;
