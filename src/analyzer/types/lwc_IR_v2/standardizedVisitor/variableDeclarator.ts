import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isVariableDeclarator, type VariableDeclarator } from '@babel/types';
import { failIrBuild } from '../buildFailure';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { arrayPatternTypePair, type ArrayPatternTypeClass } from '../commons/arrayPattern';
import { IdentifierTypeClass, identifierTypePair } from '../commons/identifier';
import { objectPatternTypePair, type ObjectPatternTypeClass } from '../commons/objectPattern';
import { voidPatternTypePair, type VoidPatternTypeClass } from '../commons/voidPattern';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

const variableDeclaratorIdPairs = lazyPairs(
    () =>
        [
            identifierTypePair,
            arrayPatternTypePair,
            objectPatternTypePair,
            voidPatternTypePair,
        ] as const,
);

/** 宣言する名前・パターン */
export type VariableDeclaratorId =
    IdentifierTypeClass | ArrayPatternTypeClass | ObjectPatternTypeClass | VoidPatternTypeClass;

type VariableDeclaratorBase = TypeField<'variableDeclarator'>;

/**
 * definite (`let x!: T`) を書けるのは、id が識別子で init がないときだけ。
 * 宣言の種類 (const・using・for の左辺など) ごとの制限は、下の別名の型で表す
 */
export type VariableDeclaratorFields = VariableDeclaratorBase &
    (
        | { definite: true; id: IdentifierTypeClass; init: null }
        | { definite: false; id: VariableDeclaratorId; init: ExpressionTypeClass | null }
    );

/** 初期化子のある declarator (`const {a} = b`) */
export type InitializedVariableDeclaratorFields = VariableDeclaratorBase & {
    definite: false;
    id: VariableDeclaratorId;
    init: ExpressionTypeClass;
};

/** 初期化子のある、識別子の declarator (`using x = y`) */
export type InitializedIdentifierVariableDeclaratorFields = VariableDeclaratorBase & {
    definite: false;
    id: IdentifierTypeClass;
    init: ExpressionTypeClass;
};

/** 初期化子のない declarator (`declare let x: T`) */
export type UninitializedVariableDeclaratorFields = VariableDeclaratorBase &
    (
        | { definite: true; id: IdentifierTypeClass; init: null }
        | { definite: false; id: VariableDeclaratorId; init: null }
    );

/**
 * const の declarator。初期化子が要る。
 * ただし ambient の文脈 (`declare namespace` / `declare module` / `declare global` の中) では
 * `const x: T;` と書けるので、識別子に限って init のないものも許す
 */
export type ConstVariableDeclaratorFields =
    | InitializedVariableDeclaratorFields
    | (VariableDeclaratorBase & { definite: false; id: IdentifierTypeClass; init: null });

/** for-in・for-of の左辺の declarator (`for (const [k, v] of m)`)。init も definite も書けない */
export type ForHeadVariableDeclaratorFields = VariableDeclaratorBase & {
    definite: false;
    id: VariableDeclaratorId;
    init: null;
};

/** for-of の左辺の using の declarator (`for (using x of y)`)。id は識別子だけ */
export type ForHeadIdentifierVariableDeclaratorFields = VariableDeclaratorBase & {
    definite: false;
    id: IdentifierTypeClass;
    init: null;
};

type DeclaratorFieldsGuard<TFields extends VariableDeclaratorFields> = (
    fields: FieldsOf<VariableDeclaratorFields>,
) => fields is FieldsOf<TFields>;

const isInitialized: DeclaratorFieldsGuard<InitializedVariableDeclaratorFields> = (
    fields,
): fields is FieldsOf<InitializedVariableDeclaratorFields> => fields.init !== null;

const isInitializedIdentifier: DeclaratorFieldsGuard<
    InitializedIdentifierVariableDeclaratorFields
> = (fields): fields is FieldsOf<InitializedIdentifierVariableDeclaratorFields> =>
    fields.init !== null && fields.id instanceof IdentifierTypeClass;

const isUninitialized: DeclaratorFieldsGuard<UninitializedVariableDeclaratorFields> = (
    fields,
): fields is FieldsOf<UninitializedVariableDeclaratorFields> => fields.init === null;

const isConst: DeclaratorFieldsGuard<ConstVariableDeclaratorFields> = (
    fields,
): fields is FieldsOf<ConstVariableDeclaratorFields> =>
    !fields.definite && (fields.init !== null || fields.id instanceof IdentifierTypeClass);

const isForHead: DeclaratorFieldsGuard<ForHeadVariableDeclaratorFields> = (
    fields,
): fields is FieldsOf<ForHeadVariableDeclaratorFields> => !fields.definite && fields.init === null;

const isForHeadIdentifier: DeclaratorFieldsGuard<ForHeadIdentifierVariableDeclaratorFields> = (
    fields,
): fields is FieldsOf<ForHeadIdentifierVariableDeclaratorFields> =>
    !fields.definite && fields.init === null && fields.id instanceof IdentifierTypeClass;

