import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSMethodSignature, type TSMethodSignature } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { TSTypeAnnotationTypeClass } from '../typeScriptVisitor/tSTypeAnnotation';
import { TSTypeParameterDeclarationTypeClass } from '../typeScriptVisitor/tSTypeParameterDeclaration';
import { arrayPatternTypePair, type ArrayPatternTypeClass } from './arrayPattern';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import {
    createMemberKey,
    failUnsupported,
    rejectChild,
    staticMemberKeyPairs,
    type MemberKey,
} from './memberKey';
import { objectPatternTypePair, type ObjectPatternTypeClass } from './objectPattern';
import { restElementTypePair, type RestElementTypeClass } from './restElement';

const tSMethodSignatureParamsPairs = lazyPairs(
    () =>
        [
            arrayPatternTypePair,
            identifierTypePair,
            objectPatternTypePair,
            restElementTypePair,
        ] as const,
);
const tSMethodSignatureSetterParamPairs = lazyPairs(
    () => [arrayPatternTypePair, identifierTypePair, objectPatternTypePair] as const,
);

/** set の引数 (rest は不可) */
type TSMethodSignatureSetterParam =
    ArrayPatternTypeClass | IdentifierTypeClass | ObjectPatternTypeClass;

/**
 * key は computed で見分ける。kind ごとに params の数が決まる
 * (get は 0 個、set はちょうど 1 個で rest は不可。get・set は typeParameters を持たず、set は returnType も持たない)
 */
export type TSMethodSignatureFields = TypeField<'tSMethodSignature'> &
    MemberKey & { optional: boolean } & (
        | {
              kind: 'method';
              typeParameters: TSTypeParameterDeclarationTypeClass | null;
              params: (TSMethodSignatureSetterParam | RestElementTypeClass)[];
              returnType: TSTypeAnnotationTypeClass | null;
          }
        | { kind: 'get'; params: []; returnType: TSTypeAnnotationTypeClass | null }
        | { kind: 'set'; params: [TSMethodSignatureSetterParam] }
    );

export class TSMethodSignatureTypeClass extends LwcCommonTypeClass<
    'tSMethodSignature',
    TSMethodSignatureFields
> {
    private constructor(value: FieldsOf<TSMethodSignatureFields>, sourceSpan: SourceSpan) {
        super('tSMethodSignature', value, sourceSpan);
    }

    static create(target: TSMethodSignature, originalSource: string): TSMethodSignatureTypeClass {
        const common = {
            ...createMemberKey(target, originalSource, staticMemberKeyPairs(), 'TSMethodSignature'),
            optional: target.optional ?? false,
        };
        const returnType = (): TSTypeAnnotationTypeClass | null =>
            target.returnType == null
                ? null
                : TSTypeAnnotationTypeClass.create(target.returnType, originalSource);
        const span = getSourceSpan(target, originalSource);

        switch (target.kind) {
            case 'method':
                return new TSMethodSignatureTypeClass(
                    {
                        ...common,
                        kind: 'method',
                        typeParameters:
                            target.typeParameters == null
                                ? null
                                : TSTypeParameterDeclarationTypeClass.create(
                                      target.typeParameters,
                                      originalSource,
                                  ),
                        params: visitNodeList(
                            target.params,
                            originalSource,
                            tSMethodSignatureParamsPairs(),
                            'TSMethodSignature.params',
                        ),
                        returnType: returnType(),
                    },
                    span,
                );
            case 'get':
                rejectChild(
                    target,
                    target.typeParameters,
                    originalSource,
                    'get は型パラメータを持てません',
                );
                if (target.params.length !== 0) {
                    return failUnsupported(
                        target,
                        originalSource,
                        'TSMethodSignature: get の引数は 0 個です',
                    );
                }
                return new TSMethodSignatureTypeClass(
                    { ...common, kind: 'get', params: [], returnType: returnType() },
                    span,
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
                if (target.params.length !== 1) {
                    return failUnsupported(
                        target,
                        originalSource,
                        'TSMethodSignature: set の引数はちょうど 1 個です',
                    );
                }
                return new TSMethodSignatureTypeClass(
                    {
                        ...common,
                        kind: 'set',
                        params: [
                            visitNode(
                                target.params[0],
                                originalSource,
                                tSMethodSignatureSetterParamPairs(),
                                'TSMethodSignature.params',
                            ),
                        ],
                    },
                    span,
                );
        }
    }

    getParams(): TSMethodSignatureFields['params'] {
        return this.getFields().params;
    }

    getKey(): TSMethodSignatureFields['key'] {
        return this.getFields().key;
    }

    getComputed(): TSMethodSignatureFields['computed'] {
        return this.getFields().computed;
    }

    getOptional(): TSMethodSignatureFields['optional'] {
        return this.getFields().optional;
    }

    getKind(): TSMethodSignatureFields['kind'] {
        return this.getFields().kind;
    }
}

export const tSMethodSignatureTypePair: EvaluatePair<
    TSMethodSignature,
    TSMethodSignatureTypeClass
> = makeEvaluatePair(isTSMethodSignature, (target, originalSource) =>
    TSMethodSignatureTypeClass.create(target, originalSource),
);

export const isTSMethodSignatureType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSMethodSignatureTypeClass => target instanceof TSMethodSignatureTypeClass;
