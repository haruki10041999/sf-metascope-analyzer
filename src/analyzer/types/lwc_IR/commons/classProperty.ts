import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import {
    isClassProperty,
    isTSTypeAnnotation,
    isTypeAnnotation,
    type ClassProperty,
    type Expression,
    type Node,
    type TSTypeAnnotation,
    type TypeAnnotation,
    type Variance,
} from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import {
    typeAnnotationTypePair,
    type TypeAnnotationTypeClass,
} from '../flowVisitor/typeAnnotation';
import { VarianceTypeClass } from '../flowVisitor/variance';
import {
    tSTypeAnnotationTypePair,
    type TSTypeAnnotationTypeClass,
} from '../typeScriptVisitor/tSTypeAnnotation';
import { DecoratorTypeClass } from './decorator';
import {
    createMemberKey,
    failUnsupported,
    staticMemberKeyPairs,
    type MemberKey,
} from './memberKey';

const classMemberTsTypeAnnotationPairs = lazyPairs(() => [tSTypeAnnotationTypePair] as const);
const classMemberFlowTypeAnnotationPairs = lazyPairs(() => [typeAnnotationTypePair] as const);

// ---------------------------------------------------------------------------
// クラスのプロパティ (ClassProperty・ClassAccessorProperty・ClassPrivateProperty) で共通に使う型
// ---------------------------------------------------------------------------

/**
 * 初期化 (ClassProperty・ClassAccessorProperty)。TS で文法エラーになる組み合わせ
 * (declare・abstract・definite に value、definite と optional の両方など) を書けないように分ける
 * - value: `x = v` (`x?: T = v` も)
 * - none: `x;`・`x?: T;`・`abstract x: T;`
 * - definite: `x!: T;`
 * - declare: `declare x: T;`
 */
export type ClassPropertyInit =
    | { kind: 'value'; value: ExpressionTypeClass; optional: boolean }
    | { kind: 'none'; optional: boolean; abstract: boolean }
    | { kind: 'definite' }
    | { kind: 'declare'; optional: boolean };

/**
 * 型注釈と、言語 (TS・Flow) だけの修飾子のまとまり。1 つのプロパティで TS と Flow は混ざらない。
 * どちらの型注釈・修飾子もないとき (JS) は null
 */
export type ClassMemberAnnotation<TTsModifiers> =
    | ({ kind: 'ts'; typeAnnotation: TSTypeAnnotationTypeClass | null } & TTsModifiers)
    | {
          kind: 'flow';
          typeAnnotation: TypeAnnotationTypeClass | null;
          variance: VarianceTypeClass | null;
      }
    | null;

/** ClassProperty・ClassAccessorProperty の TS の修飾子 */
export type ClassPropertyTsModifiers = {
    accessibility: NonNullable<ClassProperty['accessibility']> | null;
    readonly: boolean;
    override: boolean;
};

type ClassPropertyLikeNode = Node & {
    value?: Expression | null;
    abstract?: boolean | null;
    declare?: boolean | null;
    definite?: boolean | null;
    optional?: boolean | null;
};

type AnnotatedNode = Node & {
    typeAnnotation?: TypeAnnotation | TSTypeAnnotation | null;
    variance?: Variance | null;
};

/** 初期化を作る。TS で文法エラーになる組み合わせは IrBuildError (UNSUPPORTED_CONTEXT) */
export const createClassPropertyInit = (
    target: ClassPropertyLikeNode,
    originalSource: string,
    visitorName: string,
): ClassPropertyInit => {
    const optional = target.optional ?? false;
    const abstract = target.abstract ?? false;
    const fail = (message: string): never =>
        failUnsupported(target, originalSource, `${visitorName}: ${message}`);

    if (target.declare) {
        if (target.value != null || target.definite || abstract) {
            return fail('declare に value・definite・abstract は付けられません');
        }
        return { kind: 'declare', optional };
    }
    if (target.definite) {
        if (target.value != null || optional || abstract) {
            return fail('definite に value・optional・abstract は付けられません');
        }
        return { kind: 'definite' };
    }
    if (target.value != null) {
        if (abstract) {
            return fail('abstract に value は付けられません');
        }
        return {
            kind: 'value',
            value: visitNode(
                target.value,
                originalSource,
                expressionVisitorEvaluatePairs(),
                `${visitorName}.value`,
            ),
            optional,
        };
    }
    return { kind: 'none', optional, abstract };
};

/**
 * 型注釈のまとまりを作る。usesTs は、TS だけの修飾子・フラグ (accessibility・readonly・declare など) があるか。
 * TS と Flow が混ざっているときは IrBuildError (UNSUPPORTED_CONTEXT)
 */