export class VariableDeclaratorTypeClass<
    TFields extends VariableDeclaratorFields = VariableDeclaratorFields,
> extends LwcCommonTypeClass<'variableDeclarator', TFields> {
    private constructor(value: FieldsOf<TFields>, sourceSpan: SourceSpan) {
        super('variableDeclarator', value, sourceSpan);
    }

    private static createFields(
        target: VariableDeclarator,
        originalSource: string,
    ): FieldsOf<VariableDeclaratorFields> {
        const id = visitNode(
            target.id,
            originalSource,
            variableDeclaratorIdPairs(),
            'VariableDeclarator.id',
        );
        const init = visitOptionalNode(
            target.init,
            originalSource,
            expressionVisitorEvaluatePairs(),
            'ExpressionVisitor',
        );
        if (target.definite) {
            if (!(id instanceof IdentifierTypeClass) || init !== null) {
                return failIrBuild(
                    'TYPE_MISMATCH',
                    target,
                    originalSource,
                    'definite (!) を書けるのは、初期化子のない識別子の宣言だけです',
                );
            }
            return { definite: true, id, init: null };
        }
        return { definite: false, id, init };
    }

    private static createAs<TFields extends VariableDeclaratorFields>(
        target: VariableDeclarator,
        originalSource: string,
        guard: DeclaratorFieldsGuard<TFields>,
        message: string,
    ): VariableDeclaratorTypeClass<TFields> {
        const fields = VariableDeclaratorTypeClass.createFields(target, originalSource);
        if (!guard(fields)) {
            return failIrBuild('TYPE_MISMATCH', target, originalSource, message);
        }
        return new VariableDeclaratorTypeClass<TFields>(
            fields,
            getSourceSpan(target, originalSource),
        );
    }

    static create(target: VariableDeclarator, originalSource: string): VariableDeclaratorTypeClass {
        return new VariableDeclaratorTypeClass(
            VariableDeclaratorTypeClass.createFields(target, originalSource),
            getSourceSpan(target, originalSource),
        );
    }

    static createInitialized(
        target: VariableDeclarator,
        originalSource: string,
    ): VariableDeclaratorTypeClass<InitializedVariableDeclaratorFields> {
        return VariableDeclaratorTypeClass.createAs(
            target,
            originalSource,
            isInitialized,
            '初期化子が要ります',
        );
    }

    static createInitializedIdentifier(
        target: VariableDeclarator,
        originalSource: string,
    ): VariableDeclaratorTypeClass<InitializedIdentifierVariableDeclaratorFields> {
        return VariableDeclaratorTypeClass.createAs(
            target,
            originalSource,
            isInitializedIdentifier,
            '識別子と初期化子が要ります',
        );
    }

    static createUninitialized(
        target: VariableDeclarator,
        originalSource: string,
    ): VariableDeclaratorTypeClass<UninitializedVariableDeclaratorFields> {
        return VariableDeclaratorTypeClass.createAs(
            target,
            originalSource,
            isUninitialized,
            '初期化子は書けません',
        );
    }

    static createConst(
        target: VariableDeclarator,
        originalSource: string,
    ): VariableDeclaratorTypeClass<ConstVariableDeclaratorFields> {
        return VariableDeclaratorTypeClass.createAs(
            target,
            originalSource,
            isConst,
            'const の宣言には初期化子が要ります',
        );
    }

    static createForHead(
        target: VariableDeclarator,
        originalSource: string,
    ): VariableDeclaratorTypeClass<ForHeadVariableDeclaratorFields> {
        return VariableDeclaratorTypeClass.createAs(
            target,
            originalSource,
            isForHead,
            'for-in・for-of の左辺の宣言に初期化子・definite は書けません',
        );
    }

    static createForHeadIdentifier(
        target: VariableDeclarator,
        originalSource: string,
    ): VariableDeclaratorTypeClass<ForHeadIdentifierVariableDeclaratorFields> {
        return VariableDeclaratorTypeClass.createAs(
            target,
            originalSource,
            isForHeadIdentifier,
            'for-of の左辺の using の宣言は、初期化子のない識別子だけです',
        );
    }

    getId(): TFields['id'] {
        return this.getFields().id;
    }

    getDefinite(): TFields['definite'] {
        return this.getFields().definite;
    }

    getInit(): TFields['init'] {
        return this.getFields().init;
    }
}

export const variableDeclaratorTypePair: EvaluatePair<
    VariableDeclarator,
    VariableDeclaratorTypeClass
> = makeEvaluatePair(isVariableDeclarator, (target, originalSource) =>
    VariableDeclaratorTypeClass.create(target, originalSource),
);

export const isVariableDeclaratorType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is VariableDeclaratorTypeClass => target instanceof VariableDeclaratorTypeClass;
