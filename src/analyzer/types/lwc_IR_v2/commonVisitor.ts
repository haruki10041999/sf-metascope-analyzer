import type { Node, SourceLocation } from '@babel/types';

import {
    CommonTypeClass,
    ErrorCode,
    TypeField,
    ErrorField,
    ErrorOutputFuncsution,
} from '../commons/ir';
import type { SourcePosition, SourceSpan } from '../commons/source';

// Babel の Position は SourcePosition と同じ基準 (line は 1 始まり、column / index は 0 始まり、
// loc.end は範囲の次の文字) なので、index を offset に移すだけでよい。Position 自体は export されていない
export const toSourcePosition = (position: SourceLocation['start']): SourcePosition => ({
    offset: position.index,
    line: position.line,
    column: position.column,
});

// Babel のノードは getText() を持たないため、元のソースから切り出す
export const getSourceSpan = (ctx: Node | null | undefined, source: string): SourceSpan => {
    if (!ctx || !ctx.loc) {
        return {
            context: '',
            start: { offset: -1, line: -1, column: -1 },
            end: { offset: -1, line: -1, column: -1 },
        };
    }

    return {
        context: source.slice(ctx.loc.start.index, ctx.loc.end.index),
        start: toSourcePosition(ctx.loc.start),
        end: toSourcePosition(ctx.loc.end),
    };
};

export class LwcCommonTypeClass<
    TName extends string,
    TField extends TypeField<TName>,
> extends CommonTypeClass<TName, TField> {
    constructor(
        type: TName,
        properties: Omit<TField, 'type'> = {} as Omit<TField, 'type'>,
        sourceSpan: SourceSpan,
    ) {
        super(type, properties, sourceSpan);
    }

    getChildNodes() {
        return this.findChildren(
            (target): target is LwcCommonTypeClass<string, TypeField<string>> =>
                target instanceof LwcCommonTypeClass,
        );
    }
}

export class LwcErrorTypeClass
    extends LwcCommonTypeClass<'analyzerError', ErrorField>
    implements ErrorOutputFuncsution
{
    private constructor(
        code: ErrorCode,
        contextType: string,
        context: string,
        errorMessage: string,
        sourceSpan: SourceSpan,
    ) {
        super(
            'analyzerError',
            {
                code: code,
                contextType: contextType,
                context: context,
                errorMessage: errorMessage,
            },
            sourceSpan,
        );
    }

    static create(
        code: ErrorCode,
        contextType: string,
        context: string,
        errorMessage: string,
        sourceSpan: SourceSpan,
    ): LwcErrorTypeClass {
        return new LwcErrorTypeClass(code, contextType, context, errorMessage, sourceSpan);
    }

    getCode() {
        return this.getFields().code;
    }

    getContextType() {
        return this.getFields().contextType;
    }

    getContext() {
        return this.getFields().context;
    }

    getParseErrorMessage() {
        return this.getFields().errorMessage;
    }
}

export const isSpicifyLwcCommonTypeClass = <
    TName extends string,
    TField extends TypeField<TName>,
    TLwcCommonTypeClass extends LwcCommonTypeClass<TName, TField>,
>(
    type: TName,
    target: LwcCommonTypeClass<TName, TField>,
): target is TLwcCommonTypeClass => {
    return target instanceof LwcCommonTypeClass && target.getType() === type;
};

export const isLwcErrorTypeClass = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is LwcErrorTypeClass => {
    return isSpicifyLwcCommonTypeClass('analyzerError', target);
};

export type EvaluatePair<
    TNode extends Node,
    TCommonTypeClass extends LwcCommonTypeClass<string, TypeField<string>>,
> = {
    isNode: (target: Node | null | undefined) => target is TNode;
    instance: (target: Node, originalSource: string) => TCommonTypeClass;
};

export const makeEvaluatePair = <
    TNode extends Node,
    TCommonTypeClass extends LwcCommonTypeClass<string, TypeField<string>>,
>(
    isNode: (target: Node | null | undefined) => target is TNode,
    instance: (target: TNode, originalSource: string) => TCommonTypeClass,
): EvaluatePair<TNode, TCommonTypeClass> => ({
    isNode,
    instance: (target, originalSource) => {
        if (!isNode(target)) {
            throw new Error(`想定していた Babel ノード型と違います: ${target.type}`);
        }
        // span は visitWithPairs が付ける (Apex の ApexCommonVisitor.visit と同じく 1 か所)
        return instance(target, originalSource);
    },
});

export type AnyEvaluatePair = {
    isNode: (target: Node | null | undefined) => boolean;
    instance: (
        target: Node,
        originalSource: string,
    ) => LwcCommonTypeClass<string, TypeField<string>>;
};

export type EvaluatePairInstance<TPair> = TPair extends {
    instance: (
        target: Node,
        originalSource: string,
    ) => infer TResult extends LwcCommonTypeClass<string, TypeField<string>>;
}
    ? TResult
    : never;

/**
 * pair の一覧を、初めて使うときに作る。
 * ノードのクラスと alias の Visitor は互いに import し合う (循環する) ため、
 * モジュールの読み込み時に配列を作ると、まだ初期化されていない pair を参照してしまう
 */