export const createClassMemberAnnotation = <TTsModifiers extends object>(
    target: AnnotatedNode,
    originalSource: string,
    visitorName: string,
    tsModifiers: TTsModifiers,
    usesTs: boolean,
): ClassMemberAnnotation<TTsModifiers> => {
    const { typeAnnotation, variance } = target;
    const isTs = usesTs || isTSTypeAnnotation(typeAnnotation);
    const isFlow = variance != null || isTypeAnnotation(typeAnnotation);
    if (isTs && isFlow) {
        return failUnsupported(
            target,
            originalSource,
            `${visitorName}: TS と Flow の型注釈・修飾子が混ざっています`,
        );
    }
    if (isTs) {
        return {
            kind: 'ts',
            typeAnnotation: visitOptionalNode(
                typeAnnotation,
                originalSource,
                classMemberTsTypeAnnotationPairs(),
                `${visitorName}.typeAnnotation`,
            ),
            ...tsModifiers,
        };
    }
    if (isFlow) {
        return {
            kind: 'flow',
            typeAnnotation: visitOptionalNode(
                typeAnnotation,
                originalSource,
                classMemberFlowTypeAnnotationPairs(),
                `${visitorName}.typeAnnotation`,
            ),
            variance: variance == null ? null : VarianceTypeClass.create(variance, originalSource),
        };
    }
    return null;
};

type ClassPropertyTsNode = ClassPropertyLikeNode &
    AnnotatedNode & {
        accessibility?: ClassPropertyTsModifiers['accessibility'] | null;
        readonly?: boolean | null;
        override?: boolean | null;
    };

/** ClassProperty・ClassAccessorProperty の型注釈のまとまり */
export const createClassPropertyAnnotation = (
    target: ClassPropertyTsNode,
    originalSource: string,
    visitorName: string,
): ClassMemberAnnotation<ClassPropertyTsModifiers> => {
    const tsModifiers: ClassPropertyTsModifiers = {
        accessibility: target.accessibility ?? null,
        readonly: target.readonly ?? false,
        override: target.override ?? false,
    };
    const usesTs =
        tsModifiers.accessibility != null ||
        tsModifiers.readonly ||
        tsModifiers.override ||
        Boolean(target.abstract) ||
        Boolean(target.declare) ||
        Boolean(target.definite) ||
        Boolean(target.optional);
    return createClassMemberAnnotation(target, originalSource, visitorName, tsModifiers, usesTs);
};

// ---------------------------------------------------------------------------
// ClassProperty
// ---------------------------------------------------------------------------

/**
 * key は computed で見分ける (computed: false の key は Identifier・文字列・数値・BigInt。PrivateName は
 * ClassPrivateProperty に分かれる)。初期化 (init) と型注釈 (annotation) はまとまりにする
 */
export type ClassPropertyFields = TypeField<'classProperty'> &
    MemberKey & {
        static: ClassProperty['static'];
        decorators: DecoratorTypeClass[];
        init: ClassPropertyInit;
        annotation: ClassMemberAnnotation<ClassPropertyTsModifiers>;
    };

export class ClassPropertyTypeClass extends LwcCommonTypeClass<
    'classProperty',
    ClassPropertyFields
> {
    private constructor(value: FieldsOf<ClassPropertyFields>, sourceSpan: SourceSpan) {
        super('classProperty', value, sourceSpan);
    }

    static create(target: ClassProperty, originalSource: string): ClassPropertyTypeClass {
        return new ClassPropertyTypeClass(
            {
                ...createMemberKey(target, originalSource, staticMemberKeyPairs(), 'ClassProperty'),
                static: target.static,
                decorators: (target.decorators ?? []).map((child) =>
                    DecoratorTypeClass.create(child, originalSource),
                ),
                init: createClassPropertyInit(target, originalSource, 'ClassProperty'),
                annotation: createClassPropertyAnnotation(target, originalSource, 'ClassProperty'),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getComputed(): ClassPropertyFields['computed'] {
        return this.getFields().computed;
    }

    getKey(): ClassPropertyFields['key'] {
        return this.getFields().key;
    }

    getStatic(): ClassPropertyFields['static'] {
        return this.getFields().static;
    }

    getDecorators(): ClassPropertyFields['decorators'] {
        return this.getFields().decorators;
    }

    getInit(): ClassPropertyFields['init'] {
        return this.getFields().init;
    }

    getAnnotation(): ClassPropertyFields['annotation'] {
        return this.getFields().annotation;
    }
}

export const classPropertyTypePair: EvaluatePair<ClassProperty, ClassPropertyTypeClass> =
    makeEvaluatePair(isClassProperty, (target, originalSource) =>
        ClassPropertyTypeClass.create(target, originalSource),
    );

export const isClassPropertyType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ClassPropertyTypeClass => target instanceof ClassPropertyTypeClass;
