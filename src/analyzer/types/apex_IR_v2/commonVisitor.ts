import { ApexParserBaseVisitor, ApexParserRuleContext } from '@apexdevtools/apex-parser';

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
import type { SourceSpan } from '../commons/source';

// Apex の IR の共通部分。方針: docs/ir-v2.md
// IR を作れなかったところ (構文エラーで子の ctx が null・create の例外・対応していない文脈) は、
// 解析木に残さない。IrBuildError で区切り (省略できる子・配列の要素・解析の単位) まで伝え、
// そこで IrError として集める (buildApexIr)。集めたものはリスナーが resolvedError にする

export class ApexCommonTypeClass<
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
            (target): target is ApexCommonTypeClass<string, TypeField<string>> =>
                target instanceof ApexCommonTypeClass,
        );
    }
}

type AnyApexTypeClass = ApexCommonTypeClass<string, TypeField<string>>;

export const isSpicifyApexCommonTypeClass = <
    TName extends string,
    TField extends TypeField<TName>,
    TApexCommonTypeClass extends ApexCommonTypeClass<TName, TField>,
>(
    type: TName,
    target: ApexCommonTypeClass<TName, TField>,
): target is TApexCommonTypeClass => {
    return target instanceof ApexCommonTypeClass && target.getType() === type;
};

/** IR を作れなかったことを、区切りまで伝える */
const fail = (
    code: ErrorCode,
    contextType: string,
    ctx: ApexParserRuleContext | null | undefined,
    message: string,
): never => {
    throw new IrBuildError(
        new IrError(code, contextType, ctx?.getText() ?? '', message, getSourceSpan(ctx)),
    );
};

/** create を呼ぶ。IrBuildError 以外の例外は、この ctx の EXCEPTION にする */
const createChecked = <TContext extends ApexParserRuleContext, T>(
    ctx: TContext | null | undefined,
    create: (ctx: TContext) => T,
    contextType: string,
): T => {
    if (!ctx) return fail('NULL_CHILD', contextType, ctx, `${contextType} がありません`);
    try {
        return create(ctx);
    } catch (error) {
        if (error instanceof IrBuildError) {
            // 子がない (NULL_CHILD) と位置が分からないので、位置の分かるいちばん近い親の位置にする
            // (リスナーが構文エラーの位置と重なるものを除けるように)
            if (error.error.span.start.offset >= 0) throw error;
            const { code, contextType, errorMessage } = error.error;
            throw new IrBuildError(
                new IrError(code, contextType, ctx.getText(), errorMessage, getSourceSpan(ctx)),
            );
        }
        return fail(
            'EXCEPTION',
            ctx.constructor.name,
            ctx,
            error instanceof Error ? error.message : String(error),
        );
    }
};

// ---------------------------------------------------------------------------
// 子ノードを create で作る (Visitor を通さない子)
// 構文エラーのあるソースでは、ANTLR の回復で子の ctx が null になったり (生成された getter は型の上では
// null にならないが、実行時は null を返す)、create の中の想定が崩れて例外になったりする
// (壊したサンプル 1,154 件で EXCEPTION 1,144・UNSUPPORTED_CONTEXT 155・NULL_CHILD 14)
// ---------------------------------------------------------------------------

/** 必須の子ノード。作れなければ IrBuildError を投げ、区切り (親の省略できる子・配列の要素・単位) まで伝える */
export const createNode = <TContext extends ApexParserRuleContext, T extends AnyApexTypeClass>(
    ctx: TContext | null | undefined,
    create: (ctx: TContext) => T,
    contextType: string,
): T => createChecked(ctx, create, contextType);

/** 省略できる子ノード (区切り)。ないのは正常なので null。作れなければ IrError を集めて null */
export const createOptionalNode = <
    TContext extends ApexParserRuleContext,
    T extends AnyApexTypeClass,
>(
    ctx: TContext | null | undefined,
    create: (ctx: TContext) => T,
    contextType: string,
): T | null => (ctx ? recoverIrBuild(() => createChecked(ctx, create, contextType), null) : null);

/** 子ノードの配列 (区切り)。作れなかった要素は IrError を集めて除く */
export const createNodeList = <TContext extends ApexParserRuleContext, T extends AnyApexTypeClass>(
    ctxs: readonly TContext[] | null | undefined,
    create: (ctx: TContext) => T,
    contextType: string,
): T[] =>
    (ctxs ?? []).flatMap((ctx) =>
        recoverIrBuild(() => [createChecked(ctx, create, contextType)], [] as T[]),
    );

// ---------------------------------------------------------------------------
// Visitor (文脈のクラスで振り分ける Expression・Primary)
// ---------------------------------------------------------------------------

