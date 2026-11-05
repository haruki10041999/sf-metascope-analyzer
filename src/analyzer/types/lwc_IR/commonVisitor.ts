import type { ConvertErrorCode } from '../commons/converter';
import type { Node, SourceLocation } from '@babel/types';

import type { SourcePosition, SourceSpan } from '../commons/source';

// Babel の Position は SourcePosition と同じ基準 (line は 1 始まり、column / index は 0 始まり、
// loc.end は範囲の次の文字) なので、index を offset に移すだけでよい。Position 自体は export されていない
export const toSourcePosition = (position: SourceLocation['start']): SourcePosition => ({
    offset: position.index,
    line: position.line,
    column: position.column,
});

// Babel のノードは getText() を持たないため、元のソースから切り出す
export const getSourceSpan = (ctx: Node, source: string): SourceSpan | null => {
    if (!ctx.loc) {
        return null;
    }

    return {
        context: source.slice(ctx.loc.start.index, ctx.loc.end.index),
        start: toSourcePosition(ctx.loc.start),
        end: toSourcePosition(ctx.loc.end),
    };
};

export class LwcCommonTypeClass<TName extends string> {
    private type: TName;
    private span: SourceSpan | null = null;

    constructor(type: TName) {
        this.type = type;
    }

    getType(): TName {
        return this.type;
    }

    getSpan(): SourceSpan | null {
        return this.span;
    }

    setSpan(span: SourceSpan | null): void {
        this.span = span;
    }

    /** すべてのフィールド (Babel のフィールド名 → 値)。フィールドを持つクラスが上書きする */
    getFields(): Readonly<Record<string, unknown>> {
        return {};
    }

    /** 子のノード (フィールドの TypeClass と LwcErrorTypeClass。Apex の getChildNodes と同じ) */
    getChildNodes(): LwcCommonTypeClass<string>[] {
        return childrenOf(this.getFields());
    }
}

/** フィールドの値から、子のノードだけを取り出す (配列は平らにし、null・文字列などは除く) */
export const childrenOf = (fields: Record<string, unknown>): LwcCommonTypeClass<string>[] =>
    Object.values(fields)
        .flat()
        .filter(
            (value): value is LwcCommonTypeClass<string> => value instanceof LwcCommonTypeClass,
        );

/** IR を作れなかった理由。converter の ErrorType と共通 (types/commons/converter.ts) */
export type ErrorCode = ConvertErrorCode;

export class LwcErrorTypeClass extends LwcCommonTypeClass<'AnalyzerError'> {
    private code: ErrorCode;
    private contextType: string = '';
    private context: string = '';
    private errorMessage: string = '';

    private constructor(
        code: ErrorCode,
        contextType: string,
        context: string,
        errorMessage: string,
    ) {
        super('AnalyzerError');
        this.code = code;
        this.contextType = contextType;
        this.context = context;
        this.errorMessage = errorMessage;
    }

    static create(
        code: ErrorCode,
        contextType: string,
        context: string,
        errorMessage: string,
    ): LwcErrorTypeClass {
        return new LwcErrorTypeClass(code, contextType, context, errorMessage);
    }

    getCode(): ErrorCode {
        return this.code;
    }

    getContextType(): string {
        return this.contextType;
    }

    getContext(): string {
        return this.context;
    }

    getParseErrorMessage(): string {
        return this.errorMessage;
    }
}

export const isErrorType = (target: LwcCommonTypeClass<string>): target is LwcErrorTypeClass => {
    return target instanceof LwcErrorTypeClass;
};

export type EvaluatePair<
    TNode extends Node,
    TCommonTypeClass extends LwcCommonTypeClass<string>,
> = {
    isNode: (target: Node | null | undefined) => target is TNode;
    instance: (target: Node, originalSource: string) => TCommonTypeClass;
};

export const makeEvaluatePair = <
    TNode extends Node,
    TCommonTypeClass extends LwcCommonTypeClass<string>,
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
    instance: (target: Node, originalSource: string) => LwcCommonTypeClass<string>;
};

export type EvaluatePairInstance<TPair> = TPair extends {
    instance: (
        target: Node,
        originalSource: string,
    ) => infer TResult extends LwcCommonTypeClass<string>;
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
        );
    }

    const span = getSourceSpan(ctx, originalSource);
    const context = span?.context ?? '';

    let result: LwcCommonTypeClass<string> | LwcErrorTypeClass | undefined;

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
            );
        }
    } catch (error) {
        result = LwcErrorTypeClass.create(
            'EXCEPTION',
            ctx.type,
            context,
            error instanceof Error ? error.message : String(error),
        );
    }

    result.setSpan(span);

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
export const collectErrorTypeClasses = (root: LwcCommonTypeClass<string>): LwcErrorTypeClass[] => {
    const errors: LwcErrorTypeClass[] = [];
    const walk = (
        node: LwcCommonTypeClass<string>,
        parent: LwcCommonTypeClass<string> | null,
    ): void => {
        if (node instanceof LwcErrorTypeClass) {
            // NULL_CHILD は子がないので位置を持たない。親の位置にする
            if (!node.getSpan() && parent) {
                node.setSpan(parent.getSpan());
            }
            errors.push(node);
            return;
        }
        node.getChildNodes().forEach((child) => walk(child, node));
    };
    walk(root, null);
    return errors;
};