export const lazyPairs = <const TPairs extends readonly AnyEvaluatePair[]>(
    make: () => TPairs,
): (() => TPairs) => {
    let pairs: TPairs | undefined;
    return () => (pairs ??= make());
};

/**
 * ノードを、合う pair で TypeClass にする。合う pair がない・例外になったときは LwcErrorTypeClass を返す。
 * errorRecovery: true の Babel は、型に合わないノード (代入の左辺の NumericLiteral など) を返すことがあり、
 * そのときは UNSUPPORTED_CONTEXT になる (構文エラー自体は ast.errors に別に入る)
 */
export const visitWithPairs = <TPair extends AnyEvaluatePair>(
    ctx: Node | null | undefined,
    originalSource: string,
    pairs: readonly TPair[],
    visitorName: string,
): EvaluatePairInstance<TPair> | LwcErrorTypeClass => {
    if (!ctx) {
        return LwcErrorTypeClass.create(
            'NULL_CHILD',
            'null',
            '',
            `${visitorName} に子要素がありません`,
            getSourceSpan(ctx, originalSource),
        );
    }

    const span = getSourceSpan(ctx, originalSource);
    const context = span?.context ?? '';

    let result: LwcCommonTypeClass<string, TypeField<string>> | LwcErrorTypeClass | undefined;

    try {
        for (const pair of pairs) {
            if (pair.isNode(ctx)) {
                result = pair.instance(ctx, originalSource);
                break;
            }
        }
        if (!result) {
            result = LwcErrorTypeClass.create(
                'UNSUPPORTED_CONTEXT',
                ctx.type,
                context,
                `${visitorName} は ${ctx.type} に対応していません`,
                span,
            );
        }
    } catch (error) {
        result = LwcErrorTypeClass.create(
            'EXCEPTION',
            ctx.type,
            context,
            error instanceof Error ? error.message : String(error),
            span,
        );
    }

    return result as EvaluatePairInstance<TPair> | LwcErrorTypeClass;
};

/** 必須の子ノード。実行時に null なら NULL_CHILD */
export const visitNode = <TPair extends AnyEvaluatePair>(
    ctx: Node | null | undefined,
    originalSource: string,
    pairs: readonly TPair[],
    visitorName: string,
): EvaluatePairInstance<TPair> | LwcErrorTypeClass =>
    visitWithPairs(ctx, originalSource, pairs, visitorName);

/** 省略できる子ノード。ないのは正常なので null のまま返す */
export const visitOptionalNode = <TPair extends AnyEvaluatePair>(
    ctx: Node | null | undefined,
    originalSource: string,
    pairs: readonly TPair[],
    visitorName: string,
): EvaluatePairInstance<TPair> | LwcErrorTypeClass | null =>
    ctx == null ? null : visitWithPairs(ctx, originalSource, pairs, visitorName);

/** 子ノードの配列。要素が null なら NULL_CHILD */
export const visitNodeList = <TPair extends AnyEvaluatePair>(
    ctxs: readonly (Node | null | undefined)[],
    originalSource: string,
    pairs: readonly TPair[],
    visitorName: string,
): (EvaluatePairInstance<TPair> | LwcErrorTypeClass)[] =>
    ctxs.map((ctx) => visitWithPairs(ctx, originalSource, pairs, visitorName));

/** 要素に null を許す子ノードの配列 (配列の穴 [a, , b] など)。null はそのまま残す */
export const visitNullableNodeList = <TPair extends AnyEvaluatePair>(
    ctxs: readonly (Node | null | undefined)[],
    originalSource: string,
    pairs: readonly TPair[],
    visitorName: string,
): (EvaluatePairInstance<TPair> | LwcErrorTypeClass | null)[] =>
    ctxs.map((ctx) =>
        ctx == null ? null : visitWithPairs(ctx, originalSource, pairs, visitorName),
    );

export abstract class LwcCommonVisitor<TEvaluatePair extends AnyEvaluatePair> {
    abstract readonly evaluatePair: readonly TEvaluatePair[];

    visit(
        ctx: Node | null | undefined,
        originalSource: string,
    ): EvaluatePairInstance<TEvaluatePair> | LwcErrorTypeClass {
        return visitWithPairs(ctx, originalSource, this.evaluatePair, this.constructor.name);
    }
}

/** IR の中の LwcErrorTypeClass を、ソースの順に集める (構文エラー・LWC の違反のリスナーは parser/Lwc/errorListener.ts) */
export const collectErrorTypeClasses = (
    root: LwcCommonTypeClass<string, TypeField<string>>,
): LwcErrorTypeClass[] => {
    const errors: LwcErrorTypeClass[] = [];
    const walk = (
        node: LwcCommonTypeClass<string, TypeField<string>>,
        parent: LwcCommonTypeClass<string, TypeField<string>> | null,
    ): void => {
        if (node instanceof LwcErrorTypeClass) {
            errors.push(node);
            return;
        }
        node.getChildNodes().forEach((child) => walk(child, node));
    };
    walk(root, null);
    return errors;
};
