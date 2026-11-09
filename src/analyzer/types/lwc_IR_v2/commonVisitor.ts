import type { Node, SourceLocation } from '@babel/types';

import {
    CommonTypeClass,
    type FieldsOf,
    type ErrorCode,
    IrBuildError,
    IrError,
    type TypeField,
    collectIrErrors,
    recoverIrBuild,
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
        properties: FieldsOf<TField> = {} as FieldsOf<TField>,
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

/** IR を作れなかったことを、区切りまで伝える */
const fail = (
    code: ErrorCode,
    contextType: string,
    ctx: Node | null | undefined,
    originalSource: string,
    message: string,
): never => {
    const span = getSourceSpan(ctx, originalSource);
    throw new IrBuildError(new IrError(code, contextType, span.context, message, span));
};

/**
 * ノードを、合う pair で TypeClass にする (別名 (Expression など) の振り分け)。
 * ノードがない (NULL_CHILD)・合う pair がない (UNSUPPORTED_CONTEXT) ときは IrBuildError を投げ、
 * 区切り (省略できる子・配列の要素・モジュール) まで伝える。解析木にエラーのノードは残さない。
 * ノード単位で例外は捕まえない (docs/ir-v2.md 4 章。errorRecovery の AST は型どおりで、
 * 壊したサンプルでもエラーのノードは出なかった。万一の例外はモジュールの変換 (buildLwcIr) で捕まえる)
 */
export const visitWithPairs = <TPair extends AnyEvaluatePair>(
    ctx: Node | null | undefined,
    originalSource: string,
    pairs: readonly TPair[],
    visitorName: string,
): EvaluatePairInstance<TPair> => {
    if (!ctx) {
        return fail(
            'NULL_CHILD',
            'null',
            ctx,
            originalSource,
            `${visitorName} に子要素がありません`,
        );
    }
    const pair = pairs.find((candidate) => candidate.isNode(ctx));
    if (!pair) {
        return fail(
            'UNSUPPORTED_CONTEXT',
            ctx.type,
            ctx,
            originalSource,
            `${visitorName} は ${ctx.type} に対応していません`,
        );
    }
    return pair.instance(ctx, originalSource) as EvaluatePairInstance<TPair>;
};

/** 必須の子ノード。作れなければ IrBuildError */
export const visitNode = <TPair extends AnyEvaluatePair>(
    ctx: Node | null | undefined,
    originalSource: string,
    pairs: readonly TPair[],
    visitorName: string,
): EvaluatePairInstance<TPair> => visitWithPairs(ctx, originalSource, pairs, visitorName);

/** 省略できる子ノード (区切り)。ないのは正常なので null。作れなければ IrError を集めて null */
export const visitOptionalNode = <TPair extends AnyEvaluatePair>(
    ctx: Node | null | undefined,
    originalSource: string,
    pairs: readonly TPair[],
    visitorName: string,
): EvaluatePairInstance<TPair> | null =>
    ctx == null
        ? null
        : recoverIrBuild(() => visitWithPairs(ctx, originalSource, pairs, visitorName), null);

/** 子ノードの配列 (区切り)。作れなかった要素は IrError を集めて除く */
export const visitNodeList = <TPair extends AnyEvaluatePair>(
    ctxs: readonly (Node | null | undefined)[],
    originalSource: string,
    pairs: readonly TPair[],
    visitorName: string,
): EvaluatePairInstance<TPair>[] =>
    ctxs.flatMap((ctx) =>
        recoverIrBuild(
            () => [visitWithPairs(ctx, originalSource, pairs, visitorName)],
            [] as EvaluatePairInstance<TPair>[],
        ),
    );

/**
 * 要素に null を許す子ノードの配列 (配列の穴 [a, , b] など。区切り)。null はそのまま残す。
 * 作れなかった要素も、位置を変えないよう null にする (IrError は集める)
 */
export const visitNullableNodeList = <TPair extends AnyEvaluatePair>(
    ctxs: readonly (Node | null | undefined)[],
    originalSource: string,
    pairs: readonly TPair[],
    visitorName: string,
): (EvaluatePairInstance<TPair> | null)[] =>
    ctxs.map((ctx) =>
        ctx == null
            ? null
            : recoverIrBuild(() => visitWithPairs(ctx, originalSource, pairs, visitorName), null),
    );

export abstract class LwcCommonVisitor<TEvaluatePair extends AnyEvaluatePair> {
    abstract readonly evaluatePair: readonly TEvaluatePair[];

    visit(
        ctx: Node | null | undefined,
        originalSource: string,
    ): EvaluatePairInstance<TEvaluatePair> {
        return visitWithPairs(ctx, originalSource, this.evaluatePair, this.constructor.name);
    }
}

/**
 * モジュール (ファイル) の IR を作り、作れなかったところ (IrError) を集める (リスナーが resolvedError にする)。
 * モジュールそのものを作れなかったときは result が null
 */
export const buildLwcIr = <TPair extends AnyEvaluatePair>(
    ast: Node,
    originalSource: string,
    pairs: readonly TPair[],
    visitorName: string,
): { result: EvaluatePairInstance<TPair> | null; errors: IrError[] } =>
    collectIrErrors(() => visitWithPairs(ast, originalSource, pairs, visitorName));