/** visit を持つもの (各 Visitor)。visitNode などに渡す */
type ApexNodeVisitor = {
    visit: (ctx: ApexParserRuleContext) => AnyApexTypeClass;
};

/** Visitor の結果の型を確かめる (違えば TYPE_MISMATCH) */
const checkType = <T extends AnyApexTypeClass>(
    target: AnyApexTypeClass,
    isValidType: (target: AnyApexTypeClass) => target is T,
    type: string,
    ctx: ApexParserRuleContext,
): T =>
    isValidType(target)
        ? target
        : fail(
              'TYPE_MISMATCH',
              type,
              ctx,
              `想定していた型と違います 想定:${type} 実値:${target.getType()}`,
          );

/** 必須の子ノード (Visitor)。作れなければ IrBuildError */
export const visitNode = <T extends AnyApexTypeClass>(
    visitor: ApexNodeVisitor,
    ctx: ApexParserRuleContext | null | undefined,
    isValidType: (target: AnyApexTypeClass) => target is T,
    type: string,
): T => createChecked(ctx, (c) => checkType(visitor.visit(c), isValidType, type, c), type);

/** 省略できる子ノード (Visitor・区切り) */
export const visitOptionalNode = <T extends AnyApexTypeClass>(
    visitor: ApexNodeVisitor,
    ctx: ApexParserRuleContext | null | undefined,
    isValidType: (target: AnyApexTypeClass) => target is T,
    type: string,
): T | null =>
    ctx ? recoverIrBuild(() => visitNode(visitor, ctx, isValidType, type), null) : null;

/** 子ノードの配列 (Visitor・区切り)。作れなかった要素は除く */
export const visitNodeList = <T extends AnyApexTypeClass>(
    visitor: ApexNodeVisitor,
    ctxs: readonly ApexParserRuleContext[] | null | undefined,
    isValidType: (target: AnyApexTypeClass) => target is T,
    type: string,
): T[] =>
    (ctxs ?? []).flatMap((ctx) =>
        recoverIrBuild(() => [visitNode(visitor, ctx, isValidType, type)], [] as T[]),
    );

/**
 * 解析の単位 (compilationUnit・triggerUnit・anonymousUnit) の IR を作り、作れなかったところを集める。
 * 単位そのものを作れなかったときは result が null
 */
export const buildApexIr = <TContext extends ApexParserRuleContext, T extends AnyApexTypeClass>(
    ctx: TContext,
    create: (ctx: TContext) => T,
    contextType: string,
): { result: T | null; errors: IrError[] } =>
    collectIrErrors(() => createChecked(ctx, create, contextType));

export const getSourceSpan = (ctx: ApexParserRuleContext | null | undefined): SourceSpan => {
    const start = ctx?.start;
    if (!start) {
        return {
            context: '',
            start: { offset: -1, line: -1, column: -1 },
            end: { offset: -1, line: -1, column: -1 },
        };
    }

    const startPosition = { offset: start.start, line: start.line, column: start.column };
    const stop = ctx.stop;
    // 空のルール（例: 次元 0 の arraySubscripts）は stop が start より前のトークンになる
    if (!stop || stop.tokenIndex < start.tokenIndex) {
        return { context: '', start: startPosition, end: startPosition };
    }

    const lines = (stop.text ?? '').split('\n');
    const lastLine = lines[lines.length - 1] ?? '';
    // ctx.getText() はトークンをつなげた文字列で空白・改行・コメントを失うので、元のソースから切り出す
    const context = start.getInputStream()?.getText(start.start, stop.stop) ?? ctx!.getText();
    return {
        context,
        start: startPosition,
        end: {
            offset: stop.stop + 1,
            line: stop.line + lines.length - 1,
            column: lines.length > 1 ? lastLine.length : stop.column + lastLine.length,
        },
    };
};

/** 文脈のクラスで振り分ける Visitor の基底。対応していない文脈は UNSUPPORTED_CONTEXT の IrBuildError */
export class ApexCommonVisitor<T extends AnyApexTypeClass> extends ApexParserBaseVisitor<T> {
    override visit(ctx: ApexParserRuleContext): T {
        // 生成 getter は型上 non-null だが、任意の子要素が無いと実行時は null を返す
        if (!ctx) {
            return fail('NULL_CHILD', 'null', ctx, `${this.constructor.name} に子要素がありません`);
        }
        const visited: unknown = super.visit(ctx);
        // Visitor に visitXxx が無いと visitChildren の戻り値 (配列など) が返る
        if (visited instanceof ApexCommonTypeClass) return visited as T;
        return fail(
            'UNSUPPORTED_CONTEXT',
            ctx.constructor.name,
            ctx,
            `${this.constructor.name} は ${ctx.constructor.name} に対応していません`,
        );
    }
}
